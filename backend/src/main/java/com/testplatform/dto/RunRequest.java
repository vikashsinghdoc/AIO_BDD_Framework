package com.testplatform.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;

/** Payload the UI submits to trigger a new run. */
public class RunRequest {

    /** Cucumber tag expression, e.g. "@ui and not @wip". Blank = run everything. */
    private String tagExpression;

    @Pattern(regexp = "chromium|firefox|webkit", message = "browser must be chromium, firefox or webkit")
    private String browser = "chromium";

    private boolean headless = true;

    @Min(value = 1, message = "parallelWorkers must be at least 1")
    private int parallelWorkers = 1;

    @Pattern(regexp = "off|on|only-on-failure")
    private String screenshotMode = "only-on-failure";

    @Pattern(regexp = "off|on|retain-on-failure")
    private String videoMode = "off";

    @Pattern(regexp = "off|on|retain-on-failure")
    private String traceMode = "off";

    private String baseUrl;
    private String apiBaseUrl;
    private String triggeredBy = "web-ui";

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

    public String getTriggeredBy() { return triggeredBy; }
    public void setTriggeredBy(String triggeredBy) { this.triggeredBy = triggeredBy; }
}
