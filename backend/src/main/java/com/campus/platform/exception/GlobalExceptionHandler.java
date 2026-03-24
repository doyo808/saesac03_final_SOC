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
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private static final String ERROR_SOURCE_APP = "APP";
    private static final String TRACE_ACCOUNT_EMAIL = "student1@campus.local";
    private static final Set<String> TEST_ACCOUNT_EMAILS = Set.of(
            "student1@campus.local",
            "prof1@campus.local",
            "admin1@campus.local"
    );

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiErrorResponse> handleApiException(ApiException ex, HttpServletRequest request) {
        AuthLogContext auth = resolveAuthContext();
        String requestId = resolveRequestId(request);
        String reasonCode = ex.getReasonCode();
        logFailure(requestId, request, auth, ex.getStatus().value(), reasonCode, ex.getMessage());

        String message = isDetailedMessageAllowed(auth.email()) ? ex.getMessage() : toGenericMessage(ex.getStatus());
        String detail = buildDiagnosticDetail(request, auth, ex.getStatus(), reasonCode, ERROR_SOURCE_APP);
        String hint = buildDiagnosticHint(request, ex.getStatus(), reasonCode, ERROR_SOURCE_APP, false);
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
                        ERROR_SOURCE_APP,
                        detail,
                        hint
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
        String detail = buildDiagnosticDetail(request, auth, HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", ERROR_SOURCE_APP);
        String hint = buildDiagnosticHint(request, HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", ERROR_SOURCE_APP, false);

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
                        ERROR_SOURCE_APP,
                        detail,
                        hint
                )
        );
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNoResourceFound(
            NoResourceFoundException ex,
            HttpServletRequest request
    ) {
        return buildNotFoundResponse(request);
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNoHandlerFound(
            NoHandlerFoundException ex,
            HttpServletRequest request
    ) {
        return buildNotFoundResponse(request);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiErrorResponse> handleMethodArgumentTypeMismatch(
            MethodArgumentTypeMismatchException ex,
            HttpServletRequest request
    ) {
        if (isApiPath(request.getRequestURI())
                && ex.getParameter() != null
                && ex.getParameter().hasParameterAnnotation(PathVariable.class)) {
            return buildNotFoundResponse(request);
        }
        return buildBadRequestResponse(request, "TYPE_MISMATCH", ex.getMessage());
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiErrorResponse> handleMethodNotSupported(
            HttpRequestMethodNotSupportedException ex,
            HttpServletRequest request
    ) {
        return buildErrorResponse(
                request,
                HttpStatus.METHOD_NOT_ALLOWED,
                "METHOD_NOT_SUPPORTED",
                ex.getMessage()
        );
    }

    private ResponseEntity<ApiErrorResponse> buildNotFoundResponse(HttpServletRequest request) {
        AuthLogContext auth = resolveAuthContext();
        String requestId = resolveRequestId(request);
        String reasonCode = isBoardMutationFallbackPath(request.getMethod(), request.getRequestURI())
                ? "BOARD_MUTATION_FALLBACK_ROUTE_MISSING"
                : "API_PATH_NOT_FOUND";
        String message = buildNoResourceMessage(request, auth, reasonCode);

        logFailure(requestId, request, auth, HttpStatus.NOT_FOUND.value(), reasonCode, message);
        traceStudentRequest(requestId, request, auth, HttpStatus.NOT_FOUND.value(), reasonCode);

        String detail = buildDiagnosticDetail(request, auth, HttpStatus.NOT_FOUND, reasonCode, ERROR_SOURCE_APP);
        String hint = buildNoResourceHint(request, auth, reasonCode);

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .header(RequestIdFilter.REQUEST_ID_HEADER, requestId)
                .header("X-Error-Source", ERROR_SOURCE_APP)
                .body(
                        new ApiErrorResponse(
                                LocalDateTime.now(),
                                request.getRequestURI(),
                                HttpStatus.NOT_FOUND.name(),
                                message,
                                requestId,
                                reasonCode,
                                ERROR_SOURCE_APP,
                                detail,
                                hint
                        )
                );
    }

    private ResponseEntity<ApiErrorResponse> buildBadRequestResponse(
            HttpServletRequest request,
            String reasonCode,
            String message
    ) {
        return buildErrorResponse(request, HttpStatus.BAD_REQUEST, reasonCode, message);
    }

    private ResponseEntity<ApiErrorResponse> buildErrorResponse(
            HttpServletRequest request,
            HttpStatus status,
            String reasonCode,
            String message
    ) {
        AuthLogContext auth = resolveAuthContext();
        String requestId = resolveRequestId(request);
        logFailure(requestId, request, auth, status.value(), reasonCode, message);
        traceStudentRequest(requestId, request, auth, status.value(), reasonCode);
        String responseMessage = isDetailedMessageAllowed(auth.email())
                ? (message == null ? toGenericMessage(status) : message)
                : toGenericMessage(status);
        String detail = buildDiagnosticDetail(request, auth, status, reasonCode, ERROR_SOURCE_APP);
        String hint = buildDiagnosticHint(request, status, reasonCode, ERROR_SOURCE_APP, false);

        return ResponseEntity.status(status)
                .header(RequestIdFilter.REQUEST_ID_HEADER, requestId)
                .header("X-Error-Source", ERROR_SOURCE_APP)
                .body(
                        new ApiErrorResponse(
                                LocalDateTime.now(),
                                request.getRequestURI(),
                                status.name(),
                                responseMessage,
                                requestId,
                                reasonCode,
                                ERROR_SOURCE_APP,
                                detail,
                                hint
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
        String detail = buildDiagnosticDetail(
                request,
                auth,
                HttpStatus.INTERNAL_SERVER_ERROR,
                "UNEXPECTED_ERROR",
                ERROR_SOURCE_APP
        );
        String hint = buildDiagnosticHint(
                request,
                HttpStatus.INTERNAL_SERVER_ERROR,
                "UNEXPECTED_ERROR",
                ERROR_SOURCE_APP,
                false
        );

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
                        ERROR_SOURCE_APP,
                        detail,
                        hint
                )
        );
    }

    private String formatFieldError(FieldError error) {
        return error.getField() + ": " + (error.getDefaultMessage() == null ? "invalid value" : error.getDefaultMessage());
    }

    private String buildNoResourceMessage(HttpServletRequest request, AuthLogContext auth, String reasonCode) {
        if (!isDetailedMessageAllowed(auth.email())) {
            return toGenericMessage(HttpStatus.NOT_FOUND);
        }
        if ("BOARD_MUTATION_FALLBACK_ROUTE_MISSING".equals(reasonCode)) {
            return "게시판 변경 POST fallback 경로를 찾을 수 없습니다. 배포된 WAS가 최신이 아니어서 /update 또는 /delete 라우트가 없을 수 있습니다.";
        }
        return "No handler or static resource for " + request.getMethod() + " " + request.getRequestURI();
    }

    private String buildNoResourceHint(HttpServletRequest request, AuthLogContext auth, String reasonCode) {
        if (!shouldTraceAccount(auth.email())) {
            return null;
        }
        if ("BOARD_MUTATION_FALLBACK_ROUTE_MISSING".equals(reasonCode)) {
            return "프런트는 WAF 우회를 위해 POST fallback을 시도했지만, 현재 WAS에는 해당 라우트가 없습니다. 최신 campus-was 이미지를 배포했는지 확인하세요.";
        }
        return "요청 경로와 배포된 프런트/백엔드 버전이 서로 맞는지 확인하세요.";
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

    private String buildDiagnosticDetail(
            HttpServletRequest request,
            AuthLogContext auth,
            HttpStatus status,
            String reasonCode,
            String source
    ) {
        if (!shouldTraceAccount(auth.email())) {
            return null;
        }
        String requestId = resolveRequestId(request);
        return "status=" + status.value()
                + " method=" + request.getMethod()
                + " path=" + request.getRequestURI()
                + " source=" + source
                + " requestId=" + requestId
                + " userId=" + auth.userId()
                + " role=" + auth.role()
                + " reasonCode=" + reasonCode;
    }

    private String buildDiagnosticHint(
            HttpServletRequest request,
            HttpStatus status,
            String reasonCode,
            String source,
            boolean securityLayer
    ) {
        AuthLogContext auth = resolveAuthContext();
        if (!shouldTraceAccount(auth.email())) {
            return null;
        }

        String method = request.getMethod();
        String path = request.getRequestURI();
        if (status == HttpStatus.FORBIDDEN && isBoardMutation(method, path)) {
            if ("POST_OWNER_MISMATCH".equals(reasonCode) || "COMMENT_OWNER_MISMATCH".equals(reasonCode)) {
                return "APP 도달 후 작성자 검증에서 차단된 403입니다. WAF 차단이 아니라 작성자/계정 불일치를 확인해야 합니다.";
            }
            if ("ROLE_STUDENT_REQUIRED".equals(reasonCode)) {
                return "APP 도달 후 학생 권한 검증에서 차단된 403입니다. 로그인 계정의 role 또는 토큰 principal을 확인하세요.";
            }
            if (securityLayer) {
                return "APP_SECURITY 계층에서 차단된 403입니다. 컨트롤러 이전 보안 설정 또는 인증 상태를 확인하세요.";
            }
            return "APP 도달 후 인가 실패가 난 403입니다. WAF 차단이 아니라 애플리케이션 권한 로직을 확인해야 합니다.";
        }
        if (status == HttpStatus.UNAUTHORIZED) {
            return "Authorization 헤더, access token 만료 여부, refresh cookie 전송 여부를 확인하세요.";
        }
        if (status == HttpStatus.BAD_REQUEST) {
            return "요청 본문 필드값과 길이 제약을 확인하세요.";
        }
        return null;
    }

    private boolean isBoardMutation(String method, String path) {
        if (method == null || path == null) {
            return false;
        }
        boolean mutationMethod = "PUT".equalsIgnoreCase(method)
                || "DELETE".equalsIgnoreCase(method)
                || "PATCH".equalsIgnoreCase(method);
        return mutationMethod && path.startsWith("/api/board/posts/");
    }

    private boolean isBoardMutationFallbackPath(String method, String path) {
        if (method == null || path == null) {
            return false;
        }
        if (!"POST".equalsIgnoreCase(method) || !path.startsWith("/api/board/posts/")) {
            return false;
        }
        return path.endsWith("/update") || path.endsWith("/delete");
    }

    private boolean isApiPath(String path) {
        return path != null && path.startsWith("/api/");
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
        return TRACE_ACCOUNT_EMAIL.equals(email.toLowerCase(Locale.ROOT));
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
