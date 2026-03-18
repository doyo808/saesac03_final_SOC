package com.campus.platform.dto.lms;

public record SecurityEgressTestResponse(
        String requestId,
        String scenario,
        String exerciseId,
        String method,
        String targetUrl,
        int statusCode,
        long durationMs,
        String result
) {
}
