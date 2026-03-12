package com.campus.platform.service;

import com.campus.platform.domain.AcademicEvent;
import com.campus.platform.domain.Announcement;
import com.campus.platform.dto.publicapi.AcademicEventResponse;
import com.campus.platform.dto.publicapi.AnnouncementDetailResponse;
import com.campus.platform.dto.publicapi.AnnouncementSummaryResponse;
import com.campus.platform.exception.ApiException;
import com.campus.platform.repository.AcademicEventRepository;
import com.campus.platform.repository.AnnouncementRepository;
import java.util.Comparator;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class PublicService {

    private final AnnouncementRepository announcementRepository;
    private final AcademicEventRepository academicEventRepository;

    public PublicService(AnnouncementRepository announcementRepository, AcademicEventRepository academicEventRepository) {
        this.announcementRepository = announcementRepository;
        this.academicEventRepository = academicEventRepository;
    }

    public List<AnnouncementSummaryResponse> getAnnouncements() {
        return announcementRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(Announcement::getCreatedAt).reversed())
                .map(item -> new AnnouncementSummaryResponse(item.getId(), item.getTitle(), item.getCreatedAt()))
                .toList();
    }

    public AnnouncementDetailResponse getAnnouncement(Long id) {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Announcement not found"));
        return new AnnouncementDetailResponse(
                announcement.getId(),
                announcement.getTitle(),
                announcement.getContent(),
                announcement.getCreatedAt()
        );
    }

    public List<AcademicEventResponse> getAcademicEvents() {
        return academicEventRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(AcademicEvent::getDate))
                .map(event -> new AcademicEventResponse(event.getId(), event.getTitle(), event.getDate()))
                .toList();
    }
}
