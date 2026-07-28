package com.testplatform.service;

import com.testplatform.config.EngineProperties;
import com.testplatform.domain.RunStatus;
import com.testplatform.domain.TestRun;
import com.testplatform.dto.RunRequest;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
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

    // Runs execute one-at-a-time against the single engine checkout, so a
    // single-threaded queue keeps things simple and avoids report collisions.
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
                              PlatformTransactionManager transactionManager) {
        this.testRunRepository = testRunRepository;
        this.parserService = parserService;
        this.logBroadcastService = logBroadcastService;
        this.engineProperties = engineProperties;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    public TestRun enqueue(RunRequest request) {
        TestRun run = new TestRun();
        run.setStatus(RunStatus.QUEUED);
        run.setTagExpression(blankToNull(request.getTagExpression()));
        run.setBrowser(request.getBrowser());
        run.setHeadless(request.isHeadless());
        run.setParallelWorkers(Math.max(1, request.getParallelWorkers()));
        run.setScreenshotMode(request.getScreenshotMode());
        run.setVideoMode(request.getVideoMode());
        run.setTraceMode(request.getTraceMode());
        run.setBaseUrl(blankToNull(request.getBaseUrl()));
        run.setApiBaseUrl(blankToNull(request.getApiBaseUrl()));
        run.setTriggeredBy(request.getTriggeredBy());
        run.setStartedAt(Instant.now());
        run = testRunRepository.save(run);

        Long runId = run.getId();
        runQueue.submit(() -> executeRun(runId, request));
        return run;
    }

    public boolean cancel(Long runId) {
        Process process = runningProcesses.get(runId);
        if (process == null) return false;
        process.descendants().forEach(ProcessHandle::destroyForcibly);
        process.destroyForcibly();
        return true;
    }

    private void executeRun(Long runId, RunRequest request) {
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
            ProcessBuilder builder = buildProcess(request, reportDir);
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

    private ProcessBuilder buildProcess(RunRequest request, String reportDir) {
        List<String> command = new ArrayList<>(List.of(engineProperties.getCommand().split("\\s+")));
        if (request.getTagExpression() != null && !request.getTagExpression().isBlank()) {
            command.add("--tags");
            command.add(request.getTagExpression());
        }

        ProcessBuilder builder = new ProcessBuilder(command);
        builder.directory(new File(engineProperties.getWorkingDirectory()));

        Map<String, String> env = builder.environment();
        env.put("HEADLESS", String.valueOf(request.isHeadless()));
        env.put("BROWSER", request.getBrowser());
        env.put("SCREENSHOT", request.getScreenshotMode());
        env.put("VIDEO", request.getVideoMode());
        env.put("TRACE", request.getTraceMode());
        env.put("PARALLEL_WORKERS", String.valueOf(Math.max(1, request.getParallelWorkers())));
        env.put("REPORT_DIR", reportDir);
        if (request.getBaseUrl() != null && !request.getBaseUrl().isBlank()) {
            env.put("BASE_URL", request.getBaseUrl());
        }
        if (request.getApiBaseUrl() != null && !request.getApiBaseUrl().isBlank()) {
            env.put("API_BASE_URL", request.getApiBaseUrl());
        }
        return builder;
    }

    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value;
    }
}
