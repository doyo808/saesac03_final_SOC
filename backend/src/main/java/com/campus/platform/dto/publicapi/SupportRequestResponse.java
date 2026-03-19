package com.campus.platform.dto.publicapi;

import java.time.LocalDateTime;

public record SupportRequestResponse(
        Long id,
        String category,
        String subject,
        String contactEmail,
        String referenceUrl,
        LocalDateTime submittedAt
) {
}
