package com.testplatform.dto;

import java.util.List;

/** One concrete, runnable scenario (Scenario Outline Examples rows already expanded). */
public record ScenarioCatalogEntryDto(
        String uri,
        String name,
        Integer line,
        List<String> tags,
        List<StepSummaryDto> steps
) {
}
