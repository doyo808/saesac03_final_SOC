package com.campus.platform.config;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@ConfigurationProperties(prefix = "app.security.egress-test")
public class SecurityEgressTestProperties {

    private boolean enabled = false;
    private int connectTimeoutMs = 2000;
    private int readTimeoutMs = 3000;
    private String baseUrl = "";
    private String allowedUserEmails = "";

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public int getConnectTimeoutMs() {
        return connectTimeoutMs;
    }

    public void setConnectTimeoutMs(int connectTimeoutMs) {
        this.connectTimeoutMs = connectTimeoutMs;
    }

    public int getReadTimeoutMs() {
        return readTimeoutMs;
    }

    public void setReadTimeoutMs(int readTimeoutMs) {
        this.readTimeoutMs = readTimeoutMs;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getAllowedUserEmails() {
        return allowedUserEmails;
    }

    public void setAllowedUserEmails(String allowedUserEmails) {
        this.allowedUserEmails = allowedUserEmails;
    }

    public List<String> allowedUserEmailList() {
        if (!StringUtils.hasText(allowedUserEmails)) {
            return List.of();
        }

        return Arrays.stream(allowedUserEmails.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .map(String::toLowerCase)
                .collect(Collectors.toList());
    }
}
