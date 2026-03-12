package com.campus.platform.repository;

import com.campus.platform.domain.AcademicEvent;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AcademicEventRepository extends JpaRepository<AcademicEvent, Long> {
    List<AcademicEvent> findTop5ByOrderByDateAsc();
}
