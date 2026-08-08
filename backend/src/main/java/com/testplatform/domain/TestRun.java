package com.testplatform.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "test_run")
public class TestRun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String triggeredBy;

    /** Named environment (DEV/QA/UAT/...) this run targeted — see EnvironmentConfigService. */
    private String environment;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExecutionMode executionMode = ExecutionMode.STANDARD;

    /** Populated only for VISUAL_DEBUG runs — the exact scenario targeted. */
    private String scenarioUri;
    private Integer scenarioLine;

    @Enumerated(EnumType.STRING)
    private RunStatus status;

    @Column(name = "tag_expression")
    private String tagExpression;

    private String browser;
    private boolean headless;
    private int parallelWorkers;

    private String screenshotMode;
    private String videoMode;
    private String traceMode;

    private String baseUrl;
    private String apiBaseUrl;

    private Instant startedAt;
    private Instant finishedAt;
    private Long durationMs;
    private Integer exitCode;

    private int totalScenarios;
    private int passedScenarios;
    private int failedScenarios;
    private int skippedScenarios;

    @Column(columnDefinition = "TEXT")
    private String failureReason;

    @Column(columnDefinition = "TEXT")
    private String consoleLog;

    private String reportDirectory;

    @OneToMany(mappedBy = "run", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FeatureResult> features = new ArrayList<>();

    // --- getters / setters -------------------------------------------------

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTriggeredBy() { return triggeredBy; }
    public void setTriggeredBy(String triggeredBy) { this.triggeredBy = triggeredBy; }

    public String getEnvironment() { return environment; }
    public void setEnvironment(String environment) { this.environment = environment; }

    public ExecutionMode getExecutionMode() { return executionMode; }
    public void setExecutionMode(ExecutionMode executionMode) { this.executionMode = executionMode; }

    public String getScenarioUri() { return scenarioUri; }
    public void setScenarioUri(String scenarioUri) { this.scenarioUri = scenarioUri; }

    public Integer getScenarioLine() { return scenarioLine; }
    public void setScenarioLine(Integer scenarioLine) { this.scenarioLine = scenarioLine; }

    public RunStatus getStatus() { return status; }
    public void setStatus(RunStatus status) { this.status = status; }

    public String getTagExpression() { return tagExpression; }
    public void setTagExpression(String tagExpression) { this.tagExpression = tagExpression; }

    public String getBrowser() { return browser; }
    public void setBrowser(String browser) { this.browser = browser; }

    public boolean isHeadless() { return headless; }
    public void setHeadless(boolean headless) { this.headless = headless; }

    public int getParallelWorkers() { return parallelWorkers; }
    public void setParallelWorkers(int parallelWorkers) { this.parallelWorkers = parallelWorkers; }

    public String getScreenshotMode() { return screenshotMode; }
    public void setScreenshotMode(String screenshotMode) { this.screenshotMode = screenshotMode; }

    public String getVideoMode() { return videoMode; }
    public void setVideoMode(String videoMode) { this.videoMode = videoMode; }

    public String getTraceMode() { return traceMode; }
    public void setTraceMode(String traceMode) { this.traceMode = traceMode; }

    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }

    public String getApiBaseUrl() { return apiBaseUrl; }
    public void setApiBaseUrl(String apiBaseUrl) { this.apiBaseUrl = apiBaseUrl; }

    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }

    public Instant getFinishedAt() { return finishedAt; }
    public void setFinishedAt(Instant finishedAt) { this.finishedAt = finishedAt; }

    public Long getDurationMs() { return durationMs; }
    public void setDurationMs(Long durationMs) { this.durationMs = durationMs; }

    public Integer getExitCode() { return exitCode; }
    public void setExitCode(Integer exitCode) { this.exitCode = exitCode; }

    public int getTotalScenarios() { return totalScenarios; }
    public void setTotalScenarios(int totalScenarios) { this.totalScenarios = totalScenarios; }

    public int getPassedScenarios() { return passedScenarios; }
    public void setPassedScenarios(int passedScenarios) { this.passedScenarios = passedScenarios; }

    public int getFailedScenarios() { return failedScenarios; }
    public void setFailedScenarios(int failedScenarios) { this.failedScenarios = failedScenarios; }

    public int getSkippedScenarios() { return skippedScenarios; }
    public void setSkippedScenarios(int skippedScenarios) { this.skippedScenarios = skippedScenarios; }

    public String getFailureReason() { return failureReason; }
    public void setFailureReason(String failureReason) { this.failureReason = failureReason; }

    public String getConsoleLog() { return consoleLog; }
    public void setConsoleLog(String consoleLog) { this.consoleLog = consoleLog; }

    public String getReportDirectory() { return reportDirectory; }
    public void setReportDirectory(String reportDirectory) { this.reportDirectory = reportDirectory; }

    public List<FeatureResult> getFeatures() { return features; }
    public void setFeatures(List<FeatureResult> features) { this.features = features; }
}
