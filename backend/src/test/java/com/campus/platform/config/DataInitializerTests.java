package com.campus.platform.config;

import com.campus.platform.domain.Assignment;
import com.campus.platform.domain.Course;
import com.campus.platform.domain.Role;
import com.campus.platform.domain.User;
import com.campus.platform.repository.AssignmentRepository;
import com.campus.platform.repository.CourseRepository;
import com.campus.platform.repository.EnrollmentRepository;
import com.campus.platform.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class DataInitializerTests {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Test
    void seedsAdditionalStudentsWithKoreanNamesAndRealisticCourseLoads() {
        assertStudentSeed("student11@campus.local", "김민지");
        assertStudentSeed("student12@campus.local", "강해린");
        assertStudentSeed("student13@campus.local", "장원영");
        assertStudentSeed("student14@campus.local", "유지민");
        assertStudentSeed("student15@campus.local", "안유진");
    }

    @Test
    void seedsSecurityFocusedCoursesAndAssignments() {
        Course networkSecurity = courseRepository.findByCode("SEC210").orElseThrow();
        Course webAppSecurity = courseRepository.findByCode("SEC330").orElseThrow();
        Course digitalForensics = courseRepository.findByCode("IR310").orElseThrow();

        assertThat(networkSecurity.getTitle()).isEqualTo("네트워크 보안");
        assertThat(webAppSecurity.getTitle()).isEqualTo("웹애플리케이션보안");
        assertThat(digitalForensics.getTitle()).isEqualTo("디지털 포렌식 개론");

        assertThat(assignmentRepository.findByCourseIdOrderByDueAtAsc(networkSecurity.getId()))
                .extracting(Assignment::getTitle)
                .contains("실습 1 - 네트워크 보안 로그 읽기");
        assertThat(assignmentRepository.findByCourseIdOrderByDueAtAsc(webAppSecurity.getId()))
                .extracting(Assignment::getTitle)
                .contains("실습 1 - 웹보안 사례 조사");
    }

    private void assertStudentSeed(String email, String expectedName) {
        User user = userRepository.findByEmail(email).orElseThrow();

        assertThat(user.getRole()).isEqualTo(Role.STUDENT);
        assertThat(user.getName()).isEqualTo(expectedName);
        assertThat(enrollmentRepository.countByStudentId(user.getId())).isBetween(3L, 5L);
    }
}
