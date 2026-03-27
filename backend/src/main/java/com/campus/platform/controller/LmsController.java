package com.campus.platform.controller;

import com.campus.platform.dto.lms.AssignmentDetailResponse;
import com.campus.platform.dto.lms.AssignmentSummaryResponse;
import com.campus.platform.dto.lms.CourseResponse;
import com.campus.platform.dto.lms.CreateEnrollmentRequest;
import com.campus.platform.dto.lms.GradeSubmissionRequest;
import com.campus.platform.dto.lms.SubmissionResponse;
import com.campus.platform.dto.lms.SubmitAssignmentRequest;
import com.campus.platform.dto.lms.AdminCourseResponse;
import com.campus.platform.dto.lms.AdminEnrollmentResponse;
import com.campus.platform.dto.lms.AdminStudentOverviewResponse;
import com.campus.platform.dto.lms.AdminUserResponse;
import com.campus.platform.security.UserPrincipal;
import com.campus.platform.service.LmsService;
import com.campus.platform.service.SubmissionUpsertResult;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/lms")
public class LmsController {

    private final LmsService lmsService;

    public LmsController(LmsService lmsService) {
        this.lmsService = lmsService;
    }

    @GetMapping("/courses/my")
    public List<CourseResponse> myCourses(@AuthenticationPrincipal UserPrincipal principal) {
        return lmsService.getMyCourses(principal);
    }

    @GetMapping("/courses/{courseId}/assignments")
    public List<AssignmentSummaryResponse> assignments(
            @PathVariable Long courseId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return lmsService.getAssignmentsByCourse(courseId, principal);
    }

    @GetMapping("/assignments/{id}")
    public AssignmentDetailResponse assignment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return lmsService.getAssignment(id, principal);
    }

    @PostMapping("/assignments/{id}/submissions")
    public ResponseEntity<SubmissionResponse> submit(
            @PathVariable Long id,
            @Valid @RequestBody SubmitAssignmentRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        SubmissionUpsertResult result = lmsService.submitAssignment(id, request, principal);
        HttpStatus status = result.created() ? HttpStatus.CREATED : HttpStatus.OK;
        return ResponseEntity.status(status).body(result.submission());
    }

    @PostMapping("/submissions/{id}/grade")
    public SubmissionResponse grade(
            @PathVariable Long id,
            @Valid @RequestBody GradeSubmissionRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return lmsService.gradeSubmission(id, request, principal);
    }

    @GetMapping("/admin/users")
    public List<AdminUserResponse> adminUsers(@AuthenticationPrincipal UserPrincipal principal) {
        return lmsService.getAdminUsers(principal);
    }

    @GetMapping("/admin/courses")
    public List<AdminCourseResponse> adminCourses(@AuthenticationPrincipal UserPrincipal principal) {
        return lmsService.getAdminCourses(principal);
    }

    @GetMapping("/admin/enrollments")
    public List<AdminEnrollmentResponse> adminEnrollments(@AuthenticationPrincipal UserPrincipal principal) {
        return lmsService.getAdminEnrollments(principal);
    }

    @PostMapping("/admin/enrollments")
    @ResponseStatus(HttpStatus.CREATED)
    public AdminEnrollmentResponse createEnrollment(
            @Valid @RequestBody CreateEnrollmentRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return lmsService.createEnrollment(request, principal);
    }

    @DeleteMapping("/admin/enrollments/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteEnrollment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        lmsService.deleteEnrollment(id, principal);
    }

    @GetMapping("/admin/students/overviews")
    public List<AdminStudentOverviewResponse> adminStudentOverviews(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return lmsService.getAdminStudentOverviews(principal);
    }
}
