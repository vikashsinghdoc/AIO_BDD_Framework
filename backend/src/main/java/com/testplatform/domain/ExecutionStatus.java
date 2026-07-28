package com.testplatform.domain;

/** Mirrors Cucumber's own step/scenario result statuses (lower-cased in the JSON report). */
public enum ExecutionStatus {
    PASSED,
    FAILED,
    SKIPPED,
    PENDING,
    UNDEFINED,
    AMBIGUOUS,
    UNKNOWN;

    public static ExecutionStatus fromCucumber(String raw) {
        if (raw == null) return UNKNOWN;
        try {
            return ExecutionStatus.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return UNKNOWN;
        }
    }
}
