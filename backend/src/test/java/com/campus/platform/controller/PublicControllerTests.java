package com.campus.platform.controller;

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
}
