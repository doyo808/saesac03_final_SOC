package com.campus.platform.dto.publicapi;

import java.time.LocalDateTime;

public record AnnouncementDetailResponse(
        Long id,
        String title,
        String content,
        LocalDateTime createdAt
) {
}
