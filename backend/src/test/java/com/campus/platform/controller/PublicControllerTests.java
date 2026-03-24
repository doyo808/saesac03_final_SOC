package com.campus.platform.controller;

import com.campus.platform.domain.Announcement;
import com.campus.platform.repository.AnnouncementRepository;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class PublicControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AnnouncementRepository announcementRepository;

    @Test
    void listsAnnouncementsWithPagination() throws Exception {
        mockMvc.perform(get("/api/public/announcements"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(10))
                .andExpect(jsonPath("$.items[0].title").isNotEmpty());
    }

    @Test
    void filtersAnnouncementsByKeywordAndSort() throws Exception {
        mockMvc.perform(get("/api/public/announcements")
                        .param("keyword", "select")
                        .param("sort", "title")
                        .param("size", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size").value(5))
                .andExpect(jsonPath("$.totalElements").value(org.hamcrest.Matchers.greaterThan(0)));
    }

    @Test
    void rejectsInvalidAnnouncementDateRange() throws Exception {
        mockMvc.perform(get("/api/public/announcements")
                        .param("dateFrom", "2026-03-10")
                        .param("dateTo", "2026-03-01"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.reasonCode").value("INVALID_DATE_RANGE"));
    }

    @Test
    void returnsNotFoundForTypoPublicApiPaths() throws Exception {
        String[] typoPaths = {
                "/api/public/announcements/",
                "/api/public/announcement",
                "/api/public/Announcements",
                "/api/public/announcements.json",
                "/api/public/academic-events/"
        };

        for (String path : typoPaths) {
            mockMvc.perform(get(path))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.reasonCode").value("API_PATH_NOT_FOUND"));
        }
    }

    @Test
    void treatsAnnouncementSearchWildcardsAsLiteralCharacters() throws Exception {
        announcementRepository.save(new Announcement(
                "literal %_ marker announcement",
                "announcement search should match literal percent underscore token %_",
                LocalDateTime.now()
        ));
        announcementRepository.save(new Announcement(
                "plain announcement",
                "this record should not match a literal percent underscore search",
                LocalDateTime.now().minusMinutes(1)
        ));

        mockMvc.perform(get("/api/public/announcements")
                        .param("keyword", "%_"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].title").value("literal %_ marker announcement"));
    }

    @Test
    void blocksSuspiciousAnnouncementSearchPayloadsBeforeDbLookup() throws Exception {
        mockMvc.perform(get("/api/public/announcements")
                        .param("keyword", "union select password from users--"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.reasonCode").value("SUSPICIOUS_REQUEST_BLOCKED"));
    }
}
