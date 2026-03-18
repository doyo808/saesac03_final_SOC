package com.campus.platform.service;

import com.campus.platform.config.RequestIdFilter;
import com.campus.platform.config.SecurityEgressTestProperties;
import com.campus.platform.domain.Role;
import com.campus.platform.dto.lms.SecurityEgressTestRequest;
import com.campus.platform.dto.lms.SecurityEgressTestResponse;
import com.campus.platform.exception.ApiException;
import com.campus.platform.security.UserPrincipal;
import java.net.URI;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@Transactional(readOnly = true)
public class AdminSecurityEgressService {

    private static final Logger log = LoggerFactory.getLogger(AdminSecurityEgressService.class);
    private static final String CANARY_SCENARIO_HEADER = "X-Canary-Scenario";
    private static final String EXERCISE_ID_HEADER = "X-Exercise-Id";
    private static final String USER_AGENT = "campus-platform-egress-test/1.0";

    private final SecurityEgressTestProperties properties;
    private final SecurityEgressGateway securityEgressGateway;

    public AdminSecurityEgressService(
            SecurityEgressTestProperties properties,
            SecurityEgressGateway securityEgressGateway
    ) {
        this.properties = properties;
        this.securityEgressGateway = securityEgressGateway;
    }

    public SecurityEgressTestResponse runTest(
            SecurityEgressTestRequest request,
            UserPrincipal principal,
            String requestId
    ) {
        requireAdmin(principal);
        requireAllowedUser(principal);

        if (!properties.isEnabled()) {
            throw new ApiException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "훈련용 서버 발신 기능이 비활성화되어 있습니다.",
                    "SECURITY_EGRESS_DISABLED"
            );
        }

        String scenario = normalizeScenario(request.scenario());
        String method = normalizeMethod(request.method());
        String path = normalizePath(request.path());
        String exerciseId = normalizeOptional(request.exerciseId());
        String body = normalizeBody(request.body());
        if ("GET".equals(method) && StringUtils.hasText(body)) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "GET 요청에는 body를 보낼 수 없습니다.",
                    "BODY_NOT_ALLOWED_FOR_GET"
            );
        }

        URI baseUri = toBaseUri(properties.getBaseUrl());
        URI targetUri = resolveTargetUri(baseUri, path);

        Map<String, String> headers = new LinkedHashMap<>();
        headers.put(RequestIdFilter.REQUEST_ID_HEADER, requestId);
        headers.put(CANARY_SCENARIO_HEADER, scenario);
        headers.put("User-Agent", USER_AGENT);
        if (StringUtils.hasText(exerciseId)) {
            headers.put(EXERCISE_ID_HEADER, exerciseId);
        }

        log.info(
                "security-egress-test-start requestId={} adminUserId={} scenario={} method={} targetUrl={} exerciseId={}",
                requestId,
                principal.getId(),
                scenario,
                method,
                targetUri,
                safeValue(exerciseId)
        );

        try {
            SecurityEgressGateway.OutboundResponse response = securityEgressGateway.execute(
                    new SecurityEgressGateway.OutboundRequest(
                            targetUri,
                            method,
                            headers,
                            resolveContentType(body),
                            body
                    ),
                    Duration.ofMillis(Math.max(properties.getConnectTimeoutMs(), 1)),
                    Duration.ofMillis(Math.max(properties.getReadTimeoutMs(), 1))
            );

            log.info(
                    "security-egress-test-complete requestId={} adminUserId={} scenario={} method={} targetUrl={} exerciseId={} statusCode={} durationMs={}",
                    requestId,
                    principal.getId(),
                    scenario,
                    method,
                    targetUri,
                    safeValue(exerciseId),
                    response.statusCode(),
                    response.durationMs()
            );

            return new SecurityEgressTestResponse(
                    requestId,
                    scenario,
                    exerciseId,
                    method,
                    targetUri.toString(),
                    response.statusCode(),
                    response.durationMs(),
                    "COMPLETED"
            );
        } catch (IllegalStateException ex) {
            log.warn(
                    "security-egress-test-failed requestId={} adminUserId={} scenario={} method={} targetUrl={} exerciseId={} message={}",
                    requestId,
                    principal.getId(),
                    scenario,
                    method,
                    targetUri,
                    safeValue(exerciseId),
                    ex.getMessage()
            );
            throw new ApiException(
                    HttpStatus.BAD_GATEWAY,
                    "Canary target request failed",
                    "EGRESS_TARGET_UNREACHABLE"
            );
        }
    }

    private String normalizeScenario(String scenario) {
        String value = normalizeOptional(scenario);
        if (!StringUtils.hasText(value)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "시나리오 값이 필요합니다.", "VALIDATION_ERROR");
        }
        return value;
    }

    private String normalizeMethod(String method) {
        String value = normalizeOptional(method);
        if (!StringUtils.hasText(value)) {
            throw invalidConfiguration("HTTP method");
        }

        String upper = value.toUpperCase(Locale.ROOT);
        if (!"GET".equals(upper) && !"POST".equals(upper)) {
            throw invalidConfiguration("HTTP method");
        }
        return upper;
    }

    private String normalizePath(String path) {
        String value = normalizeOptional(path);
        if (!StringUtils.hasText(value)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "path 값이 필요합니다.", "VALIDATION_ERROR");
        }
        if (!value.startsWith("/") || value.startsWith("//") || value.contains("://") || value.contains("\\")) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "허용되지 않는 path 형식입니다.",
                    "INVALID_EGRESS_PATH"
            );
        }
        if (value.contains("\r") || value.contains("\n")) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "path 값에 줄바꿈을 포함할 수 없습니다.",
                    "INVALID_EGRESS_PATH"
            );
        }
        return value;
    }

    private URI toBaseUri(String rawUrl) {
        String value = normalizeOptional(rawUrl);
        if (!StringUtils.hasText(value)) {
            throw invalidConfiguration("base URL");
        }

        try {
            URI uri = URI.create(value);
            if (!StringUtils.hasText(uri.getScheme()) || !StringUtils.hasText(uri.getHost())) {
                throw invalidConfiguration("base URL");
            }
            return uri;
        } catch (IllegalArgumentException ex) {
            throw new ApiException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "훈련 시나리오 base URL 설정이 올바르지 않습니다.",
                    "INVALID_EGRESS_CONFIGURATION"
            );
        }
    }

    private URI resolveTargetUri(URI baseUri, String path) {
        try {
            return baseUri.resolve(path);
        } catch (IllegalArgumentException ex) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "target path를 조합할 수 없습니다.",
                    "INVALID_EGRESS_PATH"
            );
        }
    }

    private String normalizeBody(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private String resolveContentType(String body) {
        if (!StringUtils.hasText(body)) {
            return null;
        }

        String trimmed = body.trim();
        if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
            return "application/json";
        }
        return "text/plain; charset=UTF-8";
    }

    private ApiException invalidConfiguration(String propertyName) {
        return new ApiException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "훈련 시나리오 " + propertyName + " 설정이 올바르지 않습니다.",
                "INVALID_EGRESS_CONFIGURATION"
        );
    }

    private void requireAdmin(UserPrincipal principal) {
        if (principal == null || principal.getRole() != Role.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Admin permission is required");
        }
    }

    private void requireAllowedUser(UserPrincipal principal) {
        if (principal == null) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Admin permission is required");
        }

        if (properties.allowedUserEmailList().isEmpty()) {
            return;
        }

        String email = principal.getUsername().toLowerCase(Locale.ROOT);
        if (!properties.allowedUserEmailList().contains(email)) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Configured training account is required",
                    "SECURITY_EGRESS_ACCOUNT_RESTRICTED"
            );
        }
    }

    private String normalizeOptional(String value) {
        return value == null ? null : value.trim();
    }

    private String safeValue(String value) {
        return StringUtils.hasText(value) ? value : "-";
    }
}
