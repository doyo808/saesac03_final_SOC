package com.campus.platform.controller;

import com.campus.platform.domain.Role;
import com.campus.platform.security.UserPrincipal;
import com.campus.platform.service.SecurityEgressGateway;
import java.net.URI;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "app.security.egress-test.enabled=true",
        "app.security.egress-test.base-url=http://192.168.40.100:8081",
        "app.security.egress-test.allowed-user-emails=admin1@campus.local"
})
@AutoConfigureMockMvc
class AdminSecurityEgressControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SecurityEgressGateway securityEgressGateway;

    private UserPrincipal adminPrincipal;
    private UserPrincipal otherAdminPrincipal;
    private UserPrincipal studentPrincipal;

    @BeforeEach
    void setUp() {
        adminPrincipal = new UserPrincipal(900L, "admin1@campus.local", "hashed", "admin1", Role.ADMIN);
        otherAdminPrincipal = new UserPrincipal(902L, "admin2@campus.local", "hashed", "admin2", Role.ADMIN);
        studentPrincipal = new UserPrincipal(901L, "student1@campus.local", "hashed", "student1", Role.STUDENT);
    }

    @Test
    void runsConfiguredSecurityEgressScenario() throws Exception {
        when(securityEgressGateway.execute(any(), any(), any()))
                .thenReturn(new SecurityEgressGateway.OutboundResponse(204, 31));

        mockMvc.perform(post("/api/lms/admin/security-egress-tests")
                        .with(user(adminPrincipal))
                        .header("X-Request-Id", "req-123")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "scenario": "soc-egress-drill",
                                  "method": "POST",
                                  "path": "/webhook/test",
                                  "exerciseId": "SOC-EX-001",
                                  "body": "hello-from-test"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requestId").value("req-123"))
                .andExpect(jsonPath("$.scenario").value("soc-egress-drill"))
                .andExpect(jsonPath("$.exerciseId").value("SOC-EX-001"))
                .andExpect(jsonPath("$.method").value("POST"))
                .andExpect(jsonPath("$.targetUrl").value("http://192.168.40.100:8081/webhook/test"))
                .andExpect(jsonPath("$.statusCode").value(204))
                .andExpect(jsonPath("$.durationMs").value(31))
                .andExpect(jsonPath("$.result").value("COMPLETED"));

        ArgumentCaptor<SecurityEgressGateway.OutboundRequest> captor =
                ArgumentCaptor.forClass(SecurityEgressGateway.OutboundRequest.class);
        verify(securityEgressGateway).execute(captor.capture(), any(), any());

        SecurityEgressGateway.OutboundRequest outboundRequest = captor.getValue();
        assertThat(outboundRequest.uri()).isEqualTo(URI.create("http://192.168.40.100:8081/webhook/test"));
        assertThat(outboundRequest.method()).isEqualTo("POST");
        assertThat(outboundRequest.headers())
                .containsEntry("X-Request-Id", "req-123")
                .containsEntry("X-Exercise-Id", "SOC-EX-001")
                .containsEntry("X-Canary-Scenario", "soc-egress-drill");
        assertThat(outboundRequest.body()).isEqualTo("hello-from-test");
    }

    @Test
    void blocksNonAdminFromRunningSecurityEgressScenario() throws Exception {
        mockMvc.perform(post("/api/lms/admin/security-egress-tests")
                        .with(user(studentPrincipal))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "scenario": "soc-egress-drill",
                                  "method": "GET",
                                  "path": "/healthz"
                                }
                                """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", containsString("Admin permission is required")));
    }

    @Test
    void blocksAdminWhoIsNotInAllowedUserList() throws Exception {
        mockMvc.perform(post("/api/lms/admin/security-egress-tests")
                        .with(user(otherAdminPrincipal))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "scenario": "soc-egress-drill",
                                  "method": "GET",
                                  "path": "/healthz"
                                }
                                """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.reasonCode").value("SECURITY_EGRESS_ACCOUNT_RESTRICTED"));
    }
}
