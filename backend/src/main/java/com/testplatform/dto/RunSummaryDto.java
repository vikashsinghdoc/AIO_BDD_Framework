package com.testplatform.dto;

import com.testplatform.domain.RunStatus;
import com.testplatform.domain.TestRun;

import java.time.Instant;

public record RunSummaryDto(
        Long id,
        RunStatus status,
        String tagExpression,
        String browser,
        boolean headless,
        int parallelWorkers,
        Instant startedAt,
        Instant finishedAt,
        Long durationMs,
        int totalScenarios,
        int passedScenarios,
        int failedScenarios,
        int skippedScenarios,
        String triggeredBy
) {
    public static RunSummaryDto from(TestRun run) {
        return new RunSummaryDto(
                run.getId(),
                run.getStatus(),
                run.getTagExpression(),
                run.getBrowser(),
                run.isHeadless(),
                run.getParallelWorkers(),
                run.getStartedAt(),
                run.getFinishedAt(),
                run.getDurationMs(),
                run.getTotalScenarios(),
                run.getPassedScenarios(),
                run.getFailedScenarios(),
                run.getSkippedScenarios(),
                run.getTriggeredBy()
        );
    }
}
