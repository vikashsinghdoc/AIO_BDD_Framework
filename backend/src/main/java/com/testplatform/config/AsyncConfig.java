package com.testplatform.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
public class AsyncConfig {

    /**
     * Runs are executed serially by design (single Playwright/Cucumber process
     * at a time against the engine checkout) but log broadcasting and other
     * housekeeping happen off the request thread, hence a small pool.
     */
    @Bean(name = "runExecutor")
    public Executor runExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(4);
        executor.setQueueCapacity(20);
        executor.setThreadNamePrefix("test-run-");
        executor.initialize();
        return executor;
    }
}
