package com.testplatform.dto;

import com.testplatform.domain.ExecutionStatus;
import com.testplatform.domain.StepResult;

public record StepDto(
        Long id,
        String keyword,
        String name,
        ExecutionStatus status,
        Long durationMs,
        String errorMessage
) {
    public static StepDto from(StepResult step) {
        return new StepDto(step.getId(), step.getKeyword(), step.getName(),
                step.getStatus(), step.getDurationMs(), step.getErrorMessage());
    }
}
