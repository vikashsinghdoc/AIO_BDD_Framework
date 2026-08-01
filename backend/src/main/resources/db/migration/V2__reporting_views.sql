-- Flattened, query-friendly views on top of the normalized run/feature/scenario/step
-- tables. Two consumers read these:
--   1) the backend's Steps Explorer API (StepDetailView entity, read-only)
--   2) Grafana panels, querying Postgres directly (see grafana/dashboards/*.json)
-- Keeping this logic in SQL views means both stay in sync automatically as new
-- runs land, with no duplicated aggregation code.

CREATE VIEW v_scenario_detail AS
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
    (SELECT COUNT(*) FROM attachment a WHERE a.scenario_id = sr.id) AS attachment_count
FROM scenario_result sr
JOIN feature_result fr ON fr.id = sr.feature_id
JOIN test_run tr ON tr.id = sr.run_id;

CREATE VIEW v_step_detail AS
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
    st.error_message             AS step_error_message
FROM step_result st
JOIN v_scenario_detail sd ON sd.scenario_id = st.scenario_id;

-- Daily run/scenario aggregate — drives pass-rate-over-time and volume panels.
CREATE VIEW v_run_daily_stats AS
SELECT
    date_trunc('day', started_at)                                   AS day,
    COUNT(*)                                                         AS run_count,
    SUM(total_scenarios)                                             AS total_scenarios,
    SUM(passed_scenarios)                                            AS passed_scenarios,
    SUM(failed_scenarios)                                            AS failed_scenarios,
    SUM(skipped_scenarios)                                           AS skipped_scenarios,
    CASE WHEN SUM(total_scenarios) > 0
         THEN ROUND(100.0 * SUM(passed_scenarios) / SUM(total_scenarios), 2)
         ELSE NULL END                                               AS pass_rate_pct,
    ROUND(AVG(duration_ms))                                          AS avg_duration_ms
FROM test_run
WHERE finished_at IS NOT NULL
GROUP BY date_trunc('day', started_at);

-- Per-tag failure counts — drives the "flakiest / most-failing tags" panel.
-- scenario_result.tags is a comma-separated string, hence the unnest.
CREATE VIEW v_tag_failure_stats AS
SELECT
    trim(tag)                          AS tag,
    date_trunc('day', sd.run_started_at) AS day,
    COUNT(*) FILTER (WHERE sd.scenario_status = 'FAILED')  AS failed_count,
    COUNT(*)                                                AS total_count
FROM v_scenario_detail sd
CROSS JOIN LATERAL unnest(string_to_array(NULLIF(sd.scenario_tags, ''), ',')) AS tag
GROUP BY trim(tag), date_trunc('day', sd.run_started_at);

-- Per-step-keyword failure counts — helps spot which step definitions are flaky.
CREATE VIEW v_step_failure_stats AS
SELECT
    step_keyword,
    date_trunc('day', run_started_at)                        AS day,
    COUNT(*) FILTER (WHERE step_status = 'FAILED')            AS failed_count,
    COUNT(*)                                                   AS total_count
FROM v_step_detail
GROUP BY step_keyword, date_trunc('day', run_started_at);
