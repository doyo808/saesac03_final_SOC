package com.campus.platform.controller;

import com.campus.platform.dto.publicapi.AcademicEventResponse;
import com.campus.platform.dto.publicapi.AnnouncementDetailResponse;
import com.campus.platform.dto.publicapi.AnnouncementSummaryResponse;
import com.campus.platform.service.PublicService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
public class PublicController {

    private final PublicService publicService;

    public PublicController(PublicService publicService) {
        this.publicService = publicService;
    }

    @GetMapping("/announcements")
    public List<AnnouncementSummaryResponse> announcements() {
        return publicService.getAnnouncements();
    }

    @GetMapping("/announcements/{id}")
    public AnnouncementDetailResponse announcement(@PathVariable Long id) {
        return publicService.getAnnouncement(id);
    }

    @GetMapping("/academic-events")
    public List<AcademicEventResponse> academicEvents() {
        return publicService.getAcademicEvents();
    }
}
