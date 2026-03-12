package com.campus.platform.config;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@ConfigurationProperties(prefix = "app.admin.network")
public class AdminNetworkAccessProperties {

    private boolean enabled = false;
    private String allowedIpRanges = "";
    private boolean useForwardedFor = false;
    private String forwardedForHeader = "X-Forwarded-For";

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getAllowedIpRanges() {
        return allowedIpRanges;
    }

    public void setAllowedIpRanges(String allowedIpRanges) {
        this.allowedIpRanges = allowedIpRanges;
    }

    public boolean isUseForwardedFor() {
        return useForwardedFor;
    }

    public void setUseForwardedFor(boolean useForwardedFor) {
        this.useForwardedFor = useForwardedFor;
    }

    public String getForwardedForHeader() {
        return forwardedForHeader;
    }

    public void setForwardedForHeader(String forwardedForHeader) {
        this.forwardedForHeader = forwardedForHeader;
    }

    public List<String> allowedIpRangeList() {
        if (!StringUtils.hasText(allowedIpRanges)) {
            return List.of();
        }

        return Arrays.stream(allowedIpRanges.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .collect(Collectors.toList());
    }
}
