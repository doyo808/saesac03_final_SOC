package com.campus.platform.security;

import com.campus.platform.config.RequestIdFilter;
import com.campus.platform.exception.ApiErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class SuspiciousRequestGuardFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(SuspiciousRequestGuardFilter.class);
    private static final String ERROR_SOURCE_GUARD = "APP_GUARD";
    private static final String TRACE_ACCOUNT_EMAIL = "student1@campus.local";
    private static final int MAX_REQUEST_URI_LENGTH = 256;
    private static final int MAX_QUERY_LENGTH = 512;
    private static final int MAX_DECODE_ROUNDS = 2;
    private static final Pattern[] BLOCK_PATTERNS = {
            Pattern.compile("(?i)(?:'|%27)\\s*(?:or|and)\\s+['\\w]+\\s*=\\s*['\\w]+"),
            Pattern.compile("(?i)\\bunion\\b\\s+(?:all\\s+)?\\bselect\\b"),
            Pattern.compile("(?i)<\\s*script\\b"),
            Pattern.compile("(?i)\\$\\{jndi:"),
            Pattern.compile("(?i)(?:\\.\\./|\\.\\.\\\\|%2e%2e|%252e%252e).{0,16}(?:/|\\\\|%2f|%5c)"),
            Pattern.compile("(?i)/etc/passwd|boot\\.ini"),
            Pattern.compile("(?i)(?:;|\\|\\||&&|\\|)\\s*(?:whoami|id|curl|wget|cat)\\b"),
            Pattern.compile("(?i)`[^`]+`|\\$\\([^\\)]+\\)"),
            Pattern.compile("(?i)\\bbenchmark\\s*\\(|\\bwaitfor\\s+delay\\b|\\bsleep\\s*\\("),
            Pattern.compile("(?i)cmd\\.exe\\b|powershell\\s+-enc\\b"),
            Pattern.compile("(?i)<\\s*img\\b[^>]*onerror\\s*=")
    };

    private final ObjectMapper objectMapper;

    public SuspiciousRequestGuardFilter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String uri = request.getRequestURI();
        return uri == null || !uri.startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String requestUri = request.getRequestURI();
        String query = request.getQueryString();

        if (requestUri != null && requestUri.length() > MAX_REQUEST_URI_LENGTH) {
            writeBlockedResponse(request, response, "API_PATH_TOO_LONG", "요청 경로가 너무 깁니다.");
            return;
        }

        if (query != null && query.length() > MAX_QUERY_LENGTH) {
            writeBlockedResponse(request, response, "API_QUERY_TOO_LONG", "요청 쿼리가 너무 깁니다.");
            return;
        }

        Optional<String> matchedPattern = findBlockedPattern(requestUri, query, request.getParameterMap());
        if (matchedPattern.isPresent()) {
            writeBlockedResponse(request, response, "SUSPICIOUS_REQUEST_BLOCKED", "이상한 요청 형식이 감지되었습니다.");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private Optional<String> findBlockedPattern(String requestUri, String query, Map<String, String[]> parameterMap) {
        String raw = requestUri == null ? "" : requestUri;
        if (query != null && !query.isBlank()) {
            raw = raw + "?" + query;
        }

        Set<String> variants = new LinkedHashSet<>();
        variants.add(raw);
        variants.addAll(toParameterVariants(parameterMap));

        String decoded = raw;
        for (int index = 0; index < MAX_DECODE_ROUNDS; index++) {
            decoded = safeDecode(decoded);
            variants.add(decoded);
        }

        for (Pattern pattern : BLOCK_PATTERNS) {
            for (String candidate : variants) {
                if (pattern.matcher(candidate).find()) {
                    return Optional.of(pattern.pattern());
                }
            }
        }

        return Optional.empty();
    }

    private Set<String> toParameterVariants(Map<String, String[]> parameterMap) {
        Set<String> variants = new LinkedHashSet<>();
        if (parameterMap == null || parameterMap.isEmpty()) {
            return variants;
        }

        for (Map.Entry<String, String[]> entry : parameterMap.entrySet()) {
            String name = entry.getKey();
            String[] values = entry.getValue();
            if (values == null || values.length == 0) {
                variants.add(name);
                continue;
            }

            for (String value : values) {
                String candidate = name + "=" + (value == null ? "" : value);
                variants.add(candidate);

                String decoded = candidate;
                for (int index = 0; index < MAX_DECODE_ROUNDS; index++) {
                    decoded = safeDecode(decoded);
                    variants.add(decoded);
                }
            }
        }

        return variants;
    }

    private String safeDecode(String value) {
        try {
            return URLDecoder.decode(value, StandardCharsets.UTF_8);
        } catch (IllegalArgumentException ex) {
            return value;
        }
    }

    private void writeBlockedResponse(
            HttpServletRequest request,
            HttpServletResponse response,
            String reasonCode,
            String message
    ) throws IOException {
        String requestId = RequestIdFilter.resolveOrCreateRequestId(request);
        request.setAttribute(RequestIdFilter.REQUEST_ID_ATTRIBUTE, requestId);

        log.warn(
                "api-failure requestId={} source={} userId={} role={} endpoint={} method={} status={} reasonCode={} message={}",
                requestId,
                ERROR_SOURCE_GUARD,
                "-",
                "ANONYMOUS",
                request.getRequestURI(),
                request.getMethod(),
                HttpStatus.BAD_REQUEST.value(),
                reasonCode,
                message
        );

        response.setStatus(HttpStatus.BAD_REQUEST.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setHeader(RequestIdFilter.REQUEST_ID_HEADER, requestId);
        response.setHeader("X-Error-Source", ERROR_SOURCE_GUARD);

        String remoteUser = request.getRemoteUser();
        boolean traceAccount = remoteUser != null && TRACE_ACCOUNT_EMAIL.equalsIgnoreCase(remoteUser.toLowerCase(Locale.ROOT));

        ApiErrorResponse body = new ApiErrorResponse(
                LocalDateTime.now(),
                request.getRequestURI(),
                HttpStatus.BAD_REQUEST.name(),
                "요청을 처리할 수 없습니다.",
                requestId,
                reasonCode,
                ERROR_SOURCE_GUARD,
                traceAccount
                        ? "status=400 method=" + request.getMethod()
                                + " path=" + request.getRequestURI()
                                + " source=" + ERROR_SOURCE_GUARD
                                + " requestId=" + requestId
                                + " reasonCode=" + reasonCode
                        : null,
                traceAccount
                        ? "WAF를 통과했더라도 백엔드 보호 규칙에서 비정상 요청으로 판단해 차단했습니다."
                        : null
        );
        objectMapper.writeValue(response.getOutputStream(), body);
    }
}
