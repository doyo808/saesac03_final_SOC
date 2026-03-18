package com.campus.platform.controller;

import com.campus.platform.config.RequestIdFilter;
import com.campus.platform.dto.lms.SecurityEgressTestRequest;
import com.campus.platform.dto.lms.SecurityEgressTestResponse;
import com.campus.platform.security.UserPrincipal;
import com.campus.platform.service.AdminSecurityEgressService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/lms/admin/security-egress-tests")
public class AdminSecurityEgressController {

    private final AdminSecurityEgressService adminSecurityEgressService;

    public AdminSecurityEgressController(AdminSecurityEgressService adminSecurityEgressService) {
        this.adminSecurityEgressService = adminSecurityEgressService;
    }

    @PostMapping
    public SecurityEgressTestResponse runTest(
            @Valid @RequestBody SecurityEgressTestRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest httpServletRequest
    ) {
        String requestId = RequestIdFilter.resolveOrCreateRequestId(httpServletRequest);
        httpServletRequest.setAttribute(RequestIdFilter.REQUEST_ID_ATTRIBUTE, requestId);
        return adminSecurityEgressService.runTest(request, principal, requestId);
    }
}
