package com.campus.platform.dto.board;

import java.time.LocalDateTime;

public record BoardCommentResponse(
        Long id,
        Long authorId,
        String authorName,
        String content,
        LocalDateTime createdAt
) {
}
