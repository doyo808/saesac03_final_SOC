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
        User student11 = ensureUser("student11@campus.local", "Password123!", "김민지", Role.STUDENT);
        User student12 = ensureUser("student12@campus.local", "Password123!", "강해린", Role.STUDENT);
        User student13 = ensureUser("student13@campus.local", "Password123!", "장원영", Role.STUDENT);
        User student14 = ensureUser("student14@campus.local", "Password123!", "유지민", Role.STUDENT);
        User student15 = ensureUser("student15@campus.local", "Password123!", "안유진", Role.STUDENT);
        User prof1 = ensureUser("prof1@campus.local", "Password123!", "prof1", Role.PROFESSOR);
        ensureUser("admin1@campus.local", "Password123!", "admin1", Role.ADMIN);

        Course course1 = ensureCourse("CS101", "웹프로그래밍 기초", prof1);
        Course course2 = ensureCourse("SE320", "소프트웨어공학", prof1);
        Course course3 = ensureCourse("DB204", "데이터베이스 시스템", prof1);
        Course course4 = ensureCourse("OS220", "운영체제", prof1);
        Course course5 = ensureCourse("SEC210", "네트워크 보안", prof1);
        Course course6 = ensureCourse("SEC330", "웹애플리케이션보안", prof1);
        Course course7 = ensureCourse("IR310", "디지털 포렌식 개론", prof1);

        ensureEnrollments(student1, course1);
        ensureEnrollments(student11, course1, course2, course3, course5);
        ensureEnrollments(student12, course1, course4, course6, course7);
        ensureEnrollments(student13, course2, course3, course4, course5, course6);
        ensureEnrollments(student14, course1, course2, course7);
        ensureEnrollments(student15, course3, course4, course5, course6);

        LocalDateTime now = LocalDateTime.now();
        ensureAssignment(
                course1,
                "과제 1 - 자기소개 페이지",
                "React로 간단한 자기소개 페이지를 구현하세요.",
                now.plusDays(10)
        );
        ensureAssignment(
                course1,
                "과제 2 - REST API 연동",
                "axios를 사용해 공지사항 API를 연동하세요.",
                now.plusDays(20)
        );
        ensureAssignment(
                course5,
                "실습 1 - 네트워크 보안 로그 읽기",
                "방화벽과 IDS 로그 샘플을 비교하고, nmap -sS, ping sweep, alert tcp 예시가 어떤 식으로 남는지 정리하세요.",
                now.plusDays(14)
        );
        ensureAssignment(
                course6,
                "실습 1 - 웹보안 사례 조사",
                "최근 웹보안 사고 사례 하나를 골라 union select, <script>alert(1)</script>, ../admin 같은 문자열이 어떤 맥락에서 등장했는지 요약하세요.",
                now.plusDays(18)
        );
        ensureAssignment(
                course6,
                "실습 2 - WAF 혼동 문자열 분석",
                "보고서에 select, union, ../uploads, <script> 같은 문자열을 정상 문맥과 공격 문맥으로 나눠 정리하세요.",
                now.plusDays(24)
        );

        ensureAnnouncement(
                "웹보안 실습 문자열 안내",
                "이번 주 실습 자료에는 union select, <script>alert(1)</script>, ../admin 같은 문자열이 포함되어 있습니다. 실제 공격이 아니라 탐지와 과탐 사례 분석용 예시입니다.",
                now.minusDays(3)
        );
        ensureAnnouncement(
                "보안과목 과제 제출 유의사항",
                "네트워크 보안 및 웹애플리케이션보안 과제에는 select 문, script 태그, ../ 경로 예시가 들어갈 수 있으니 본문 맥락을 함께 작성하세요.",
                now.minusDays(1)
        );

        ensureBoardPost(
                student11,
                "웹보안 과제에서 select 문 예시는 어떻게 적나요?",
                "실습 보고서에 union select, order by 1, ../admin 같은 문자열을 설명용으로 쓰려는데 차단되지 않게 문맥을 어떻게 적어야 할지 궁금합니다.",
                now.minusHours(16)
        );
        ensureBoardPost(
                student12,
                "script 태그 예시를 본문에 넣어도 되나요?",
                "웹애플리케이션보안 과제 설명에 <script>alert(1)</script> 와 ../uploads/sample 경로를 예시로 넣으려는데, 정상 보고서로 보이게 쓰는 팁이 있으면 공유 부탁드립니다.",
                now.minusHours(14)
        );

        boolean hasSeedData = announcementRepository.count() > 0
                || academicEventRepository.count() > 0
                || boardPostRepository.count() > 0
                || boardCommentRepository.count() > 0;
        if (hasSeedData) {
            return;
        }

        announcementRepository.save(new Announcement(
                "2026학년도 1학기 개강 안내",
                "개강일은 2026-03-04이며 첫 주는 수강정정 기간입니다.",
                now.minusDays(7)
        ));
        announcementRepository.save(new Announcement(
                "도서관 운영시간 변경",
                "중간고사 기간 동안 도서관이 24시간 운영됩니다.",
                now.minusDays(4)
        ));
        announcementRepository.save(new Announcement(
                "캠퍼스 네트워크 점검",
                "주말 오전 2시부터 5시까지 네트워크 점검이 예정되어 있습니다.",
                now.minusDays(2)
        ));

        academicEventRepository.save(new AcademicEvent("개강", LocalDate.now().plusDays(5)));
        academicEventRepository.save(new AcademicEvent("수강정정 마감", LocalDate.now().plusDays(12)));
        academicEventRepository.save(new AcademicEvent("중간고사", LocalDate.now().plusDays(45)));

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
                .map(existing -> {
                    boolean changed = false;
                    if (!existing.getName().equals(name)) {
                        existing.setName(name);
                        changed = true;
                    }
                    if (existing.getRole() != role) {
                        existing.setRole(role);
                        changed = true;
                    }
                    if (changed) {
                        return userRepository.save(existing);
                    }
                    return existing;
                })
                .orElseGet(() -> userRepository.save(new User(
                        email,
                        passwordEncoder.encode(rawPassword),
                        name,
                        role
                )));
    }

    private Course ensureCourse(String code, String title, User professor) {
        return courseRepository.findByCode(code)
                .map(existing -> {
                    boolean changed = false;
                    if (!existing.getTitle().equals(title)) {
                        existing.setTitle(title);
                        changed = true;
                    }
                    if (!existing.getProfessor().getId().equals(professor.getId())) {
                        existing.setProfessor(professor);
                        changed = true;
                    }
                    if (changed) {
                        return courseRepository.save(existing);
                    }
                    return existing;
                })
                .orElseGet(() -> courseRepository.save(new Course(code, title, professor)));
    }

    private void ensureEnrollments(User student, Course... courses) {
        for (Course course : courses) {
            if (!enrollmentRepository.existsByCourseIdAndStudentId(course.getId(), student.getId())) {
                enrollmentRepository.save(new Enrollment(course, student));
            }
        }
    }

    private void ensureAssignment(Course course, String title, String description, LocalDateTime dueAt) {
        assignmentRepository.findByCourseIdOrderByDueAtAsc(course.getId())
                .stream()
                .filter(item -> item.getTitle().equals(title))
                .findFirst()
                .ifPresentOrElse(existing -> {
                    boolean changed = false;
                    if (!existing.getDescription().equals(description)) {
                        existing.setDescription(description);
                        changed = true;
                    }
                    if (!existing.getDueAt().equals(dueAt)) {
                        existing.setDueAt(dueAt);
                        changed = true;
                    }
                    if (changed) {
                        assignmentRepository.save(existing);
                    }
                }, () -> assignmentRepository.save(new Assignment(course, title, description, dueAt)));
    }

    private void ensureAnnouncement(String title, String content, LocalDateTime createdAt) {
        announcementRepository.findByTitle(title)
                .map(existing -> {
                    boolean changed = false;
                    if (!existing.getContent().equals(content)) {
                        existing.setContent(content);
                        changed = true;
                    }
                    if (!existing.getCreatedAt().equals(createdAt)) {
                        existing.setCreatedAt(createdAt);
                        changed = true;
                    }
                    if (changed) {
                        return announcementRepository.save(existing);
                    }
                    return existing;
                })
                .orElseGet(() -> announcementRepository.save(new Announcement(title, content, createdAt)));
    }

    private void ensureBoardPost(User author, String title, String content, LocalDateTime createdAt) {
        boardPostRepository.findByAuthorIdAndTitle(author.getId(), title)
                .map(existing -> {
                    boolean changed = false;
                    if (!existing.getContent().equals(content)) {
                        existing.setContent(content);
                        changed = true;
                    }
                    if (!existing.getCreatedAt().equals(createdAt)) {
                        existing.setCreatedAt(createdAt);
                        changed = true;
                    }
                    if (changed) {
                        return boardPostRepository.save(existing);
                    }
                    return existing;
                })
                .orElseGet(() -> boardPostRepository.save(new BoardPost(author, title, content, createdAt)));
    }
}
