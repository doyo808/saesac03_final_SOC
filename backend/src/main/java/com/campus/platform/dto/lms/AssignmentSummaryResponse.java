package com.campus.platform.dto.lms;

import java.time.LocalDateTime;

public record AssignmentSummaryResponse(
        Long id,
        String title,
        LocalDateTime dueAt
) {
}
