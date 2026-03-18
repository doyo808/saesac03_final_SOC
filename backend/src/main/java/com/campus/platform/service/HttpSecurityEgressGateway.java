package com.campus.platform.service;

import java.io.IOException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Locale;
import java.util.concurrent.TimeUnit;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class HttpSecurityEgressGateway implements SecurityEgressGateway {

    @Override
    public OutboundResponse execute(OutboundRequest request, Duration connectTimeout, Duration readTimeout) {
        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(connectTimeout)
                .followRedirects(HttpClient.Redirect.NEVER)
                .build();

        HttpRequest.Builder builder = HttpRequest.newBuilder(request.uri())
                .timeout(readTimeout);

        request.headers().forEach(builder::header);
        if (StringUtils.hasText(request.contentType())) {
            builder.header("Content-Type", request.contentType());
        }

        String method = request.method().trim().toUpperCase(Locale.ROOT);
        switch (method) {
            case "GET" -> builder.GET();
            case "POST" -> builder.POST(
                    StringUtils.hasText(request.body())
                            ? HttpRequest.BodyPublishers.ofString(request.body(), StandardCharsets.UTF_8)
                            : HttpRequest.BodyPublishers.noBody()
            );
            default -> throw new IllegalArgumentException("Unsupported HTTP method: " + method);
        }

        long startedAt = System.nanoTime();
        try {
            HttpResponse<Void> response = client.send(builder.build(), HttpResponse.BodyHandlers.discarding());
            long durationMs = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startedAt);
            return new OutboundResponse(response.statusCode(), durationMs);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Outbound request was interrupted", ex);
        } catch (IOException ex) {
            throw new IllegalStateException("Outbound request failed", ex);
        }
    }
}
