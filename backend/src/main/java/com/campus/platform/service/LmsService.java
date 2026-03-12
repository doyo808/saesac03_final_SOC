package com.campus.platform.service;

import com.campus.platform.domain.Assignment;
import com.campus.platform.domain.Course;
import com.campus.platform.domain.Enrollment;
import com.campus.platform.domain.Role;
import com.campus.platform.domain.Submission;
import com.campus.platform.domain.User;
import com.campus.platform.dto.lms.AdminCourseResponse;
import com.campus.platform.dto.lms.AdminEnrollmentResponse;
import com.campus.platform.dto.lms.AdminStudentOverviewResponse;
import com.campus.platform.dto.lms.AdminUserResponse;
import com.campus.platform.dto.lms.AssignmentDetailResponse;
import com.campus.platform.dto.lms.AssignmentSummaryResponse;
import com.campus.platform.dto.lms.CourseResponse;
import com.campus.platform.dto.lms.CreateEnrollmentRequest;
import com.campus.platform.dto.lms.GradeSubmissionRequest;
import com.campus.platform.dto.lms.SubmissionResponse;
import com.campus.platform.dto.lms.SubmitAssignmentRequest;
import com.campus.platform.exception.ApiException;
import com.campus.platform.repository.AssignmentRepository;
import com.campus.platform.repository.CourseRepository;
import com.campus.platform.repository.EnrollmentRepository;
import com.campus.platform.repository.SubmissionRepository;
import com.campus.platform.repository.UserRepository;
import com.campus.platform.security.UserPrincipal;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class LmsService {

    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;
    private final UserRepository userRepository;

    public LmsService(
            CourseRepository courseRepository,
            EnrollmentRepository enrollmentRepository,
            AssignmentRepository assignmentRepository,
            SubmissionRepository submissionRepository,
            UserRepository userRepository
    ) {
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.assignmentRepository = assignmentRepository;
        this.submissionRepository = submissionRepository;
        this.userRepository = userRepository;
    }

    public List<CourseResponse> getMyCourses(UserPrincipal principal) {
        if (principal.getRole() == Role.STUDENT) {
            return enrollmentRepository.findByStudentId(principal.getId())
                    .stream()
                    .map(Enrollment::getCourse)
                    .map(this::toCourseResponse)
                    .toList();
        }

        if (principal.getRole() == Role.PROFESSOR) {
            return courseRepository.findByProfessorId(principal.getId())
                    .stream()
                    .map(this::toCourseResponse)
                    .toList();
        }

        return courseRepository.findAll()
                .stream()
                .map(this::toCourseResponse)
                .toList();
    }

    public List<AssignmentSummaryResponse> getAssignmentsByCourse(Long courseId, UserPrincipal principal) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Course not found"));
        assertCanViewCourse(course, principal);

        return assignmentRepository.findByCourseIdOrderByDueAtAsc(courseId)
                .stream()
                .map(item -> new AssignmentSummaryResponse(item.getId(), item.getTitle(), item.getDueAt()))
                .toList();
    }

    public AssignmentDetailResponse getAssignment(Long assignmentId, UserPrincipal principal) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Assignment not found"));
        Course course = assignment.getCourse();
        assertCanViewCourse(course, principal);

        List<SubmissionResponse> submissions;
        if (principal.getRole() == Role.STUDENT) {
            submissions = submissionRepository.findByAssignmentIdAndStudentId(assignmentId, principal.getId())
                    .map(this::toSubmissionResponse)
                    .stream()
                    .toList();
        } else {
            submissions = submissionRepository.findByAssignmentIdOrderBySubmittedAtDesc(assignmentId)
                    .stream()
                    .map(this::toSubmissionResponse)
                    .toList();
        }

        return new AssignmentDetailResponse(
                assignment.getId(),
                course.getId(),
                course.getTitle(),
                assignment.getTitle(),
                assignment.getDescription(),
                assignment.getDueAt(),
                submissions
        );
    }

    @Transactional
    public SubmissionResponse submitAssignment(Long assignmentId, SubmitAssignmentRequest request, UserPrincipal principal) {
        if (principal.getRole() != Role.STUDENT) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only students can submit assignments");
        }

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Assignment not found"));

        Course course = assignment.getCourse();
        boolean enrolled = enrollmentRepository.existsByCourseIdAndStudentId(course.getId(), principal.getId());
        if (!enrolled) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Not enrolled in this course");
        }

        if (submissionRepository.findByAssignmentIdAndStudentId(assignmentId, principal.getId()).isPresent()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Already submitted");
        }

        User student = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        Submission submission = new Submission(
                assignment,
                student,
                request.contentText(),
                LocalDateTime.now()
        );
        Submission saved = submissionRepository.save(submission);
        return toSubmissionResponse(saved);
    }

    @Transactional
    public SubmissionResponse gradeSubmission(Long submissionId, GradeSubmissionRequest request, UserPrincipal principal) {
        if (principal.getRole() != Role.PROFESSOR && principal.getRole() != Role.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only professor or admin can grade");
        }

        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Submission not found"));

        Course course = submission.getAssignment().getCourse();
        if (principal.getRole() == Role.PROFESSOR && !course.getProfessor().getId().equals(principal.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only course professor can grade this submission");
        }

        submission.setScore(request.score());
        submission.setFeedback(request.feedback());
        Submission saved = submissionRepository.save(submission);
        return toSubmissionResponse(saved);
    }

    public List<AdminUserResponse> getAdminUsers(UserPrincipal principal) {
        requireAdmin(principal);
        return userRepository.findAll()
                .stream()
                .map(user -> new AdminUserResponse(user.getId(), user.getEmail(), user.getName(), user.getRole()))
                .toList();
    }

    public List<AdminCourseResponse> getAdminCourses(UserPrincipal principal) {
        requireAdmin(principal);
        return courseRepository.findAll()
                .stream()
                .map(course -> new AdminCourseResponse(
                        course.getId(),
                        course.getCode(),
                        course.getTitle(),
                        course.getProfessor().getId(),
                        course.getProfessor().getName()
                ))
                .toList();
    }

    public List<AdminEnrollmentResponse> getAdminEnrollments(UserPrincipal principal) {
        requireAdmin(principal);
        return enrollmentRepository.findAllByOrderByIdDesc()
                .stream()
                .map(this::toAdminEnrollmentResponse)
                .toList();
    }

    @Transactional
    public AdminEnrollmentResponse createEnrollment(CreateEnrollmentRequest request, UserPrincipal principal) {
        requireAdmin(principal);

        Course course = courseRepository.findById(request.courseId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Course not found"));
        User student = userRepository.findById(request.studentId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Student not found"));

        if (student.getRole() != Role.STUDENT) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Selected user is not a student");
        }

        if (enrollmentRepository.existsByCourseIdAndStudentId(course.getId(), student.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Enrollment already exists");
        }

        Enrollment saved = enrollmentRepository.save(new Enrollment(course, student));
        return toAdminEnrollmentResponse(saved);
    }

    @Transactional
    public void deleteEnrollment(Long enrollmentId, UserPrincipal principal) {
        requireAdmin(principal);
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Enrollment not found"));
        enrollmentRepository.delete(enrollment);
    }

    public List<AdminStudentOverviewResponse> getAdminStudentOverviews(UserPrincipal principal) {
        requireAdmin(principal);

        return userRepository.findByRoleOrderByNameAsc(Role.STUDENT)
                .stream()
                .map(student -> new AdminStudentOverviewResponse(
                        student.getId(),
                        student.getName(),
                        student.getEmail(),
                        enrollmentRepository.countByStudentId(student.getId()),
                        submissionRepository.countByStudentId(student.getId()),
                        submissionRepository.countByStudentIdAndScoreIsNotNull(student.getId())
                ))
                .toList();
    }

    private void assertCanViewCourse(Course course, UserPrincipal principal) {
        if (principal.getRole() == Role.ADMIN) {
            return;
        }

        if (principal.getRole() == Role.PROFESSOR) {
            if (!course.getProfessor().getId().equals(principal.getId())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Course is not assigned to this professor");
            }
            return;
        }

        if (principal.getRole() == Role.STUDENT) {
            boolean enrolled = enrollmentRepository.existsByCourseIdAndStudentId(course.getId(), principal.getId());
            if (!enrolled) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Not enrolled in this course");
            }
            return;
        }

        throw new ApiException(HttpStatus.FORBIDDEN, "Access denied");
    }

    private void requireAdmin(UserPrincipal principal) {
        if (principal == null || principal.getRole() != Role.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Admin permission is required");
        }
    }

    private CourseResponse toCourseResponse(Course course) {
        return new CourseResponse(
                course.getId(),
                course.getCode(),
                course.getTitle(),
                course.getProfessor().getId(),
                course.getProfessor().getName()
        );
    }

    private SubmissionResponse toSubmissionResponse(Submission submission) {
        return new SubmissionResponse(
                submission.getId(),
                submission.getStudent().getId(),
                submission.getStudent().getName(),
                submission.getContentText(),
                submission.getSubmittedAt(),
                submission.getScore(),
                submission.getFeedback()
        );
    }

    private AdminEnrollmentResponse toAdminEnrollmentResponse(Enrollment enrollment) {
        return new AdminEnrollmentResponse(
                enrollment.getId(),
                enrollment.getCourse().getId(),
                enrollment.getCourse().getCode(),
                enrollment.getCourse().getTitle(),
                enrollment.getStudent().getId(),
                enrollment.getStudent().getName(),
                enrollment.getStudent().getEmail()
        );
    }
}
