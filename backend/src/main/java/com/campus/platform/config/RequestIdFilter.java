package com.campus.platform.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class RequestIdFilter extends OncePerRequestFilter {

    public static final String REQUEST_ID_HEADER = "X-Request-Id";
    public static final String REQUEST_ID_ATTRIBUTE = "requestId";

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String requestId = resolveOrCreateRequestId(request);
        request.setAttribute(REQUEST_ID_ATTRIBUTE, requestId);
        response.setHeader(REQUEST_ID_HEADER, requestId);
        MDC.put(REQUEST_ID_ATTRIBUTE, requestId);
        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove(REQUEST_ID_ATTRIBUTE);
        }
    }

    public static String resolveOrCreateRequestId(HttpServletRequest request) {
        Object requestAttr = request.getAttribute(REQUEST_ID_ATTRIBUTE);
        if (requestAttr instanceof String value && StringUtils.hasText(value)) {
            return value;
        }

        String fromHeader = request.getHeader(REQUEST_ID_HEADER);
        if (StringUtils.hasText(fromHeader)) {
            return fromHeader.trim();
        }
        return UUID.randomUUID().toString();
    }
}
