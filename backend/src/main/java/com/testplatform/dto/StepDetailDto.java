package com.testplatform.dto;

import com.testplatform.domain.ExecutionStatus;
import com.testplatform.domain.RunStatus;
import com.testplatform.domain.StepDetailView;

import java.time.Instant;
import java.util.List;

public record StepDetailDto(
        Long id,
        Long runId,
        RunStatus runStatus,
        String runTagExpression,
        String runBrowser,
        Instant runStartedAt,
        String featureName,
        Long scenarioId,
        String scenarioName,
        ExecutionStatus scenarioStatus,
        List<String> scenarioTags,
        long attachmentCount,
        int stepOrder,
        String stepKeyword,
        String stepName,
        ExecutionStatus stepStatus,
        Long stepDurationMs,
        String stepErrorMessage
) {
    public static StepDetailDto from(StepDetailView v) {
        List<String> tags = v.getScenarioTags() == null || v.getScenarioTags().isBlank()
                ? List.of()
                : List.of(v.getScenarioTags().split(","));
        return new StepDetailDto(
                v.getId(),
                v.getRunId(),
                v.getRunStatus(),
                v.getRunTagExpression(),
                v.getRunBrowser(),
                v.getRunStartedAt(),
                v.getFeatureName(),
                v.getScenarioId(),
                v.getScenarioName(),
                v.getScenarioStatus(),
                tags,
                v.getAttachmentCount() == null ? 0 : v.getAttachmentCount(),
                v.getStepOrder() == null ? 0 : v.getStepOrder(),
                v.getStepKeyword(),
                v.getStepName(),
                v.getStepStatus(),
                v.getStepDurationMs(),
                v.getStepErrorMessage()
        );
    }
}
