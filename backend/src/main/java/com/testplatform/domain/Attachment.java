package com.testplatform.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "attachment")
public class Attachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scenario_id", nullable = false)
    private ScenarioResult scenario;

    private String stepKeyword;

    private String mimeType;

    @Column(nullable = false, columnDefinition = "bytea")
    private byte[] data;

    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ScenarioResult getScenario() { return scenario; }
    public void setScenario(ScenarioResult scenario) { this.scenario = scenario; }

    public String getStepKeyword() { return stepKeyword; }
    public void setStepKeyword(String stepKeyword) { this.stepKeyword = stepKeyword; }

    public String getMimeType() { return mimeType; }
    public void setMimeType(String mimeType) { this.mimeType = mimeType; }

    public byte[] getData() { return data; }
    public void setData(byte[] data) { this.data = data; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
