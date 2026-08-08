package com.testplatform.dto;

/** Name + display label only — resolved URLs never leave the backend. */
public record EnvironmentSummaryDto(String name, String label) {
}
