package com.testplatform.dto;

import java.util.List;
import java.util.Map;

public record DashboardStatsDto(
        long totalRuns,
        long passedRuns,
        long failedRuns,
        long runningRuns,
        double overallPassRate,
        List<RunSummaryDto> recentRuns,
        Map<String, Long> failuresByTag,
        List<TrendPointDto> passRateTrend
) {
    public record TrendPointDto(String runLabel, Long runId, double passRate) {}
}
