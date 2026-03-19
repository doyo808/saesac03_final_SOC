package com.campus.platform.controller;

import com.campus.platform.dto.publicapi.AcademicEventResponse;
import com.campus.platform.dto.publicapi.AnnouncementDetailResponse;
import com.campus.platform.dto.publicapi.AnnouncementPageResponse;
import com.campus.platform.service.PublicService;
import java.time.LocalDate;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
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
    public AnnouncementPageResponse announcements(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "latest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) LocalDate dateFrom,
            @RequestParam(required = false) LocalDate dateTo
    ) {
        return publicService.getAnnouncements(keyword, sort, page, size, dateFrom, dateTo);
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
