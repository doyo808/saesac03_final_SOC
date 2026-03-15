package com.campus.platform.config;

import com.campus.platform.domain.AcademicEvent;
import com.campus.platform.domain.Announcement;
import com.campus.platform.domain.Assignment;
import com.campus.platform.domain.BoardComment;
import com.campus.platform.domain.BoardPost;
import com.campus.platform.domain.Course;
import com.campus.platform.domain.Enrollment;
import com.campus.platform.domain.Role;
import com.campus.platform.domain.User;
import com.campus.platform.repository.AcademicEventRepository;
import com.campus.platform.repository.AnnouncementRepository;
import com.campus.platform.repository.AssignmentRepository;
import com.campus.platform.repository.BoardCommentRepository;
import com.campus.platform.repository.BoardPostRepository;
import com.campus.platform.repository.CourseRepository;
import com.campus.platform.repository.EnrollmentRepository;
import com.campus.platform.repository.UserRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final AnnouncementRepository announcementRepository;
    private final AcademicEventRepository academicEventRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AssignmentRepository assignmentRepository;
    private final BoardPostRepository boardPostRepository;
    private final BoardCommentRepository boardCommentRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(
            UserRepository userRepository,
            AnnouncementRepository announcementRepository,
            AcademicEventRepository academicEventRepository,
            CourseRepository courseRepository,
            EnrollmentRepository enrollmentRepository,
            AssignmentRepository assignmentRepository,
            BoardPostRepository boardPostRepository,
            BoardCommentRepository boardCommentRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.announcementRepository = announcementRepository;
        this.academicEventRepository = academicEventRepository;
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.assignmentRepository = assignmentRepository;
        this.boardPostRepository = boardPostRepository;
        this.boardCommentRepository = boardCommentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        User student1 = ensureUser("student1@campus.local", "Password123!", "student1", Role.STUDENT);
        User student2 = ensureUser("student2@campus.local", "Password123!", "student2", Role.STUDENT);
        ensureUser("student3@campus.local", "Password123!", "student3", Role.STUDENT);
        ensureUser("student4@campus.local", "Password123!", "student4", Role.STUDENT);
        ensureUser("student5@campus.local", "Password123!", "student5", Role.STUDENT);
        User prof1 = ensureUser("prof1@campus.local", "Password123!", "prof1", Role.PROFESSOR);
        ensureUser("admin1@campus.local", "Password123!", "admin1", Role.ADMIN);

        boolean hasSeedData = announcementRepository.count() > 0
                || academicEventRepository.count() > 0
                || courseRepository.count() > 0
                || enrollmentRepository.count() > 0
                || assignmentRepository.count() > 0
                || boardPostRepository.count() > 0
                || boardCommentRepository.count() > 0;
        if (hasSeedData) {
            return;
        }

        announcementRepository.save(new Announcement(
                "2026학년도 1학기 개강 안내",
                "개강일은 2026-03-04이며 첫 주는 수강정정 기간입니다.",
                LocalDateTime.now().minusDays(7)
        ));
        announcementRepository.save(new Announcement(
                "도서관 운영시간 변경",
                "중간고사 기간 동안 도서관이 24시간 운영됩니다.",
                LocalDateTime.now().minusDays(4)
        ));
        announcementRepository.save(new Announcement(
                "캠퍼스 네트워크 점검",
                "주말 오전 2시부터 5시까지 네트워크 점검이 예정되어 있습니다.",
                LocalDateTime.now().minusDays(2)
        ));

        academicEventRepository.save(new AcademicEvent("개강", LocalDate.now().plusDays(5)));
        academicEventRepository.save(new AcademicEvent("수강정정 마감", LocalDate.now().plusDays(12)));
        academicEventRepository.save(new AcademicEvent("중간고사", LocalDate.now().plusDays(45)));

        Course course1 = courseRepository.save(new Course("CS101", "웹프로그래밍 기초", prof1));
        Course course2 = courseRepository.save(new Course("SE320", "소프트웨어공학", prof1));

        enrollmentRepository.save(new Enrollment(course1, student1));

        assignmentRepository.save(new Assignment(
                course1,
                "과제 1 - 자기소개 페이지",
                "React로 간단한 자기소개 페이지를 구현하세요.",
                LocalDateTime.now().plusDays(10)
        ));
        assignmentRepository.save(new Assignment(
                course1,
                "과제 2 - REST API 연동",
                "axios를 사용해 공지사항 API를 연동하세요.",
                LocalDateTime.now().plusDays(20)
        ));

        LocalDateTime now = LocalDateTime.now();
        BoardPost post1 = boardPostRepository.save(new BoardPost(
                student1,
                "기숙사 와이파이 상태 어떤가요?",
                "이번 주 들어서 기숙사 3층 와이파이가 조금 끊기는 느낌인데 다른 분들도 비슷한지 궁금합니다.",
                now.minusDays(1)
        ));
        BoardPost post2 = boardPostRepository.save(new BoardPost(
                student2,
                "교양 수업 추천 부탁드립니다",
                "2학기 수강신청 전에 부담이 너무 크지 않은 교양 과목 추천 부탁드립니다. 발표 비중도 궁금합니다.",
                now.minusHours(10)
        ));

        boardCommentRepository.save(new BoardComment(
                post1,
                student2,
                "어제 밤 기준으로는 괜찮았는데 오늘 저녁에 다시 확인해볼게요.",
                now.minusHours(20)
        ));
        boardCommentRepository.save(new BoardComment(
                post1,
                student1,
                "확인 감사합니다. 계속 끊기면 정보화본부에 문의 넣어보겠습니다.",
                now.minusHours(18)
        ));
        boardCommentRepository.save(new BoardComment(
                post2,
                student1,
                "저는 웹기획입문 들었는데 과제 부담이 적고 팀플도 없어서 무난했습니다.",
                now.minusHours(7)
        ));

    }

    private User ensureUser(String email, String rawPassword, String name, Role role) {
        return userRepository.findByEmail(email)
                .orElseGet(() -> userRepository.save(new User(
                        email,
                        passwordEncoder.encode(rawPassword),
                        name,
                        role
                )));
    }
}
