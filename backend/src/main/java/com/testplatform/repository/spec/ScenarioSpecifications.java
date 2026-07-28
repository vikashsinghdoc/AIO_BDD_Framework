package com.testplatform.repository.spec;

import com.testplatform.domain.ExecutionStatus;
import com.testplatform.domain.ScenarioResult;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

public class ScenarioSpecifications {

    private ScenarioSpecifications() {}

    public static Specification<ScenarioResult> forRun(Long runId) {
        return (root, query, cb) -> cb.equal(root.get("runId"), runId);
    }

    public static Specification<ScenarioResult> hasStatus(ExecutionStatus status) {
        return (root, query, cb) -> status == null ? null : cb.equal(root.get("status"), status);
    }

    public static Specification<ScenarioResult> hasTag(String tag) {
        return (root, query, cb) -> (tag == null || tag.isBlank())
                ? null
                : cb.like(root.get("tags"), "%" + tag + "%");
    }

    public static Specification<ScenarioResult> nameContains(String search) {
        return (root, query, cb) -> {
            if (search == null || search.isBlank()) return null;
            Predicate p = cb.like(cb.lower(root.get("name")), "%" + search.toLowerCase() + "%");
            return p;
        };
    }
}
