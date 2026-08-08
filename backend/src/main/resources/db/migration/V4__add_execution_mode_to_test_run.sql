-- Visual Debug becomes a second execution mode alongside Standard: exactly one
-- scenario, one browser session, no parallel workers. Both modes persist to the same
-- test_run table (a Visual Debug run is still a TestRun row), so History/Dashboard/
-- Grafana keep working unchanged for it.
ALTER TABLE test_run ADD COLUMN execution_mode VARCHAR(20) NOT NULL DEFAULT 'STANDARD';
ALTER TABLE test_run ADD COLUMN scenario_uri VARCHAR(500);
ALTER TABLE test_run ADD COLUMN scenario_line INTEGER;

CREATE INDEX idx_test_run_execution_mode ON test_run(execution_mode);
