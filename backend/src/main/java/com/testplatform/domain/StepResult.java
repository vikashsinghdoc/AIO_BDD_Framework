package com.testplatform.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "step_result")
public class StepResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scenario_id", nullable = false)
    private ScenarioResult scenario;

    private String keyword;

    @Column(columnDefinition = "TEXT")
    private String name;

    @Enumerated(EnumType.STRING)
    private ExecutionStatus status;

    private Long durationMs;

    @Column(columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "step_order")
    private int order;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ScenarioResult getScenario() { return scenario; }
    public void setScenario(ScenarioResult scenario) { this.scenario = scenario; }

    public String getKeyword() { return keyword; }
    public void setKeyword(String keyword) { this.keyword = keyword; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public ExecutionStatus getStatus() { return status; }
    public void setStatus(ExecutionStatus status) { this.status = status; }

    public Long getDurationMs() { return durationMs; }
    public void setDurationMs(Long durationMs) { this.durationMs = durationMs; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public int getOrder() { return order; }
    public void setOrder(int order) { this.order = order; }
}
