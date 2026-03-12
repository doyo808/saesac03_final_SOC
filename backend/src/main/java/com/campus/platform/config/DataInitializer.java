package com.campus.platform.config;

import com.campus.platform.domain.AcademicEvent;
import com.campus.platform.domain.Announcement;
import com.campus.platform.domain.Assignment;
import com.campus.platform.domain.Course;
import com.campus.platform.domain.Enrollment;
import com.campus.platform.domain.Role;
import com.campus.platform.domain.User;
import com.campus.platform.repository.AcademicEventRepository;
import com.campus.platform.repository.AnnouncementRepository;
import com.campus.platform.repository.AssignmentRepository;
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
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(
            UserRepository userRepository,
            AnnouncementRepository announcementRepository,
            AcademicEventRepository academicEventRepository,
            CourseRepository courseRepository,
            EnrollmentRepository enrollmentRepository,
            AssignmentRepository assignmentRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.announcementRepository = announcementRepository;
        this.academicEventRepository = academicEventRepository;
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.assignmentRepository = assignmentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return;
        }

        User student1 = userRepository.save(new User(
                "student1@campus.local",
                passwordEncoder.encode("Password123!"),
                "student1",
                Role.STUDENT
        ));
        User prof1 = userRepository.save(new User(
                "prof1@campus.local",
                passwordEncoder.encode("Password123!"),
                "prof1",
                Role.PROFESSOR
        ));
        userRepository.save(new User(
                "admin1@campus.local",
                passwordEncoder.encode("Password123!"),
                "admin1",
                Role.ADMIN
        ));

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

    }
}
