package com.campus.platform.dto.lms;

public record CourseResponse(
        Long id,
        String code,
        String title,
        Long professorId,
        String professorName
) {
}
