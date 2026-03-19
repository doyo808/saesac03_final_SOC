package com.campus.platform.dto.board;

import java.util.List;

public record BoardPostPageResponse(
        List<BoardPostSummaryResponse> items,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean hasPrevious,
        boolean hasNext
) {
}
