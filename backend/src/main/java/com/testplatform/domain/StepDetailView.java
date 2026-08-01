package com.testplatform.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.Immutable;

import java.time.Instant;

/**
 * Maps to the {@code v_step_detail} view (see V2__reporting_views.sql) — one
 * row per step, flattened with its parent scenario/feature/run. Read-only:
 * this is a reporting projection, never written to via JPA.
 */
@Entity
@Immutable
@Table(name = "v_step_detail")
public class StepDetailView {

    @Id
    private Long id;

    private Long runId;

    @Enumerated(EnumType.STRING)
    private RunStatus runStatus;

    private String runTagExpression;
    private String runBrowser;
    private Instant runStartedAt;
    private String runTriggeredBy;

    private Long featureId;
    private String featureName;

    private Long scenarioId;
    private String scenarioName;

    @Enumerated(EnumType.STRING)
    private ExecutionStatus scenarioStatus;

    private String scenarioTags;
    private Long attachmentCount;

    private Integer stepOrder;
    private String stepKeyword;

    @Column(columnDefinition = "TEXT")
    private String stepName;

    @Enumerated(EnumType.STRING)
    private ExecutionStatus stepStatus;

    private Long stepDurationMs;

    @Column(columnDefinition = "TEXT")
    private String stepErrorMessage;

    public Long getId() { return id; }
    public Long getRunId() { return runId; }
    public RunStatus getRunStatus() { return runStatus; }
    public String getRunTagExpression() { return runTagExpression; }
    public String getRunBrowser() { return runBrowser; }
    public Instant getRunStartedAt() { return runStartedAt; }
    public String getRunTriggeredBy() { return runTriggeredBy; }
    public Long getFeatureId() { return featureId; }
    public String getFeatureName() { return featureName; }
    public Long getScenarioId() { return scenarioId; }
    public String getScenarioName() { return scenarioName; }
    public ExecutionStatus getScenarioStatus() { return scenarioStatus; }
    public String getScenarioTags() { return scenarioTags; }
    public Long getAttachmentCount() { return attachmentCount; }
    public Integer getStepOrder() { return stepOrder; }
    public String getStepKeyword() { return stepKeyword; }
    public String getStepName() { return stepName; }
    public ExecutionStatus getStepStatus() { return stepStatus; }
    public Long getStepDurationMs() { return stepDurationMs; }
    public String getStepErrorMessage() { return stepErrorMessage; }
}
