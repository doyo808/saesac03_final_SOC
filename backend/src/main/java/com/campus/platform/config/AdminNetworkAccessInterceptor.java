package com.campus.platform.config;

import com.campus.platform.exception.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.security.web.util.matcher.IpAddressMatcher;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AdminNetworkAccessInterceptor implements HandlerInterceptor {

    private static final String ACCESS_DENIED_MESSAGE = "관리자 기능은 행정실 서버(허용된 행정망)에서만 접근할 수 있습니다.";
    private final AdminNetworkAccessProperties properties;
    private final List<IpAddressMatcher> allowedMatchers;

    public AdminNetworkAccessInterceptor(AdminNetworkAccessProperties properties) {
        this.properties = properties;
        this.allowedMatchers = createAllowedMatchers(properties);
    }

    @Override
    public boolean preHandle(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull Object handler
    ) {
        if (!properties.isEnabled()) {
            return true;
        }

        String clientIp = resolveClientIp(request);
        boolean allowed = allowedMatchers.stream().anyMatch(matcher -> matcher.matches(clientIp));
        if (!allowed) {
            throw new ApiException(HttpStatus.FORBIDDEN, ACCESS_DENIED_MESSAGE);
        }
        return true;
    }

    private List<IpAddressMatcher> createAllowedMatchers(AdminNetworkAccessProperties properties) {
        if (!properties.isEnabled()) {
            return List.of();
        }

        List<String> ranges = properties.allowedIpRangeList();
        if (ranges.isEmpty()) {
            throw new IllegalStateException(
                    "app.admin.network.enabled=true requires at least one value in app.admin.network.allowed-ip-ranges"
            );
        }

        try {
            return ranges.stream()
                    .map(IpAddressMatcher::new)
                    .toList();
        } catch (IllegalArgumentException ex) {
            throw new IllegalStateException("Invalid admin network CIDR/IP in app.admin.network.allowed-ip-ranges", ex);
        }
    }

    private String resolveClientIp(HttpServletRequest request) {
        if (properties.isUseForwardedFor()) {
            String forwardedFor = request.getHeader(properties.getForwardedForHeader());
            if (StringUtils.hasText(forwardedFor)) {
                for (String value : forwardedFor.split(",")) {
                    String candidate = sanitizeAddress(value);
                    if (StringUtils.hasText(candidate) && !"unknown".equalsIgnoreCase(candidate)) {
                        return candidate;
                    }
                }
            }
        }
        return sanitizeAddress(request.getRemoteAddr());
    }

    private String sanitizeAddress(String raw) {
        if (!StringUtils.hasText(raw)) {
            return "";
        }

        String value = raw.trim();

        if (value.startsWith("[") && value.contains("]")) {
            return value.substring(1, value.indexOf(']'));
        }

        int colonIndex = value.lastIndexOf(':');
        if (colonIndex > -1 && value.indexOf(':') == colonIndex && value.contains(".")) {
            return value.substring(0, colonIndex);
        }

        return value;
    }
}
