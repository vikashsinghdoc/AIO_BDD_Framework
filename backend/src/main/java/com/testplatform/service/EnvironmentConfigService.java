package com.testplatform.service;

import com.testplatform.config.EngineProperties;
import com.testplatform.dto.EnvironmentSummaryDto;
import com.testplatform.exception.EnvironmentResolutionException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Resolves a named environment (DEV/QA/UAT/...) into a concrete {baseUrl, apiBaseUrl}
 * pair, reading a committed, per-environment dotenv-style file — {@code <engine working
 * dir>/.env.<name>} (lowercase), e.g. {@code engine/.env.qa}. This mirrors the format
 * the engine already uses for its own {@code .env}, but unlike that file (git-ignored,
 * holds credentials) these per-environment files are meant to be committed: for a test
 * framework, the target URLs themselves usually aren't secret.
 *
 * The set of available environments is derived entirely from which {@code .env.<name>}
 * files exist under the engine directory — there is no separate registry to keep in
 * sync. Adding an environment is "add a file"; nothing else needs to change.
 */
@Service
public class EnvironmentConfigService {

    private static final Logger log = LoggerFactory.getLogger(EnvironmentConfigService.class);
    private static final Pattern ENV_FILE_PATTERN = Pattern.compile("^\\.env\\.([a-z0-9_-]+)$");
    // .env.example is the engine's own copy-to-.env template (see engine/README.md), not
    // a real environment — exclude it even though it matches the naming pattern.
    private static final String RESERVED_SUFFIX = "example";

    private final EngineProperties engineProperties;

    public EnvironmentConfigService(EngineProperties engineProperties) {
        this.engineProperties = engineProperties;
    }

    public record ResolvedEnvironment(String baseUrl, String apiBaseUrl) {
    }

    /** Names derived from which .env.<name> files exist — name is also used as the label. */
    public List<EnvironmentSummaryDto> listEnvironments() {
        List<EnvironmentSummaryDto> result = new ArrayList<>();
        for (String name : discoverNames()) {
            result.add(new EnvironmentSummaryDto(name, name));
        }
        return result;
    }

    /** Resolves and validates an environment name, or throws with an actionable message. */
    public ResolvedEnvironment resolve(String name) {
        if (name == null || name.isBlank()) {
            throw new EnvironmentResolutionException("An environment must be selected.");
        }

        String normalized = name.trim().toUpperCase();
        if (normalized.equalsIgnoreCase(RESERVED_SUFFIX)) {
            throw new EnvironmentResolutionException("Unknown environment \"" + normalized + "\".");
        }
        Path path = envFilePath(normalized);
        if (!Files.isRegularFile(path)) {
            throw new EnvironmentResolutionException(
                    "Unknown environment \"" + normalized + "\". Expected a file at engine/"
                            + path.getFileName() + ".");
        }

        Map<String, String> values = parseEnvFile(path);
        String baseUrl = values.getOrDefault("BASE_URL", "").trim();
        String apiBaseUrl = values.getOrDefault("API_BASE_URL", "").trim();

        List<String> missing = new ArrayList<>();
        if (baseUrl.isBlank()) missing.add("BASE_URL");
        if (apiBaseUrl.isBlank()) missing.add("API_BASE_URL");
        if (!missing.isEmpty()) {
            throw new EnvironmentResolutionException(
                    "Environment \"" + normalized + "\" is missing " + String.join(" and ", missing)
                            + " in engine/" + path.getFileName() + ".");
        }

        return new ResolvedEnvironment(baseUrl, apiBaseUrl);
    }

    private List<String> discoverNames() {
        Path engineDir = Path.of(engineProperties.getWorkingDirectory());
        List<String> names = new ArrayList<>();
        if (!Files.isDirectory(engineDir)) {
            log.warn("Engine directory not found at {}", engineDir.toAbsolutePath());
            return names;
        }

        try (var stream = Files.list(engineDir)) {
            stream.filter(Files::isRegularFile)
                    .map(p -> p.getFileName().toString())
                    .forEach(fileName -> {
                        Matcher matcher = ENV_FILE_PATTERN.matcher(fileName);
                        if (matcher.matches() && !matcher.group(1).equals(RESERVED_SUFFIX)) {
                            names.add(matcher.group(1).toUpperCase());
                        }
                    });
        } catch (IOException ex) {
            log.warn("Could not scan {} for environment files", engineDir, ex);
        }

        names.sort(String::compareTo);
        return names;
    }

    private Path envFilePath(String normalizedName) {
        return Path.of(engineProperties.getWorkingDirectory(), ".env." + normalizedName.toLowerCase());
    }

    private Map<String, String> parseEnvFile(Path path) {
        Map<String, String> values = new LinkedHashMap<>();
        try {
            for (String line : Files.readAllLines(path)) {
                String trimmed = line.trim();
                if (trimmed.isEmpty() || trimmed.startsWith("#")) continue;

                int eq = trimmed.indexOf('=');
                if (eq < 0) continue;

                String key = trimmed.substring(0, eq).trim();
                String value = trimmed.substring(eq + 1).trim();
                if (value.length() >= 2 && ((value.startsWith("\"") && value.endsWith("\""))
                        || (value.startsWith("'") && value.endsWith("'")))) {
                    value = value.substring(1, value.length() - 1);
                }
                values.put(key, value);
            }
        } catch (IOException ex) {
            log.warn("Could not read {}", path, ex);
        }
        return values;
    }
}
