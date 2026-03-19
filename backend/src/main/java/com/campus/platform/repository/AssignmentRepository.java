package com.campus.platform.repository;

import com.campus.platform.domain.Assignment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
    List<Assignment> findByCourseIdOrderByDueAtAsc(Long courseId);

    boolean existsByCourseIdAndTitle(Long courseId, String title);
}
