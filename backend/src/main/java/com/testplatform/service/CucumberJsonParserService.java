package com.testplatform.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.testplatform.domain.*;
import com.testplatform.security.AttachmentCipher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.stream.StreamSupport;

/**
 * Parses the @cucumber/cucumber legacy JSON formatter output into our JPA
 * result tree. This is intentionally defensive (missing fields, hooks with
 * no name, etc.) because the report is produced by an external Node process.
 */
@Service
public class CucumberJsonParserService {

    private static final Logger log = LoggerFactory.getLogger(CucumberJsonParserService.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final AttachmentCipher attachmentCipher;

    public CucumberJsonParserService(AttachmentCipher attachmentCipher) {
        this.attachmentCipher = attachmentCipher;
    }

    public static class ParseResult {
        public final List<FeatureResult> features = new ArrayList<>();
        public int total, passed, failed, skipped;
    }

    public ParseResult parse(File cucumberJsonFile, TestRun run) {
        ParseResult result = new ParseResult();
        if (cucumberJsonFile == null || !cucumberJsonFile.exists()) {
            log.warn("cucumber.json not found at {}", cucumberJsonFile);
            return result;
        }

        try {
            JsonNode root = objectMapper.readTree(cucumberJsonFile);
            if (!root.isArray()) return result;

            for (JsonNode featureNode : root) {
                FeatureResult feature = new FeatureResult();
                feature.setRun(run);
                feature.setUri(text(featureNode, "uri"));
                feature.setName(text(featureNode, "name"));
                feature.setDescription(text(featureNode, "description"));

                JsonNode elements = featureNode.path("elements");
                for (JsonNode element : elements) {
                    // Only scenario-type elements represent executed test cases
                    // (a "background" element has no independent status).
                    if (!"scenario".equalsIgnoreCase(text(element, "type"))) continue;

                    ScenarioResult scenario = new ScenarioResult();
                    scenario.setFeature(feature);
                    scenario.setRunId(run.getId());
                    scenario.setName(text(element, "name"));
                    scenario.setLine(element.path("line").isInt() ? element.path("line").asInt() : null);
                    scenario.setTags(extractTags(element));

                    long scenarioDuration = 0;
                    ExecutionStatus worst = ExecutionStatus.PASSED;
                    StringBuilder errors = new StringBuilder();
                    int order = 0;

                    JsonNode steps = element.path("steps");
                    for (JsonNode stepNode : steps) {
                        String stepName = text(stepNode, "name");
                        // Cucumber's synthetic Before/After hook entries have no name. Their
                        // status still counts toward the scenario's overall worst-status
                        // below (that's how a failed After hook fails the scenario), but they
                        // aren't persisted as a step row — otherwise every scenario gets a
                        // blank-named row (see CLAUDE.md Known Issues).
                        boolean isSyntheticHook = stepName == null;

                        StepResult step = new StepResult();
                        step.setScenario(scenario);
                        step.setKeyword(text(stepNode, "keyword"));
                        step.setName(stepName);
                        step.setOrder(order++);

                        JsonNode resultNode = stepNode.path("result");
                        ExecutionStatus stepStatus = ExecutionStatus.fromCucumber(text(resultNode, "status"));
                        String errorMessage = text(resultNode, "error_message");

                        long durationNanos = resultNode.path("duration").isNumber() ? resultNode.path("duration").asLong() : 0;
                        long durationMs = durationNanos / 1_000_000;
                        step.setDurationMs(durationMs);
                        scenarioDuration += durationMs;

                        // `Then` steps run via runLoggedAssertion never throw, so Cucumber's
                        // own status always reads "passed" for them even when the assertion
                        // failed — that's what lets the scenario keep running its remaining
                        // steps. The step's own text/plain log attachment is the real source
                        // of truth for whether it actually failed.
                        String softFailureLine = findSoftFailureLine(stepNode);
                        if (softFailureLine != null && stepStatus == ExecutionStatus.PASSED) {
                            stepStatus = ExecutionStatus.FAILED;
                            errorMessage = softFailureLine;
                        }

                        step.setStatus(stepStatus);
                        if (errorMessage != null && !errorMessage.isBlank()) {
                            step.setErrorMessage(errorMessage);
                            errors.append(errorMessage).append("\n");
                        }

                        worst = worse(worst, stepStatus);
                        if (!isSyntheticHook) scenario.getSteps().add(step);

                        // Screenshots/traces attached via `this.attach(...)` in hooks/steps
                        // show up as base64 "embeddings" on the owning step. hooks.ts
                        // attaches the on-failure screenshot from inside the `After` hook
                        // itself, so it lives on this exact synthetic pseudo-step — still
                        // process embeddings for hook steps even though the step row itself
                        // isn't persisted, or every failure screenshot silently disappears.
                        for (JsonNode embedding : stepNode.path("embeddings")) {
                            String data = text(embedding, "data");
                            String mimeType = text(embedding, "mime_type");
                            if (data == null || mimeType == null) continue;
                            try {
                                Attachment attachment = new Attachment();
                                attachment.setScenario(scenario);
                                attachment.setStepKeyword(step.getKeyword());
                                attachment.setMimeType(mimeType);
                                attachment.setData(attachmentCipher.encrypt(Base64.getDecoder().decode(data)));
                                scenario.getAttachments().add(attachment);
                            } catch (IllegalArgumentException ex) {
                                log.warn("Could not decode embedding for scenario '{}': {}", scenario.getName(), ex.getMessage());
                            }
                        }
                    }

                    scenario.setDurationMs(scenarioDuration);
                    scenario.setStatus(worst);
                    scenario.setErrorMessage(errors.isEmpty() ? null : errors.toString().trim());

                    result.total++;
                    switch (worst) {
                        case PASSED -> result.passed++;
                        case SKIPPED, PENDING, UNDEFINED -> result.skipped++;
                        default -> result.failed++;
                    }

                    feature.getScenarios().add(scenario);
                }

                result.features.add(feature);
            }
        } catch (Exception ex) {
            log.error("Failed to parse cucumber.json at {}", cucumberJsonFile, ex);
        }

        return result;
    }

    // engine/src/support/logger.ts's runLoggedAssertion writes a line of the exact
    // form "... [<scenario>] ERROR FAIL <description> (...ms): <message>" into the
    // step's text/plain attachment on failure, and never throws. This looks for that
    // exact marker so a soft-failed step can be reported as failed even though
    // Cucumber's own JSON says "passed" for it.
    private String findSoftFailureLine(JsonNode stepNode) {
        for (JsonNode embedding : stepNode.path("embeddings")) {
            if (!"text/plain".equals(text(embedding, "mime_type"))) continue;
            String data = text(embedding, "data");
            if (data == null) continue;
            try {
                String decoded = new String(Base64.getDecoder().decode(data), java.nio.charset.StandardCharsets.UTF_8);
                for (String line : decoded.split("\n")) {
                    if (line.contains("] ERROR FAIL ")) {
                        return line.trim();
                    }
                }
            } catch (IllegalArgumentException ignored) {
                // Not valid base64 — the main embedding-persistence loop already logs this case.
            }
        }
        return null;
    }

    private String extractTags(JsonNode element) {
        List<String> tags = StreamSupport.stream(element.path("tags").spliterator(), false)
                .map(t -> text(t, "name"))
                .filter(t -> t != null && !t.isBlank())
                .toList();
        return String.join(",", tags);
    }

    private ExecutionStatus worse(ExecutionStatus a, ExecutionStatus b) {
        // FAILED > AMBIGUOUS > UNDEFINED > PENDING > SKIPPED > PASSED
        return rank(b) > rank(a) ? b : a;
    }

    private int rank(ExecutionStatus status) {
        return switch (status) {
            case PASSED -> 0;
            case SKIPPED -> 1;
            case PENDING -> 2;
            case UNDEFINED -> 3;
            case AMBIGUOUS -> 4;
            case FAILED -> 5;
            case UNKNOWN -> -1;
        };
    }

    private String text(JsonNode node, String field) {
        JsonNode value = node.path(field);
        return value.isMissingNode() || value.isNull() ? null : value.asText();
    }
}
