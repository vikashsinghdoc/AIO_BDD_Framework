package com.testplatform.service;

import com.testplatform.config.EngineProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class FeatureTagScannerService {

    private static final Logger log = LoggerFactory.getLogger(FeatureTagScannerService.class);
    private static final Pattern TAG_PATTERN = Pattern.compile("@[A-Za-z0-9_-]+");

    private final EngineProperties engineProperties;

    public FeatureTagScannerService(EngineProperties engineProperties) {
        this.engineProperties = engineProperties;
    }

    /** Distinct tags found across all *.feature files, alphabetically sorted. */
    public List<String> discoverTags() {
        Path featuresDir = Path.of(engineProperties.getWorkingDirectory(), "features");
        TreeSet<String> tags = new TreeSet<>();

        if (!Files.isDirectory(featuresDir)) {
            log.warn("Features directory not found at {}", featuresDir.toAbsolutePath());
            return List.of();
        }

        try (var stream = Files.walk(featuresDir)) {
            stream.filter(p -> p.toString().endsWith(".feature")).forEach(file -> {
                try {
                    String content = Files.readString(file);
                    Matcher matcher = TAG_PATTERN.matcher(content);
                    while (matcher.find()) {
                        tags.add(matcher.group());
                    }
                } catch (IOException ex) {
                    log.warn("Could not read feature file {}", file, ex);
                }
            });
        } catch (IOException ex) {
            log.warn("Could not walk features directory {}", featuresDir, ex);
        }

        return tags.stream().sorted(Comparator.naturalOrder()).toList();
    }
}
