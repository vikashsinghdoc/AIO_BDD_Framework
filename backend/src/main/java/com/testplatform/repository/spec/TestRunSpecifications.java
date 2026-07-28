package com.testplatform.repository.spec;

import com.testplatform.domain.RunStatus;
import com.testplatform.domain.TestRun;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;

public class TestRunSpecifications {

    private TestRunSpecifications() {}

    public static Specification<TestRun> hasStatus(RunStatus status) {
        return (root, query, cb) -> status == null ? null : cb.equal(root.get("status"), status);
    }

    public static Specification<TestRun> hasTag(String tag) {
        return (root, query, cb) -> (tag == null || tag.isBlank())
                ? null
                : cb.like(root.get("tagExpression"), "%" + tag + "%");
    }

    public static Specification<TestRun> startedAfter(Instant from) {
        return (root, query, cb) -> from == null ? null : cb.greaterThanOrEqualTo(root.get("startedAt"), from);
    }

    public static Specification<TestRun> startedBefore(Instant to) {
        return (root, query, cb) -> to == null ? null : cb.lessThanOrEqualTo(root.get("startedAt"), to);
    }
}
