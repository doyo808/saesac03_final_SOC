package com.campus.platform.config;

import com.campus.platform.exception.ApiException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AdminNetworkAccessInterceptorTests {

    @Test
    void allowsWhenRestrictionIsDisabled() throws Exception {
        AdminNetworkAccessInterceptor interceptor = createInterceptor(false, "", false);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/lms/admin/users");
        request.setRemoteAddr("203.0.113.7");

        boolean allowed = interceptor.preHandle(request, new MockHttpServletResponse(), new Object());

        assertThat(allowed).isTrue();
    }

    @Test
    void allowsWhenRemoteAddressMatchesAllowList() throws Exception {
        AdminNetworkAccessInterceptor interceptor = createInterceptor(true, "10.10.30.40/32,127.0.0.1/32", false);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/lms/admin/users");
        request.setRemoteAddr("10.10.30.40");

        boolean allowed = interceptor.preHandle(request, new MockHttpServletResponse(), new Object());

        assertThat(allowed).isTrue();
    }

    @Test
    void deniesWhenRemoteAddressDoesNotMatchAllowList() {
        AdminNetworkAccessInterceptor interceptor = createInterceptor(true, "10.10.30.40/32", false);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/lms/admin/users");
        request.setRemoteAddr("10.10.30.99");

        assertThatThrownBy(() -> interceptor.preHandle(request, new MockHttpServletResponse(), new Object()))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("행정실 서버");
    }

    @Test
    void allowsUsingForwardedForHeaderWhenEnabled() throws Exception {
        AdminNetworkAccessInterceptor interceptor = createInterceptor(true, "10.10.30.40/32", true);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/lms/admin/users");
        request.setRemoteAddr("10.10.20.10");
        request.addHeader("X-Forwarded-For", "10.10.30.40, 10.10.20.10");

        boolean allowed = interceptor.preHandle(request, new MockHttpServletResponse(), new Object());

        assertThat(allowed).isTrue();
    }

    private AdminNetworkAccessInterceptor createInterceptor(boolean enabled, String allowed, boolean useForwardedFor) {
        AdminNetworkAccessProperties properties = new AdminNetworkAccessProperties();
        properties.setEnabled(enabled);
        properties.setAllowedIpRanges(allowed);
        properties.setUseForwardedFor(useForwardedFor);
        return new AdminNetworkAccessInterceptor(properties);
    }
}
