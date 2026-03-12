package com.campus.platform.repository;

import com.campus.platform.domain.Enrollment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    List<Enrollment> findByStudentId(Long studentId);

    boolean existsByCourseIdAndStudentId(Long courseId, Long studentId);

    List<Enrollment> findAllByOrderByIdDesc();

    long countByStudentId(Long studentId);
}
