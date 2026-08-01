package com.testplatform.controller;

import com.testplatform.domain.ExecutionStatus;
import com.testplatform.domain.RunStatus;
import com.testplatform.domain.StepDetailView;
import com.testplatform.dto.StepDetailDto;
import com.testplatform.repository.StepDetailViewRepository;
import com.testplatform.repository.spec.StepDetailSpecifications;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

/**
 * The "complete grid": every scenario/step ever recorded, across every run,
 * filterable by run status, scenario status, step status, feature, scenario
 * name, step text, tag, browser, date range, and "only rows with an error".
 */
@RestController
@RequestMapping("/api/steps")
public class StepExplorerController {

    private final StepDetailViewRepository repository;

    public StepExplorerController(StepDetailViewRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public Page<StepDetailDto> search(
            @RequestParam(required = false) Long runId,
            @RequestParam(required = false) RunStatus runStatus,
            @RequestParam(required = false) ExecutionStatus scenarioStatus,
            @RequestParam(required = false) ExecutionStatus stepStatus,
            @RequestParam(required = false) String feature,
            @RequestParam(required = false) String scenario,
            @RequestParam(required = false) String step,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) String browser,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(defaultValue = "false") boolean onlyErrors,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {

        Specification<StepDetailView> spec = Specification
                .where(StepDetailSpecifications.runIdEquals(runId))
                .and(StepDetailSpecifications.runStatusEquals(runStatus))
                .and(StepDetailSpecifications.scenarioStatusEquals(scenarioStatus))
                .and(StepDetailSpecifications.stepStatusEquals(stepStatus))
                .and(StepDetailSpecifications.featureContains(feature))
                .and(StepDetailSpecifications.scenarioContains(scenario))
                .and(StepDetailSpecifications.stepTextContains(step))
                .and(StepDetailSpecifications.hasTag(tag))
                .and(StepDetailSpecifications.browserEquals(browser))
                .and(StepDetailSpecifications.startedAfter(from))
                .and(StepDetailSpecifications.startedBefore(to))
                .and(StepDetailSpecifications.onlyWithErrors(onlyErrors));

        Page<StepDetailView> results = repository.findAll(spec,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "runStartedAt")
                        .and(Sort.by(Sort.Direction.ASC, "scenarioId"))
                        .and(Sort.by(Sort.Direction.ASC, "stepOrder"))));

        return results.map(StepDetailDto::from);
    }
}
