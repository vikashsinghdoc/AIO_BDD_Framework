package com.testplatform.controller;

import com.testplatform.dto.ScenarioCatalogEntryDto;
import com.testplatform.service.ScenarioCatalogService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/scenarios")
public class ScenarioController {

    private final ScenarioCatalogService scenarioCatalogService;

    public ScenarioController(ScenarioCatalogService scenarioCatalogService) {
        this.scenarioCatalogService = scenarioCatalogService;
    }

    @GetMapping
    public List<ScenarioCatalogEntryDto> scenarios() {
        return scenarioCatalogService.listScenarios();
    }
}
