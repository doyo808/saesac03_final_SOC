package com.campus.platform.dto.lms;

public record AdminStudentOverviewResponse(
        Long studentId,
        String studentName,
        String studentEmail,
        long enrolledCourseCount,
        long submissionCount,
        long gradedSubmissionCount
) {
}
