package com.testplatform.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "engine")
public class EngineProperties {

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
