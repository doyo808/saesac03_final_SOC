package com.campus.platform.dto.board;

import java.time.LocalDateTime;
import java.util.List;

public record BoardPostDetailResponse(
        Long id,
        String title,
        String content,
        Long authorId,
        String authorName,
        LocalDateTime createdAt,
        List<BoardCommentResponse> comments
) {
}
