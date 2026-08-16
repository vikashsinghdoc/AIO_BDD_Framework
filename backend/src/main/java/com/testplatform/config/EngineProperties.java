package com.testplatform.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Component
@ConfigurationProperties(prefix = "engine")
public class EngineProperties {

    private static final Set<String> NODE_PACKAGE_RUNNERS = Set.of("npm", "npx", "pnpm", "yarn");

    /** Path to the playwright-cucumber engine project. */
    private String workingDirectory;

    /** Shell command used to invoke the suite, e.g. "npm test --". */
    private String command;

    /** Directory (relative to workingDirectory) where run reports live. */
    private String reportsSubdirectory = "reports";

    /** Hard timeout so a hung run doesn't block the queue forever. */
    private int timeoutMinutes = 30;

    public String getWorkingDirectory() {
        return workingDirectory;
    }

    public void setWorkingDirectory(String workingDirectory) {
        this.workingDirectory = workingDirectory;
    }

    public String getCommand() {
        return command;
    }

    public void setCommand(String command) {
        this.command = command;
    }

    /**
     * Splits {@link #command} into ProcessBuilder-ready tokens, resolving a bare
     * npm/npx/pnpm/yarn first token to its "*.cmd" shim on Windows. ProcessBuilder's
     * underlying CreateProcess call never consults PATHEXT — on Windows those tools
     * only exist as ".cmd" shims, so the bare name resolves to nothing and the engine
     * process fails to launch (CreateProcess error=2), surfacing later as a misleading
     * "cucumber.json not found" rather than a clear launch failure.
     */
    public List<String> commandTokens() {
        List<String> tokens = new ArrayList<>(List.of(command.split("\\s+")));
        if (!tokens.isEmpty() && isWindows() && NODE_PACKAGE_RUNNERS.contains(tokens.get(0))) {
            tokens.set(0, tokens.get(0) + ".cmd");
        }
        return tokens;
    }

    private static boolean isWindows() {
        return System.getProperty("os.name", "").toLowerCase().contains("win");
    }

    public String getReportsSubdirectory() {
        return reportsSubdirectory;
    }

    public void setReportsSubdirectory(String reportsSubdirectory) {
        this.reportsSubdirectory = reportsSubdirectory;
    }

    public int getTimeoutMinutes() {
        return timeoutMinutes;
    }

    public void setTimeoutMinutes(int timeoutMinutes) {
        this.timeoutMinutes = timeoutMinutes;
    }
}
