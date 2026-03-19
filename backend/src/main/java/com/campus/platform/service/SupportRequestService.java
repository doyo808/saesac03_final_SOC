package com.campus.platform.service;

import com.campus.platform.domain.SupportRequest;
import com.campus.platform.dto.publicapi.CreateSupportRequestRequest;
import com.campus.platform.dto.publicapi.SupportRequestResponse;
import com.campus.platform.repository.SupportRequestRepository;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class SupportRequestService {

    private final SupportRequestRepository supportRequestRepository;

    public SupportRequestService(SupportRequestRepository supportRequestRepository) {
        this.supportRequestRepository = supportRequestRepository;
    }

    public SupportRequestResponse create(CreateSupportRequestRequest request) {
        SupportRequest saved = supportRequestRepository.save(new SupportRequest(
                request.category().trim(),
                request.subject().trim(),
                request.message().trim(),
                request.contactEmail().trim(),
                request.referenceUrl() == null || request.referenceUrl().isBlank() ? null : request.referenceUrl().trim(),
                LocalDateTime.now()
        ));

        return new SupportRequestResponse(
                saved.getId(),
                saved.getCategory(),
                saved.getSubject(),
                saved.getContactEmail(),
                saved.getReferenceUrl(),
                saved.getSubmittedAt()
        );
    }
}
