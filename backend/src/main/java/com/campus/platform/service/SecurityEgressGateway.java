package com.campus.platform.service;

import java.net.URI;
import java.time.Duration;
import java.util.Map;

public interface SecurityEgressGateway {

    OutboundResponse execute(OutboundRequest request, Duration connectTimeout, Duration readTimeout);

    record OutboundRequest(
            URI uri,
            String method,
            Map<String, String> headers,
            String contentType,
            String body
    ) {
    }

    record OutboundResponse(
            int statusCode,
            long durationMs
    ) {
    }
}
