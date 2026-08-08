require("dotenv").config();

const requestedWorkers = Number.parseInt(process.env.PARALLEL_WORKERS ?? "1", 10);
const parallel = Number.isSafeInteger(requestedWorkers) && requestedWorkers > 0 ? requestedWorkers : 1;

// REPORT_DIR lets the orchestrating backend point each run at its own output
// folder (e.g. reports/run-42) so run artifacts never collide.
const reportDir = process.env.REPORT_DIR ?? "reports";

// CUCUMBER_TARGET lets Visual Debug (TestRunnerService.enqueueVisualDebug) pin
// execution to exactly one scenario, e.g. "features/a.feature:12". A CLI positional
// path argument alone is NOT enough here: Cucumber merges CLI paths with this file's
// own `paths`, so passing a single scenario on the command line while `paths` still
// defaults to "features/**/*.feature" runs the whole suite, not just that scenario.
// Overriding `paths` itself (rather than adding to it) is what actually restricts
// execution to one scenario.
const paths = process.env.CUCUMBER_TARGET ? [process.env.CUCUMBER_TARGET] : ["features/**/*.feature"];

module.exports = {
  default: {
    import: ["src/support/**/*.ts", "src/steps/**/*.ts"],
    paths,
    format: [
      "progress-bar",
      `html:${reportDir}/cucumber.html`,
      `json:${reportDir}/cucumber.json`
    ],
    formatOptions: { snippetInterface: "async-await" },
    parallel,
    retry: 0
  }
};
