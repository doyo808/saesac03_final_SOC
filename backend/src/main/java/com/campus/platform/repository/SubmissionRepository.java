package com.campus.platform.repository;

import com.campus.platform.domain.Submission;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByAssignmentIdOrderBySubmittedAtDesc(Long assignmentId);

    Optional<Submission> findByAssignmentIdAndStudentId(Long assignmentId, Long studentId);

    long countByStudentId(Long studentId);

    long countByStudentIdAndScoreIsNotNull(Long studentId);
}
