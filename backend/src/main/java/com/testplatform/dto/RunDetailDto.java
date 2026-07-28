package com.testplatform.dto;

import com.testplatform.domain.TestRun;

import java.util.List;

public record RunDetailDto(
        RunSummaryDto summary,
        String failureReason,
        String consoleLog,
        List<ScenarioDto> scenarios
) {
    public static RunDetailDto from(TestRun run, List<ScenarioDto> scenarios) {
        return new RunDetailDto(RunSummaryDto.from(run), run.getFailureReason(), run.getConsoleLog(), scenarios);
    }
}
