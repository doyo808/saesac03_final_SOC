package com.campus.platform.exception;

import com.campus.platform.config.RequestIdFilter;
import com.campus.platform.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private static final String ERROR_SOURCE_APP = "APP";
    private static final Set<String> TEST_ACCOUNT_EMAILS = Set.of(
            "student1@campus.local",
            "prof1@campus.local",
            "admin1@campus.local"
    );
    private static final Set<String> TRACE_ACCOUNT_EMAILS = Set.of("student1@campus.local");

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiErrorResponse> handleApiException(ApiException ex, HttpServletRequest request) {
        AuthLogContext auth = resolveAuthContext();
        String requestId = resolveRequestId(request);
        String reasonCode = ex.getReasonCode();
        logFailure(requestId, request, auth, ex.getStatus().value(), reasonCode, ex.getMessage());

        String message = isDetailedMessageAllowed(auth.email()) ? ex.getMessage() : toGenericMessage(ex.getStatus());
        traceStudentRequest(requestId, request, auth, ex.getStatus().value(), reasonCode);

        return ResponseEntity.status(ex.getStatus())
                .header(RequestIdFilter.REQUEST_ID_HEADER, requestId)
                .header("X-Error-Source", ERROR_SOURCE_APP)
                .body(
                new ApiErrorResponse(
                        LocalDateTime.now(),
                        request.getRequestURI(),
                        ex.getStatus().name(),
                        message,
                        requestId,
                        reasonCode,
                        ERROR_SOURCE_APP
                )
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        AuthLogContext auth = resolveAuthContext();
        String requestId = resolveRequestId(request);
        String message = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(this::formatFieldError)
                .collect(Collectors.joining("; "));

        logFailure(requestId, request, auth, HttpStatus.BAD_REQUEST.value(), "VALIDATION_ERROR", message);
        traceStudentRequest(requestId, request, auth, HttpStatus.BAD_REQUEST.value(), "VALIDATION_ERROR");
        String responseMessage = isDetailedMessageAllowed(auth.email()) ? message : toGenericMessage(HttpStatus.BAD_REQUEST);

        return ResponseEntity.badRequest()
                .header(RequestIdFilter.REQUEST_ID_HEADER, requestId)
                .header("X-Error-Source", ERROR_SOURCE_APP)
                .body(
                new ApiErrorResponse(
                        LocalDateTime.now(),
                        request.getRequestURI(),
                        HttpStatus.BAD_REQUEST.name(),
                        responseMessage,
                        requestId,
                        "VALIDATION_ERROR",
                        ERROR_SOURCE_APP
                )
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpected(Exception ex, HttpServletRequest request) {
        AuthLogContext auth = resolveAuthContext();
        String requestId = resolveRequestId(request);
        log.error(
                "api-failure requestId={} source={} userId={} role={} endpoint={} method={} status={} reasonCode={} message={}",
                requestId,
                ERROR_SOURCE_APP,
                auth.userId(),
                auth.role(),
                request.getRequestURI(),
                request.getMethod(),
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "UNEXPECTED_ERROR",
                ex.getMessage(),
                ex
        );
        traceStudentRequest(requestId, request, auth, HttpStatus.INTERNAL_SERVER_ERROR.value(), "UNEXPECTED_ERROR");
        String message = isDetailedMessageAllowed(auth.email())
                ? (ex.getMessage() == null ? "Unexpected error" : ex.getMessage())
                : toGenericMessage(HttpStatus.INTERNAL_SERVER_ERROR);

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .header(RequestIdFilter.REQUEST_ID_HEADER, requestId)
                .header("X-Error-Source", ERROR_SOURCE_APP)
                .body(
                new ApiErrorResponse(
                        LocalDateTime.now(),
                        request.getRequestURI(),
                        HttpStatus.INTERNAL_SERVER_ERROR.name(),
                        message,
                        requestId,
                        "UNEXPECTED_ERROR",
                        ERROR_SOURCE_APP
                )
        );
    }

    private String formatFieldError(FieldError error) {
        return error.getField() + ": " + (error.getDefaultMessage() == null ? "invalid value" : error.getDefaultMessage());
    }

    private void logFailure(
            String requestId,
            HttpServletRequest request,
            AuthLogContext auth,
            int status,
            String reasonCode,
            String message
    ) {
        log.warn(
                "api-failure requestId={} source={} userId={} role={} endpoint={} method={} status={} reasonCode={} message={}",
                requestId,
                ERROR_SOURCE_APP,
                auth.userId(),
                auth.role(),
                request.getRequestURI(),
                request.getMethod(),
                status,
                reasonCode,
                message
        );
    }

    private void traceStudentRequest(
            String requestId,
            HttpServletRequest request,
            AuthLogContext auth,
            int status,
            String reasonCode
    ) {
        if (!shouldTraceAccount(auth.email())) {
            return;
        }
        log.info(
                "student-trace requestId={} userId={} role={} endpoint={} method={} status={} reasonCode={}",
                requestId,
                auth.userId(),
                auth.role(),
                request.getRequestURI(),
                request.getMethod(),
                status,
                reasonCode
        );
    }

    private String resolveRequestId(HttpServletRequest request) {
        String requestId = RequestIdFilter.resolveOrCreateRequestId(request);
        request.setAttribute(RequestIdFilter.REQUEST_ID_ATTRIBUTE, requestId);
        return requestId;
    }

    private AuthLogContext resolveAuthContext() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return new AuthLogContext("-", "ANONYMOUS", null);
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof UserPrincipal userPrincipal) {
            return new AuthLogContext(
                    String.valueOf(userPrincipal.getId()),
                    userPrincipal.getRole().name(),
                    userPrincipal.getUsername().toLowerCase(Locale.ROOT)
            );
        }
        if (principal instanceof UserDetails userDetails) {
            return new AuthLogContext(
                    "-",
                    resolveRole(authentication),
                    userDetails.getUsername().toLowerCase(Locale.ROOT)
            );
        }
        if (principal instanceof String value) {
            if ("anonymousUser".equalsIgnoreCase(value)) {
                return new AuthLogContext("-", "ANONYMOUS", null);
            }
            return new AuthLogContext("-", resolveRole(authentication), value.toLowerCase(Locale.ROOT));
        }
        return new AuthLogContext("-", resolveRole(authentication), null);
    }

    private String resolveRole(Authentication authentication) {
        return authentication.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst()
                .orElse("UNKNOWN");
    }

    private boolean isDetailedMessageAllowed(String email) {
        if (email == null) {
            return false;
        }
        return TEST_ACCOUNT_EMAILS.contains(email.toLowerCase(Locale.ROOT));
    }

    private boolean shouldTraceAccount(String email) {
        if (email == null) {
            return false;
        }
        return TRACE_ACCOUNT_EMAILS.contains(email.toLowerCase(Locale.ROOT));
    }

    private String toGenericMessage(HttpStatus status) {
        return switch (status) {
            case BAD_REQUEST -> "요청을 처리할 수 없습니다.";
            case UNAUTHORIZED -> "인증이 필요합니다.";
            case FORBIDDEN -> "권한이 없습니다.";
            case NOT_FOUND -> "요청한 리소스를 찾을 수 없습니다.";
            case CONFLICT -> "요청이 충돌했습니다.";
            default -> "요청 처리 중 오류가 발생했습니다.";
        };
    }

    private record AuthLogContext(String userId, String role, String email) {
    }
}
