require("dotenv").config();

const requestedWorkers = Number.parseInt(process.env.PARALLEL_WORKERS ?? "1", 10);
const parallel = Number.isSafeInteger(requestedWorkers) && requestedWorkers > 0 ? requestedWorkers : 1;

// REPORT_DIR lets the orchestrating backend point each run at its own output
// folder (e.g. reports/run-42) so run artifacts never collide.
const reportDir = process.env.REPORT_DIR ?? "reports";

module.exports = {
  default: {
    import: ["src/support/**/*.ts", "src/steps/**/*.ts"],
    paths: ["features/**/*.feature"],
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
