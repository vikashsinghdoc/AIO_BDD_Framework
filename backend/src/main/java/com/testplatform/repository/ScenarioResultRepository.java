package com.testplatform.repository;

import com.testplatform.domain.ScenarioResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ScenarioResultRepository extends JpaRepository<ScenarioResult, Long>, JpaSpecificationExecutor<ScenarioResult> {
}
