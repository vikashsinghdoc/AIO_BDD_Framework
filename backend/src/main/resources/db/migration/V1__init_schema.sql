CREATE TABLE test_run (
    id                  BIGSERIAL PRIMARY KEY,
    triggered_by        VARCHAR(255),
    status              VARCHAR(30)  NOT NULL,
    tag_expression       VARCHAR(500),
    browser             VARCHAR(20),
    headless            BOOLEAN      NOT NULL DEFAULT TRUE,
    parallel_workers    INTEGER      NOT NULL DEFAULT 1,
    screenshot_mode     VARCHAR(30),
    video_mode          VARCHAR(30),
    trace_mode          VARCHAR(30),
    base_url            VARCHAR(500),
    api_base_url        VARCHAR(500),
    started_at          TIMESTAMP    NOT NULL,
    finished_at         TIMESTAMP,
    duration_ms         BIGINT,
    exit_code           INTEGER,
    total_scenarios     INTEGER      NOT NULL DEFAULT 0,
    passed_scenarios    INTEGER      NOT NULL DEFAULT 0,
    failed_scenarios    INTEGER      NOT NULL DEFAULT 0,
    skipped_scenarios   INTEGER      NOT NULL DEFAULT 0,
    failure_reason      TEXT,
    console_log         TEXT,
    report_directory    VARCHAR(500)
);

CREATE TABLE feature_result (
    id            BIGSERIAL PRIMARY KEY,
    run_id        BIGINT NOT NULL REFERENCES test_run(id) ON DELETE CASCADE,
    uri           VARCHAR(1000),
    name          VARCHAR(1000),
    description   TEXT
);

CREATE TABLE scenario_result (
    id             BIGSERIAL PRIMARY KEY,
    feature_id     BIGINT NOT NULL REFERENCES feature_result(id) ON DELETE CASCADE,
    run_id         BIGINT NOT NULL REFERENCES test_run(id) ON DELETE CASCADE,
    name           VARCHAR(1000),
    status         VARCHAR(20) NOT NULL,
    line           INTEGER,
    duration_ms    BIGINT,
    error_message  TEXT,
    tags           TEXT
);

CREATE TABLE step_result (
    id             BIGSERIAL PRIMARY KEY,
    scenario_id    BIGINT NOT NULL REFERENCES scenario_result(id) ON DELETE CASCADE,
    keyword        VARCHAR(50),
    name           VARCHAR(2000),
    status         VARCHAR(20) NOT NULL,
    duration_ms    BIGINT,
    error_message  TEXT,
    step_order     INTEGER NOT NULL
);

CREATE TABLE attachment (
    id             BIGSERIAL PRIMARY KEY,
    scenario_id    BIGINT NOT NULL REFERENCES scenario_result(id) ON DELETE CASCADE,
    step_keyword   VARCHAR(50),
    mime_type      VARCHAR(100) NOT NULL,
    data           BYTEA NOT NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_scenario_run_id ON scenario_result(run_id);
CREATE INDEX idx_scenario_status ON scenario_result(status);
CREATE INDEX idx_feature_run_id ON feature_result(run_id);
CREATE INDEX idx_step_scenario_id ON step_result(scenario_id);
CREATE INDEX idx_attachment_scenario_id ON attachment(scenario_id);
CREATE INDEX idx_test_run_started_at ON test_run(started_at DESC);
CREATE INDEX idx_test_run_status ON test_run(status);
