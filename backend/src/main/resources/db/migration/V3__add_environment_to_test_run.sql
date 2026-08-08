-- Environment becomes a first-class execution concept: which named environment
-- (DEV/QA/UAT/STAGING/PROD — see engine/config/environments.yaml) a run targeted.
ALTER TABLE test_run ADD COLUMN environment VARCHAR(50);
CREATE INDEX idx_test_run_environment ON test_run(environment);

-- CREATE OR REPLACE VIEW only allows appending trailing columns (it cannot reorder or
-- remove existing ones), so run_environment is added at the end of each SELECT list,
-- not alongside the other run_* columns it conceptually belongs with.

CREATE OR REPLACE VIEW v_scenario_detail AS
SELECT
    sr.id                AS scenario_id,
    sr.run_id             AS run_id,
    tr.status             AS run_status,
    tr.tag_expression     AS run_tag_expression,
    tr.browser            AS run_browser,
    tr.headless           AS run_headless,
    tr.started_at         AS run_started_at,
    tr.finished_at        AS run_finished_at,
    tr.triggered_by       AS run_triggered_by,
    fr.id                 AS feature_id,
    fr.name               AS feature_name,
    fr.uri                AS feature_uri,
    sr.name               AS scenario_name,
    sr.status              AS scenario_status,
    sr.line                AS scenario_line,
    sr.duration_ms          AS scenario_duration_ms,
    sr.error_message        AS scenario_error_message,
    sr.tags                 AS scenario_tags,
    (SELECT COUNT(*) FROM attachment a WHERE a.scenario_id = sr.id) AS attachment_count,
    tr.environment           AS run_environment
FROM scenario_result sr
JOIN feature_result fr ON fr.id = sr.feature_id
JOIN test_run tr ON tr.id = sr.run_id;

CREATE OR REPLACE VIEW v_step_detail AS
SELECT
    st.id                    AS id,
    sd.run_id                AS run_id,
    sd.run_status             AS run_status,
    sd.run_tag_expression     AS run_tag_expression,
    sd.run_browser            AS run_browser,
    sd.run_started_at         AS run_started_at,
    sd.run_triggered_by       AS run_triggered_by,
    sd.feature_id             AS feature_id,
    sd.feature_name           AS feature_name,
    sd.scenario_id            AS scenario_id,
    sd.scenario_name          AS scenario_name,
    sd.scenario_status         AS scenario_status,
    sd.scenario_tags           AS scenario_tags,
    sd.attachment_count        AS attachment_count,
    st.step_order              AS step_order,
    st.keyword                 AS step_keyword,
    st.name                    AS step_name,
    st.status                  AS step_status,
    st.duration_ms               AS step_duration_ms,
    st.error_message             AS step_error_message,
    sd.run_environment           AS run_environment
FROM step_result st
JOIN v_scenario_detail sd ON sd.scenario_id = st.scenario_id;
