package com.testplatform.repository.spec;

import com.testplatform.domain.ExecutionStatus;
import com.testplatform.domain.RunStatus;
import com.testplatform.domain.StepDetailView;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;

public class StepDetailSpecifications {

    private StepDetailSpecifications() {}

    public static Specification<StepDetailView> runIdEquals(Long runId) {
        return (root, query, cb) -> runId == null ? null : cb.equal(root.get("runId"), runId);
    }

    public static Specification<StepDetailView> runStatusEquals(RunStatus status) {
        return (root, query, cb) -> status == null ? null : cb.equal(root.get("runStatus"), status);
    }

    public static Specification<StepDetailView> scenarioStatusEquals(ExecutionStatus status) {
        return (root, query, cb) -> status == null ? null : cb.equal(root.get("scenarioStatus"), status);
    }

    public static Specification<StepDetailView> stepStatusEquals(ExecutionStatus status) {
        return (root, query, cb) -> status == null ? null : cb.equal(root.get("stepStatus"), status);
    }

    public static Specification<StepDetailView> featureContains(String feature) {
        return (root, query, cb) -> (feature == null || feature.isBlank())
                ? null
                : cb.like(cb.lower(root.get("featureName")), "%" + feature.toLowerCase() + "%");
    }

    public static Specification<StepDetailView> scenarioContains(String scenario) {
        return (root, query, cb) -> (scenario == null || scenario.isBlank())
                ? null
                : cb.like(cb.lower(root.get("scenarioName")), "%" + scenario.toLowerCase() + "%");
    }

    public static Specification<StepDetailView> stepTextContains(String keyword) {
        return (root, query, cb) -> (keyword == null || keyword.isBlank())
                ? null
                : cb.like(cb.lower(root.get("stepName")), "%" + keyword.toLowerCase() + "%");
    }

    public static Specification<StepDetailView> hasTag(String tag) {
        return (root, query, cb) -> (tag == null || tag.isBlank())
                ? null
                : cb.like(root.get("scenarioTags"), "%" + tag + "%");
    }

    public static Specification<StepDetailView> browserEquals(String browser) {
        return (root, query, cb) -> (browser == null || browser.isBlank())
                ? null
                : cb.equal(root.get("runBrowser"), browser);
    }

    public static Specification<StepDetailView> startedAfter(Instant from) {
        return (root, query, cb) -> from == null ? null : cb.greaterThanOrEqualTo(root.get("runStartedAt"), from);
    }

    public static Specification<StepDetailView> startedBefore(Instant to) {
        return (root, query, cb) -> to == null ? null : cb.lessThanOrEqualTo(root.get("runStartedAt"), to);
    }

    public static Specification<StepDetailView> onlyWithErrors(boolean onlyErrors) {
        return (root, query, cb) -> !onlyErrors ? null : cb.isNotNull(root.get("stepErrorMessage"));
    }
}
