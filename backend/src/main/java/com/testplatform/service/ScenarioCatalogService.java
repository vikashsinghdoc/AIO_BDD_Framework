package com.testplatform.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.testplatform.config.EngineProperties;
import com.testplatform.dto.ScenarioCatalogEntryDto;
import com.testplatform.dto.StepSummaryDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.StreamSupport;

/**
 * Enumerates every concrete scenario under engine/features/** via a Cucumber
 * {@code --dry-run} rather than a hand-rolled Gherkin/tag-expression parser — dry-run
 * already expands Scenario Outline Examples rows into individually-addressable
 * pickles with their own line, which a text/regex scan could not do correctly.
 *
 * Backs both the Visual Debug scenario picker (GET /api/scenarios) and the backend's
 * single-scenario validation for Visual Debug requests (TestRunnerService) — both read
 * from this same source, so "what the picker shows" and "what the backend accepts" can
 * never drift apart.
 *
 * Dry-run never invokes Before/After hooks or step code (Cucumber skips execution
 * entirely in this mode), so it never launches a browser and is safe to run
 * concurrently with an in-progress real run — it doesn't touch reports/run-*,
 * test-results/, or .auth/, only a dedicated scratch report directory. It is
 * intentionally NOT routed through TestRunnerService's single-threaded run queue.
 */
@Service
public class ScenarioCatalogService {

    private static final Logger log = LoggerFactory.getLogger(ScenarioCatalogService.class);
    private static final String SCRATCH_REPORT_DIR = "reports/.scenario-catalog";
    private static final int DRY_RUN_TIMEOUT_SECONDS = 30;

    private final EngineProperties engineProperties;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ScenarioCatalogService(EngineProperties engineProperties) {
        this.engineProperties = engineProperties;
    }

    public List<ScenarioCatalogEntryDto> listScenarios() {
        try {
            runDryRun();
        } catch (Exception ex) {
            log.error("Scenario catalog dry-run failed", ex);
            return List.of();
        }
        return parseCatalog();
    }

    private void runDryRun() throws Exception {
        List<String> command = engineProperties.commandTokens();
        command.add("--dry-run");

        ProcessBuilder builder = new ProcessBuilder(command);
        builder.directory(new File(engineProperties.getWorkingDirectory()));
        builder.redirectErrorStream(true);
        builder.redirectOutput(ProcessBuilder.Redirect.DISCARD);

        Map<String, String> env = builder.environment();
        env.put("REPORT_DIR", SCRATCH_REPORT_DIR);
        env.put("PARALLEL_WORKERS", "1");
        // Dry-run never launches a browser (hooks don't run), but engine/src/support/
        // config.ts still validates HEADLESS at module-import time and throws if it's
        // blank — set it purely to satisfy that, not because anything reads it here.
        env.put("HEADLESS", "true");

        Process process = builder.start();
        boolean finished = process.waitFor(DRY_RUN_TIMEOUT_SECONDS, TimeUnit.SECONDS);
        if (!finished) {
            process.destroyForcibly();
            throw new IllegalStateException("Scenario catalog dry-run timed out after " + DRY_RUN_TIMEOUT_SECONDS + "s");
        }
    }

    private List<ScenarioCatalogEntryDto> parseCatalog() {
        File cucumberJson = Path.of(engineProperties.getWorkingDirectory(), SCRATCH_REPORT_DIR, "cucumber.json").toFile();
        List<ScenarioCatalogEntryDto> result = new ArrayList<>();
        if (!cucumberJson.exists()) {
            log.warn("Scenario catalog dry-run produced no cucumber.json at {}", cucumberJson);
            return result;
        }

        try {
            JsonNode root = objectMapper.readTree(cucumberJson);
            if (!root.isArray()) return result;

            for (JsonNode featureNode : root) {
                String uri = text(featureNode, "uri");
                for (JsonNode element : featureNode.path("elements")) {
                    if (!"scenario".equalsIgnoreCase(text(element, "type"))) continue;

                    List<String> tags = StreamSupport.stream(element.path("tags").spliterator(), false)
                            .map(t -> text(t, "name"))
                            .filter(t -> t != null && !t.isBlank())
                            .toList();

                    // Cucumber's JSON includes synthetic Before/After hook entries in
                    // "steps" alongside the real Given/When/Then ones — hooks have no
                    // "name" field, which is how we tell them apart. They must be
                    // excluded here: the frontend's Visual Debug checklist advances by
                    // step ORDER as START/PASS/FAIL log lines arrive, and hooks.ts never
                    // logs those for Before/After (only runLoggedStep-wrapped DSL steps
                    // do) — including hook placeholders would misalign that sequence.
                    List<StepSummaryDto> steps = new ArrayList<>();
                    for (JsonNode stepNode : element.path("steps")) {
                        String stepText = text(stepNode, "name");
                        if (stepText == null) continue;
                        steps.add(new StepSummaryDto(text(stepNode, "keyword"), stepText));
                    }

                    Integer line = element.path("line").isInt() ? element.path("line").asInt() : null;
                    result.add(new ScenarioCatalogEntryDto(uri, text(element, "name"), line, tags, steps));
                }
            }
        } catch (Exception ex) {
            log.error("Failed to parse scenario catalog at {}", cucumberJson, ex);
        }
        return result;
    }

    private String text(JsonNode node, String field) {
        JsonNode value = node.path(field);
        return value.isMissingNode() || value.isNull() ? null : value.asText();
    }
}
