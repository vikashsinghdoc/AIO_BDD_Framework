package com.testplatform.service;

import com.testplatform.domain.RunStatus;
import com.testplatform.domain.ScenarioResult;
import com.testplatform.domain.TestRun;
import com.testplatform.dto.DashboardStatsDto;
import com.testplatform.dto.RunSummaryDto;
import com.testplatform.repository.TestRunRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {

    private final TestRunRepository testRunRepository;

    public DashboardService(TestRunRepository testRunRepository) {
        this.testRunRepository = testRunRepository;
    }

    @Transactional(readOnly = true)
    public DashboardStatsDto buildStats() {
        List<TestRun> recent = testRunRepository.findAll(
                PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "startedAt"))
        ).getContent();

        long total = testRunRepository.count();
        long passed = recent.stream().filter(r -> r.getStatus() == RunStatus.PASSED).count();
        long failed = recent.stream().filter(r -> r.getStatus() == RunStatus.FAILED || r.getStatus() == RunStatus.ERRORED).count();
        long running = recent.stream().filter(r -> r.getStatus() == RunStatus.RUNNING || r.getStatus() == RunStatus.QUEUED).count();

        double overallPassRate = recent.isEmpty() ? 0 : recent.stream()
                .filter(r -> r.getTotalScenarios() > 0)
                .mapToDouble(r -> (double) r.getPassedScenarios() / r.getTotalScenarios())
                .average().orElse(0) * 100;

        Map<String, Long> failuresByTag = new LinkedHashMap<>();
        for (TestRun run : recent) {
            for (var feature : run.getFeatures()) {
                for (ScenarioResult scenario : feature.getScenarios()) {
                    if (scenario.getStatus() == com.testplatform.domain.ExecutionStatus.FAILED
                            && scenario.getTags() != null && !scenario.getTags().isBlank()) {
                        for (String tag : scenario.getTags().split(",")) {
                            failuresByTag.merge(tag, 1L, Long::sum);
                        }
                    }
                }
            }
        }

        List<DashboardStatsDto.TrendPointDto> trend = recent.stream()
                .filter(r -> r.getTotalScenarios() > 0)
                .sorted((a, b) -> a.getStartedAt().compareTo(b.getStartedAt()))
                .map(r -> new DashboardStatsDto.TrendPointDto(
                        "#" + r.getId(),
                        r.getId(),
                        (double) r.getPassedScenarios() / r.getTotalScenarios() * 100))
                .toList();

        List<RunSummaryDto> recentDtos = recent.stream().map(RunSummaryDto::from).toList();

        return new DashboardStatsDto(total, passed, failed, running, overallPassRate, recentDtos, failuresByTag, trend);
    }
}
