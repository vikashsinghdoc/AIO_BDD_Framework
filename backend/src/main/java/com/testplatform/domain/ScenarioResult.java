package com.testplatform.domain;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "scenario_result")
public class ScenarioResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "feature_id", nullable = false)
    private FeatureResult feature;

    /** Denormalized for cheap filtering without a join back through feature. */
    @Column(name = "run_id", nullable = false)
    private Long runId;

    private String name;

    @Enumerated(EnumType.STRING)
    private ExecutionStatus status;

    private Integer line;
    private Long durationMs;

    @Column(columnDefinition = "TEXT")
    private String errorMessage;

    /** Comma-separated tag list, e.g. "@ui,@smoke". */
    @Column(columnDefinition = "TEXT")
    private String tags;

    @OneToMany(mappedBy = "scenario", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<StepResult> steps = new ArrayList<>();

    @OneToMany(mappedBy = "scenario", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Attachment> attachments = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public FeatureResult getFeature() { return feature; }
    public void setFeature(FeatureResult feature) { this.feature = feature; }

    public Long getRunId() { return runId; }
    public void setRunId(Long runId) { this.runId = runId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public ExecutionStatus getStatus() { return status; }
    public void setStatus(ExecutionStatus status) { this.status = status; }

    public Integer getLine() { return line; }
    public void setLine(Integer line) { this.line = line; }

    public Long getDurationMs() { return durationMs; }
    public void setDurationMs(Long durationMs) { this.durationMs = durationMs; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }

    public List<StepResult> getSteps() { return steps; }
    public void setSteps(List<StepResult> steps) { this.steps = steps; }

    public List<Attachment> getAttachments() { return attachments; }
    public void setAttachments(List<Attachment> attachments) { this.attachments = attachments; }
}
