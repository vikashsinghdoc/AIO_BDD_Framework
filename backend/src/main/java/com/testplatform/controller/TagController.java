package com.testplatform.controller;

import com.testplatform.service.FeatureTagScannerService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tags")
public class TagController {

    private final FeatureTagScannerService scannerService;

    public TagController(FeatureTagScannerService scannerService) {
        this.scannerService = scannerService;
    }

    @GetMapping
    public List<String> tags() {
        return scannerService.discoverTags();
    }
}
