package com.campus.platform.dto.publicapi;

import java.util.List;

public record AnnouncementPageResponse(
        List<AnnouncementSummaryResponse> items,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean hasPrevious,
        boolean hasNext
) {
}
