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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

@Component
public class JsonAccessDeniedHandler implements AccessDeniedHandler {

    private static final Logger log = LoggerFactory.getLogger(JsonAccessDeniedHandler.class);
    private static final String ERROR_SOURCE_APP = "APP_SECURITY";
    private final ObjectMapper objectMapper;

    public JsonAccessDeniedHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void handle(
            HttpServletRequest request,
            HttpServletResponse response,
            AccessDeniedException accessDeniedException
    ) throws IOException, ServletException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String requestId = RequestIdFilter.resolveOrCreateRequestId(request);
        request.setAttribute(RequestIdFilter.REQUEST_ID_ATTRIBUTE, requestId);

        String userId = "-";
        String role = "ANONYMOUS";
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal userPrincipal) {
            userId = String.valueOf(userPrincipal.getId());
            role = userPrincipal.getRole().name();
        }

        log.warn(
                "api-failure requestId={} source={} userId={} role={} endpoint={} method={} status={} reasonCode={} message={}",
                requestId,
                ERROR_SOURCE_APP,
                userId,
                role,
                request.getRequestURI(),
                request.getMethod(),
                HttpServletResponse.SC_FORBIDDEN,
                "ACCESS_DENIED",
                accessDeniedException.getMessage()
        );

        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setHeader(RequestIdFilter.REQUEST_ID_HEADER, requestId);
        response.setHeader("X-Error-Source", ERROR_SOURCE_APP);

        ApiErrorResponse body = new ApiErrorResponse(
                LocalDateTime.now(),
                request.getRequestURI(),
                "FORBIDDEN",
                "You do not have permission to access this resource",
                requestId,
                "ACCESS_DENIED",
                ERROR_SOURCE_APP
        );
        objectMapper.writeValue(response.getOutputStream(), body);
    }
}
