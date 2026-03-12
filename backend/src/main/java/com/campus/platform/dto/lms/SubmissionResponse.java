package com.campus.platform.dto.lms;

import java.time.LocalDateTime;

public record SubmissionResponse(
        Long id,
        Long studentId,
        String studentName,
        String contentText,
        LocalDateTime submittedAt,
        Integer score,
        String feedback
) {
}
