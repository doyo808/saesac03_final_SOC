package com.campus.platform.dto.lms;

public record AdminEnrollmentResponse(
        Long id,
        Long courseId,
        String courseCode,
        String courseTitle,
        Long studentId,
        String studentName,
        String studentEmail
) {
}
