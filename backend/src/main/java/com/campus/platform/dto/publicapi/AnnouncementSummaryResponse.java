package com.campus.platform.dto.publicapi;

import java.time.LocalDateTime;

public record AnnouncementSummaryResponse(
        Long id,
        String title,
        LocalDateTime createdAt
) {
}
