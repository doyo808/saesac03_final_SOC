package com.campus.platform.controller;

import com.campus.platform.dto.publicapi.CreateSupportRequestRequest;
import com.campus.platform.dto.publicapi.SupportRequestResponse;
import com.campus.platform.service.SupportRequestService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/support-requests")
public class SupportRequestController {

    private final SupportRequestService supportRequestService;

    public SupportRequestController(SupportRequestService supportRequestService) {
        this.supportRequestService = supportRequestService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SupportRequestResponse create(@Valid @RequestBody CreateSupportRequestRequest request) {
        return supportRequestService.create(request);
    }
}
