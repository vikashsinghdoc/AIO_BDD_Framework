package com.testplatform.dto;

/** One Gherkin step's keyword + text — no status, purely structural (catalog use). */
public record StepSummaryDto(String keyword, String text) {
}
