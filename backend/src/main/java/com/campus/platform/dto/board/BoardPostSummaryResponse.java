package com.campus.platform.dto.board;

import java.time.LocalDateTime;

public record BoardPostSummaryResponse(
        Long id,
        String title,
        String excerpt,
        Long authorId,
        String authorName,
        LocalDateTime createdAt
) {
}
