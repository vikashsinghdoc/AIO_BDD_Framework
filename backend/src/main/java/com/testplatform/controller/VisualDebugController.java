package com.testplatform.controller;

import com.testplatform.domain.TestRun;
import com.testplatform.dto.RunSummaryDto;
import com.testplatform.dto.VisualDebugRequest;
import com.testplatform.service.TestRunnerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/visual-debug")
public class VisualDebugController {

    private final TestRunnerService testRunnerService;

    public VisualDebugController(TestRunnerService testRunnerService) {
        this.testRunnerService = testRunnerService;
    }

    @PostMapping
    public ResponseEntity<RunSummaryDto> trigger(@Valid @RequestBody VisualDebugRequest request) {
        TestRun run = testRunnerService.enqueueVisualDebug(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(RunSummaryDto.from(run));
    }
}
