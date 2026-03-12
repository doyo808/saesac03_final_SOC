package com.campus.platform.dto.lms;

public record AdminCourseResponse(
        Long id,
        String code,
        String title,
        Long professorId,
        String professorName
) {
}
