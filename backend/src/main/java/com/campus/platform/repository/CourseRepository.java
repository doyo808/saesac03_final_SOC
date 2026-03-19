package com.campus.platform.repository;

import com.campus.platform.domain.Course;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByProfessorId(Long professorId);

    Optional<Course> findByCode(String code);
}
