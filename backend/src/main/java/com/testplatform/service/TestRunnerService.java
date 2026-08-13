package com.testplatform.service;

import com.testplatform.config.EngineProperties;
import com.testplatform.domain.ExecutionMode;
import com.testplatform.domain.RunStatus;
import com.testplatform.domain.TestRun;
import com.testplatform.dto.RunRequest;
import com.testplatform.dto.ScenarioCatalogEntryDto;
import com.testplatform.dto.VisualDebugRequest;
import com.testplatform.exception.VisualDebugValidationException;
import com.testplatform.repository.TestRunRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@Service
public class TestRunnerService {

    private static final Logger log = LoggerFactory.getLogger(TestRunnerService.class);

    private final TestRunRepository testRunRepository;
    private final CucumberJsonParserService parserService;
    private final LogBroadcastService logBroadcastService;
    private final EngineProperties engineProperties;
    private final EnvironmentConfigService environmentConfigService;
    private final ScenarioCatalogService scenarioCatalogService;

    // Runs execute one-at-a-time against the single engine checkout, so a
    // single-threaded queue keeps things simple and avoids report collisions. Visual
    // Debug runs share this same queue — they're still "one engine process at a time,"
    // just with a different Cucumber target and forced single-scenario/single-worker
    // settings, not a separate execution lane.
    private final ExecutorService runQueue = Executors.newSingleThreadExecutor(r -> {
        Thread t = new Thread(r, "cucumber-run-queue");
        t.setDaemon(true);
        return t;
    });

    private final Map<Long, Process> runningProcesses = new ConcurrentHashMap<>();
    private final TransactionTemplate transactionTemplate;

    public TestRunnerService(TestRunRepository testRunRepository,
                              CucumberJsonParserService parserService,
                              LogBroadcastService logBroadcastService,
                              EngineProperties engineProperties,
                              EnvironmentConfigService environmentConfigService,
                              ScenarioCatalogService scenarioCatalogService,
                              PlatformTransactionManager transactionManager) {
        this.testRunRepository = testRunRepository;
        this.parserService = parserService;
        this.logBroadcastService = logBroadcastService;
        this.engineProperties = engineProperties;
        this.environmentConfigService = environmentConfigService;
        this.scenarioCatalogService = scenarioCatalogService;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    public TestRun enqueue(RunRequest request) {
        // Resolve before creating any DB row: an unknown/unconfigured environment
        // should fail fast (400) rather than leave a QUEUED run that can never succeed.
        EnvironmentConfigService.ResolvedEnvironment resolvedEnvironment =
                environmentConfigService.resolve(request.getEnvironment());

        TestRun run = new TestRun();
        run.setExecutionMode(ExecutionMode.STANDARD);
        run.setStatus(RunStatus.QUEUED);
        run.setEnvironment(request.getEnvironment());
        run.setTagExpression(blankToNull(request.getTagExpression()));
        run.setBrowser(request.getBrowser());
        run.setHeadless(request.isHeadless());
        run.setParallelWorkers(Math.max(1, request.getParallelWorkers()));
        run.setScreenshotMode(request.getScreenshotMode());
        run.setVideoMode(request.getVideoMode());
        run.setTraceMode(request.getTraceMode());
        run.setBaseUrl(resolvedEnvironment.baseUrl());
        run.setApiBaseUrl(resolvedEnvironment.apiBaseUrl());
        run.setTriggeredBy(request.getTriggeredBy());
        run.setStartedAt(Instant.now());
        run = testRunRepository.save(run);

        Long runId = run.getId();
        runQueue.submit(() -> executeRun(runId));
        return run;
    }

    /**
     * Visual Debug: exactly one scenario, one browser session, no parallel workers.
     * Validated against the live scenario catalog — not just the frontend picker —
     * before any TestRun row or process is created, so this can't be bypassed by
     * calling the API directly. See VisualDebugRequest for why scenarioLine is
     * nullable and what that means for matching.
     */
    public TestRun enqueueVisualDebug(VisualDebugRequest request) {
        EnvironmentConfigService.ResolvedEnvironment resolvedEnvironment =
                environmentConfigService.resolve(request.getEnvironment());

        List<ScenarioCatalogEntryDto> matches = scenarioCatalogService.listScenarios().stream()
                .filter(s -> Objects.equals(s.uri(), request.getScenarioUri()))
                .filter(s -> request.getScenarioLine() == null || Objects.equals(s.line(), request.getScenarioLine()))
                .toList();

        if (matches.isEmpty()) {
            throw new VisualDebugValidationException(
                    "That scenario could not be found. It may have been renamed, moved, or removed — refresh and select again.");
        }
        if (matches.size() > 1) {
            throw new VisualDebugValidationException(
                    "Visual Debug supports one scenario at a time. Your selection matches multiple scenarios. "
                            + "Please select a single scenario to continue.");
        }

        ScenarioCatalogEntryDto scenario = matches.get(0);

        TestRun run = new TestRun();
        run.setExecutionMode(ExecutionMode.VISUAL_DEBUG);
        run.setStatus(RunStatus.QUEUED);
        run.setEnvironment(request.getEnvironment());
        run.setScenarioUri(scenario.uri());
        run.setScenarioLine(scenario.line());
        // Forced, not user-choosable: Visual Debug is defined as one scenario, one
        // chromium session, no parallelism — see plan/CLAUDE.md Architectural Decisions.
        run.setBrowser("chromium");
        run.setHeadless(true);
        run.setParallelWorkers(1);
        run.setScreenshotMode("only-on-failure");
        run.setVideoMode("off");
        run.setTraceMode("off");
        run.setBaseUrl(resolvedEnvironment.baseUrl());
        run.setApiBaseUrl(resolvedEnvironment.apiBaseUrl());
        run.setTriggeredBy(request.getTriggeredBy());
        run.setStartedAt(Instant.now());
        run = testRunRepository.save(run);

        Long runId = run.getId();
        runQueue.submit(() -> executeRun(runId));
        return run;
    }

    public boolean cancel(Long runId) {
        Process process = runningProcesses.get(runId);
        if (process == null) return false;
        process.descendants().forEach(ProcessHandle::destroyForcibly);
        process.destroyForcibly();
        return true;
    }

    private void executeRun(Long runId) {
        TestRun run = testRunRepository.findById(runId).orElse(null);
        if (run == null) return;

        run.setStatus(RunStatus.RUNNING);
        run.setStartedAt(Instant.now());
        String reportDir = engineProperties.getReportsSubdirectory() + "/run-" + runId;
        run.setReportDirectory(reportDir);
        testRunRepository.save(run);
        logBroadcastService.publish(runId, "=== Starting run #" + runId + " ===");

        StringBuilder consoleLog = new StringBuilder();
        int exitCode;
        boolean timedOut = false;

        try {
            ProcessBuilder builder = buildProcess(run, reportDir);
            logBroadcastService.publish(runId, "$ " + String.join(" ", builder.command()));
            builder.redirectErrorStream(true);
            Process process = builder.start();
            runningProcesses.put(runId, process);

            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    consoleLog.append(line).append("\n");
                    logBroadcastService.publish(runId, line);
                }
            }

            boolean finished = process.waitFor(engineProperties.getTimeoutMinutes(), TimeUnit.MINUTES);
            if (!finished) {
                timedOut = true;
                process.descendants().forEach(ProcessHandle::destroyForcibly);
                process.destroyForcibly();
                logBroadcastService.publish(runId, "!!! Run exceeded " + engineProperties.getTimeoutMinutes() + " minute timeout and was killed.");
            }
            exitCode = finished ? process.exitValue() : -1;
        } catch (IOException | InterruptedException ex) {
            log.error("Failed to execute run {}", runId, ex);
            logBroadcastService.publish(runId, "!!! Failed to launch test process: " + ex.getMessage());
            exitCode = -1;
            consoleLog.append("Failed to launch test process: ").append(ex.getMessage()).append("\n");
        } finally {
            runningProcesses.remove(runId);
        }

        finalizeRun(runId, reportDir, consoleLog.toString(), exitCode, timedOut);
    }

    private void finalizeRun(Long runId, String reportDir, String consoleLog, int exitCode, boolean timedOut) {
        transactionTemplate.executeWithoutResult(status -> {
            TestRun run = testRunRepository.findById(runId).orElse(null);
            if (run == null) return;

            File cucumberJson = Path.of(engineProperties.getWorkingDirectory(), reportDir, "cucumber.json").toFile();
            CucumberJsonParserService.ParseResult parsed = parserService.parse(cucumberJson, run);

            run.getFeatures().clear();
            run.getFeatures().addAll(parsed.features);
            run.setTotalScenarios(parsed.total);
            run.setPassedScenarios(parsed.passed);
            run.setFailedScenarios(parsed.failed);
            run.setSkippedScenarios(parsed.skipped);
            run.setExitCode(exitCode);
            run.setFinishedAt(Instant.now());
            run.setDurationMs(ChronoUnit.MILLIS.between(run.getStartedAt(), run.getFinishedAt()));
            run.setConsoleLog(consoleLog.length() > 2_000_000 ? consoleLog.substring(consoleLog.length() - 2_000_000) : consoleLog);

            RunStatus runStatus;
            if (timedOut) {
                runStatus = RunStatus.ERRORED;
                run.setFailureReason("Run exceeded the configured timeout and was terminated.");
            } else if (parsed.total == 0) {
                runStatus = RunStatus.ERRORED;
                run.setFailureReason("No scenarios were executed. Check the tag expression and console log for setup errors.");
            } else if (parsed.failed > 0) {
                runStatus = RunStatus.FAILED;
            } else {
                runStatus = RunStatus.PASSED;
            }
            run.setStatus(runStatus);

            testRunRepository.save(run);
            logBroadcastService.publish(runId, "=== Run #" + runId + " finished: " + runStatus + " ===");
            logBroadcastService.complete(runId, runStatus.name());
        });
    }

    private ProcessBuilder buildProcess(TestRun run, String reportDir) {
        List<String> command = engineProperties.commandTokens();
        if (run.getExecutionMode() != ExecutionMode.VISUAL_DEBUG
                && run.getTagExpression() != null && !run.getTagExpression().isBlank()) {
            command.add("--tags");
            command.add(run.getTagExpression());
        }

        ProcessBuilder builder = new ProcessBuilder(command);
        builder.directory(new File(engineProperties.getWorkingDirectory()));

        Map<String, String> env = builder.environment();
        env.put("HEADLESS", String.valueOf(run.isHeadless()));
        env.put("BROWSER", run.getBrowser());
        env.put("SCREENSHOT", run.getScreenshotMode());
        env.put("VIDEO", run.getVideoMode());
        env.put("TRACE", run.getTraceMode());
        env.put("PARALLEL_WORKERS", String.valueOf(Math.max(1, run.getParallelWorkers())));
        env.put("REPORT_DIR", reportDir);
        env.put("BASE_URL", run.getBaseUrl());
        env.put("API_BASE_URL", run.getApiBaseUrl());
        if (run.getExecutionMode() == ExecutionMode.VISUAL_DEBUG) {
            // A CLI positional path argument is NOT sufficient to restrict Cucumber to
            // one scenario here — cucumber.cjs's own `paths` (features/**/*.feature)
            // still applies alongside it, so the whole suite would run. CUCUMBER_TARGET
            // overrides `paths` itself instead — see cucumber.cjs for why.
            env.put("CUCUMBER_TARGET", run.getScenarioUri() + ":" + run.getScenarioLine());
        }
        return builder;
    }

    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value;
    }
}
