package com.testplatform.repository;

import com.testplatform.domain.StepResult;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StepResultRepository extends JpaRepository<StepResult, Long> {
}
