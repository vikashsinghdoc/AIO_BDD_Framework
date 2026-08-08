package com.testplatform.exception;

/**
 * Thrown when a Visual Debug request doesn't resolve to exactly one scenario — either
 * none found (stale/renamed scenario) or more than one (ambiguous selector). Enforced
 * server-side via ScenarioCatalogService regardless of what the frontend picker sent,
 * so this can't be bypassed by calling the API directly.
 */
public class VisualDebugValidationException extends RuntimeException {

    public VisualDebugValidationException(String message) {
        super(message);
    }
}
