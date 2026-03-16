package com.campus.platform.exception;

import java.time.LocalDateTime;

public record ApiErrorResponse(
        LocalDateTime timestamp,
        String path,
        String error,
        String message,
        String requestId,
        String reasonCode,
        String source
) {
}
