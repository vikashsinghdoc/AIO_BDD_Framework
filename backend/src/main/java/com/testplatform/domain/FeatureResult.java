package com.testplatform.domain;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "feature_result")
public class FeatureResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "run_id", nullable = false)
    private TestRun run;

    private String uri;
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @OneToMany(mappedBy = "feature", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ScenarioResult> scenarios = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public TestRun getRun() { return run; }
    public void setRun(TestRun run) { this.run = run; }

    public String getUri() { return uri; }
    public void setUri(String uri) { this.uri = uri; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public List<ScenarioResult> getScenarios() { return scenarios; }
    public void setScenarios(List<ScenarioResult> scenarios) { this.scenarios = scenarios; }
}
