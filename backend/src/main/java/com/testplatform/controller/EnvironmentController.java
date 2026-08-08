package com.testplatform.controller;

import com.testplatform.dto.EnvironmentSummaryDto;
import com.testplatform.service.EnvironmentConfigService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/environments")
public class EnvironmentController {

    private final EnvironmentConfigService environmentConfigService;

    public EnvironmentController(EnvironmentConfigService environmentConfigService) {
        this.environmentConfigService = environmentConfigService;
    }

    @GetMapping
    public List<EnvironmentSummaryDto> environments() {
        return environmentConfigService.listEnvironments();
    }
}
