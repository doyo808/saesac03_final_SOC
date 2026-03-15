package com.campus.platform.exception;

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
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private static final Set<String> TEST_ACCOUNT_EMAILS = Set.of(
            "student1@campus.local",
            "prof1@campus.local",
            "admin1@campus.local"
    );

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiErrorResponse> handleApiException(ApiException ex, HttpServletRequest request) {
        log.warn("API error: status={} path={} message={}", ex.getStatus().value(), request.getRequestURI(), ex.getMessage());
        String message = isTestAccountRequest() ? ex.getMessage() : toGenericMessage(ex.getStatus());

        return ResponseEntity.status(ex.getStatus()).body(
                new ApiErrorResponse(LocalDateTime.now(), request.getRequestURI(), ex.getStatus().name(), message)
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        String message = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(this::formatFieldError)
                .collect(Collectors.joining("; "));

        log.warn("Validation error: path={} message={}", request.getRequestURI(), message);
        String responseMessage = isTestAccountRequest() ? message : toGenericMessage(HttpStatus.BAD_REQUEST);

        return ResponseEntity.badRequest().body(
                new ApiErrorResponse(LocalDateTime.now(), request.getRequestURI(), HttpStatus.BAD_REQUEST.name(), responseMessage)
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpected(Exception ex, HttpServletRequest request) {
        log.error("Unexpected server error: path={}", request.getRequestURI(), ex);
        String message = isTestAccountRequest()
                ? (ex.getMessage() == null ? "Unexpected error" : ex.getMessage())
                : toGenericMessage(HttpStatus.INTERNAL_SERVER_ERROR);

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                new ApiErrorResponse(
                        LocalDateTime.now(),
                        request.getRequestURI(),
                        HttpStatus.INTERNAL_SERVER_ERROR.name(),
                        message
                )
        );
    }

    private String formatFieldError(FieldError error) {
        return error.getField() + ": " + (error.getDefaultMessage() == null ? "invalid value" : error.getDefaultMessage());
    }

    private boolean isTestAccountRequest() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetails userDetails) {
            return TEST_ACCOUNT_EMAILS.contains(userDetails.getUsername().toLowerCase(Locale.ROOT));
        }
        if (principal instanceof String value) {
            return TEST_ACCOUNT_EMAILS.contains(value.toLowerCase(Locale.ROOT));
        }
        return false;
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
}
