package com.testplatform.service;

import com.testplatform.domain.RunStatus;
import com.testplatform.domain.TestRun;
import com.testplatform.repository.TestRunRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * If the backend was killed/restarted mid-run, the DB row is left stuck in
 * RUNNING/QUEUED forever (nothing is left alive to update it). A fresh JVM
 * start can never have a genuinely in-progress run, so sweep those on boot.
 */
@Component
public class StaleRunCleanupRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(StaleRunCleanupRunner.class);

    private final TestRunRepository testRunRepository;

    public StaleRunCleanupRunner(TestRunRepository testRunRepository) {
        this.testRunRepository = testRunRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        List<TestRun> stale = testRunRepository.findAll().stream()
                .filter(r -> r.getStatus() == RunStatus.RUNNING || r.getStatus() == RunStatus.QUEUED)
                .toList();

        if (stale.isEmpty()) return;

        for (TestRun run : stale) {
            run.setStatus(RunStatus.ERRORED);
            run.setFailureReason("Backend was restarted while this run was in progress.");
            run.setFinishedAt(Instant.now());
        }
        testRunRepository.saveAll(stale);
        log.warn("Marked {} stale run(s) as ERRORED on startup: {}", stale.size(),
                stale.stream().map(TestRun::getId).toList());
    }
}
