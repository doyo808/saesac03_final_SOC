package com.campus.platform.dto.lms;

import java.time.LocalDateTime;
import java.util.List;

public record AssignmentDetailResponse(
        Long id,
        Long courseId,
        String courseTitle,
        String title,
        String description,
        LocalDateTime dueAt,
        List<SubmissionResponse> submissions
) {
}
