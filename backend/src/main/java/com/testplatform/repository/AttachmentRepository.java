package com.testplatform.repository;

import com.testplatform.domain.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AttachmentRepository extends JpaRepository<Attachment, Long> {
    List<Attachment> findByScenarioId(Long scenarioId);
}
