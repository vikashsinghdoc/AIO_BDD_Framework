package com.testplatform.controller;

import com.testplatform.domain.ExecutionStatus;
import com.testplatform.domain.RunStatus;
import com.testplatform.domain.ScenarioResult;
import com.testplatform.domain.TestRun;
import com.testplatform.dto.*;
import com.testplatform.repository.ScenarioResultRepository;
import com.testplatform.repository.TestRunRepository;
import com.testplatform.repository.spec.ScenarioSpecifications;
import com.testplatform.repository.spec.TestRunSpecifications;
import com.testplatform.service.LogBroadcastService;
import com.testplatform.service.TestRunnerService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/runs")
public class RunController {

    private final TestRunnerService testRunnerService;
    private final TestRunRepository testRunRepository;
    private final ScenarioResultRepository scenarioResultRepository;
    private final LogBroadcastService logBroadcastService;

    public RunController(TestRunnerService testRunnerService,
                          TestRunRepository testRunRepository,
                          ScenarioResultRepository scenarioResultRepository,
                          LogBroadcastService logBroadcastService) {
        this.testRunnerService = testRunnerService;
        this.testRunRepository = testRunRepository;
        this.scenarioResultRepository = scenarioResultRepository;
        this.logBroadcastService = logBroadcastService;
    }

    @PostMapping
    public ResponseEntity<RunSummaryDto> trigger(@Valid @RequestBody RunRequest request) {
        TestRun run = testRunnerService.enqueue(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(RunSummaryDto.from(run));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Void> cancel(@PathVariable Long id) {
        boolean cancelled = testRunnerService.cancel(id);
        return cancelled ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    @GetMapping
    public Page<RunSummaryDto> list(
            @RequestParam(required = false) RunStatus status,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Specification<TestRun> spec = Specification
                .where(TestRunSpecifications.hasStatus(status))
                .and(TestRunSpecifications.hasTag(tag))
                .and(TestRunSpecifications.startedAfter(from))
                .and(TestRunSpecifications.startedBefore(to));

        Page<TestRun> runs = testRunRepository.findAll(spec,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "startedAt")));
        return runs.map(RunSummaryDto::from);
    }

    @Transactional(readOnly = true)
    @GetMapping("/{id}")
    public ResponseEntity<RunDetailDto> detail(
            @PathVariable Long id,
            @RequestParam(required = false) ExecutionStatus status,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) String search) {
        TestRun run = testRunRepository.findById(id).orElse(null);
        if (run == null) return ResponseEntity.notFound().build();

        Specification<ScenarioResult> spec = Specification
                .where(ScenarioSpecifications.forRun(id))
                .and(ScenarioSpecifications.hasStatus(status))
                .and(ScenarioSpecifications.hasTag(tag))
                .and(ScenarioSpecifications.nameContains(search));

        List<ScenarioResult> scenarios = scenarioResultRepository.findAll(spec, Sort.by(Sort.Direction.ASC, "id"));
        List<ScenarioDto> scenarioDtos = scenarios.stream().map(ScenarioDto::from).toList();
        return ResponseEntity.ok(RunDetailDto.from(run, scenarioDtos));
    }

    /** Live console stream, Jenkins-style, while a run is in progress (and replays backlog on connect). */
    @GetMapping(path = "/{id}/stream", produces = "text/event-stream")
    public SseEmitter stream(@PathVariable Long id) {
        return logBroadcastService.subscribe(id);
    }
}
