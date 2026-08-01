package com.testplatform.repository;

import com.testplatform.domain.StepDetailView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface StepDetailViewRepository extends JpaRepository<StepDetailView, Long>, JpaSpecificationExecutor<StepDetailView> {
}
