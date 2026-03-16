package com.campus.platform.security;

import com.campus.platform.config.RequestIdFilter;
import com.campus.platform.exception.ApiErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

@Component
public class JsonAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private static final Logger log = LoggerFactory.getLogger(JsonAuthenticationEntryPoint.class);
    private static final String ERROR_SOURCE_APP = "APP_SECURITY";
    private final ObjectMapper objectMapper;

    public JsonAuthenticationEntryPoint(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authException
    ) throws IOException, ServletException {
        String requestId = RequestIdFilter.resolveOrCreateRequestId(request);
        request.setAttribute(RequestIdFilter.REQUEST_ID_ATTRIBUTE, requestId);
        log.warn(
                "api-failure requestId={} source={} userId={} role={} endpoint={} method={} status={} reasonCode={} message={}",
                requestId,
                ERROR_SOURCE_APP,
                "-",
                "ANONYMOUS",
                request.getRequestURI(),
                request.getMethod(),
                HttpServletResponse.SC_UNAUTHORIZED,
                "AUTH_REQUIRED",
                authException.getMessage()
        );

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setHeader(RequestIdFilter.REQUEST_ID_HEADER, requestId);
        response.setHeader("X-Error-Source", ERROR_SOURCE_APP);

        ApiErrorResponse body = new ApiErrorResponse(
                LocalDateTime.now(),
                request.getRequestURI(),
                "UNAUTHORIZED",
                "Authentication is required",
                requestId,
                "AUTH_REQUIRED",
                ERROR_SOURCE_APP
        );
        objectMapper.writeValue(response.getOutputStream(), body);
    }
}
