package com.campus.platform.config;

import com.campus.platform.domain.Assignment;
import com.campus.platform.domain.BoardPost;
import com.campus.platform.domain.Course;
import com.campus.platform.domain.Role;
import com.campus.platform.domain.User;
import com.campus.platform.repository.AnnouncementRepository;
import com.campus.platform.repository.AssignmentRepository;
import com.campus.platform.repository.BoardPostRepository;
import com.campus.platform.repository.CourseRepository;
import com.campus.platform.repository.EnrollmentRepository;
import com.campus.platform.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.groups.Tuple.tuple;

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

    @Autowired
    private AnnouncementRepository announcementRepository;

    @Autowired
    private BoardPostRepository boardPostRepository;

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
        assertThat(assignmentRepository.findByCourseIdOrderByDueAtAsc(networkSecurity.getId()))
                .extracting(Assignment::getDescription)
                .anySatisfy(value -> assertThat(value).contains("nmap -sS", "ping sweep", "alert tcp"));
        assertThat(assignmentRepository.findByCourseIdOrderByDueAtAsc(webAppSecurity.getId()))
                .extracting(Assignment::getTitle)
                .contains("실습 1 - 웹보안 사례 조사", "실습 2 - WAF 혼동 문자열 분석");
        assertThat(assignmentRepository.findByCourseIdOrderByDueAtAsc(webAppSecurity.getId()))
                .extracting(Assignment::getDescription)
                .anySatisfy(value -> assertThat(value).contains("union select", "<script>alert(1)</script>", "../admin"))
                .anySatisfy(value -> assertThat(value).contains("select", "union", "../uploads", "<script>"));
    }

    @Test
    void seedsBenignButNoisyContentForWafTuning() {
        assertThat(announcementRepository.findAll())
                .extracting(item -> item.getTitle() + " " + item.getContent())
                .anySatisfy(value -> assertThat(value).contains("union select", "<script>alert(1)</script>", "../admin"))
                .anySatisfy(value -> assertThat(value).contains("select 문", "script 태그", "../ 경로"));

        assertThat(boardPostRepository.findAll())
                .extracting(BoardPost::getTitle, BoardPost::getContent)
                .contains(
                        tuple(
                                "웹보안 과제에서 select 문 예시는 어떻게 적나요?",
                                "실습 보고서에 union select, order by 1, ../admin 같은 문자열을 설명용으로 쓰려는데 차단되지 않게 문맥을 어떻게 적어야 할지 궁금합니다."
                        ),
                        tuple(
                                "script 태그 예시를 본문에 넣어도 되나요?",
                                "웹애플리케이션보안 과제 설명에 <script>alert(1)</script> 와 ../uploads/sample 경로를 예시로 넣으려는데, 정상 보고서로 보이게 쓰는 팁이 있으면 공유 부탁드립니다."
                        )
                );
    }

    private void assertStudentSeed(String email, String expectedName) {
        User user = userRepository.findByEmail(email).orElseThrow();

        assertThat(user.getRole()).isEqualTo(Role.STUDENT);
        assertThat(user.getName()).isEqualTo(expectedName);
        assertThat(enrollmentRepository.countByStudentId(user.getId())).isBetween(3L, 5L);
    }
}
