package com.campus.platform.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SupportRequestControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void createsSupportRequest() throws Exception {
        mockMvc.perform(post("/api/public/support-requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "category": "SECURITY_REPORT",
                                  "subject": "게시판 검색 차단 문의",
                                  "message": "select 문 정리 글을 검색했는데 차단되는지 확인 부탁드립니다.",
                                  "contactEmail": "student11@campus.local",
                                  "referenceUrl": "/student-board?keyword=select"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.category").value("SECURITY_REPORT"))
                .andExpect(jsonPath("$.subject").value("게시판 검색 차단 문의"))
                .andExpect(jsonPath("$.contactEmail").value("student11@campus.local"));
    }

    @Test
    void rejectsInvalidSupportRequest() throws Exception {
        mockMvc.perform(post("/api/public/support-requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "category": "",
                                  "subject": "",
                                  "message": "",
                                  "contactEmail": "not-an-email"
                                }
                                """))
                .andExpect(status().isBadRequest());
    }
}
