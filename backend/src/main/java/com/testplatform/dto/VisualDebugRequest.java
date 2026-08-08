package com.testplatform.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Payload to trigger a Visual Debug run. Deliberately not an extension of RunRequest —
 * no tag expression, no parallel workers, no browser choice. Browser (chromium),
 * headless (true), and parallelWorkers (1) are forced server-side in
 * TestRunnerService.enqueueVisualDebug, not accepted from the client.
 *
 * scenarioLine is intentionally nullable, not required: the picker always sends a
 * concrete line (so normal use is unambiguous by construction), but the backend still
 * matches by uri (+ line when present) against the live scenario catalog rather than
 * trusting the client — a request that omits scenarioLine legitimately resolves to
 * every scenario in that feature file, which is exactly the ">1 matches" case that
 * must be rejected even when it didn't come from the picker.
 */
public class VisualDebugRequest {

    @NotBlank(message = "environment is required")
    private String environment;

    @NotBlank(message = "scenarioUri is required")
    private String scenarioUri;

    private Integer scenarioLine;

    private String triggeredBy = "web-ui";

    public String getEnvironment() { return environment; }
    public void setEnvironment(String environment) { this.environment = environment; }

    public String getScenarioUri() { return scenarioUri; }
    public void setScenarioUri(String scenarioUri) { this.scenarioUri = scenarioUri; }

    public Integer getScenarioLine() { return scenarioLine; }
    public void setScenarioLine(Integer scenarioLine) { this.scenarioLine = scenarioLine; }

    public String getTriggeredBy() { return triggeredBy; }
    public void setTriggeredBy(String triggeredBy) { this.triggeredBy = triggeredBy; }
}
