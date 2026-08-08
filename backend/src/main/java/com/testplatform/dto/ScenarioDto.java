package com.testplatform.dto;

import com.testplatform.domain.ExecutionStatus;
import com.testplatform.domain.ScenarioResult;

import java.util.List;

public record ScenarioDto(
        Long id,
        String featureName,
        String featureUri,
        String name,
        Integer line,
        ExecutionStatus status,
        Long durationMs,
        String errorMessage,
        List<String> tags,
        List<StepDto> steps,
        List<AttachmentDto> attachments
) {
    public static ScenarioDto from(ScenarioResult s) {
        List<String> tagList = s.getTags() == null || s.getTags().isBlank()
                ? List.of()
                : List.of(s.getTags().split(","));
        return new ScenarioDto(
                s.getId(),
                s.getFeature() != null ? s.getFeature().getName() : null,
                s.getFeature() != null ? s.getFeature().getUri() : null,
                s.getName(),
                s.getLine(),
                s.getStatus(),
                s.getDurationMs(),
                s.getErrorMessage(),
                tagList,
                s.getSteps().stream().map(StepDto::from).toList(),
                s.getAttachments().stream().map(AttachmentDto::from).toList()
        );
    }
}
