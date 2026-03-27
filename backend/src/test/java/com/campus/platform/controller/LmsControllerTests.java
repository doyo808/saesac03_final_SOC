package com.campus.platform.controller;

import com.campus.platform.domain.Assignment;
import com.campus.platform.domain.User;
import com.campus.platform.repository.AssignmentRepository;
import com.campus.platform.repository.CourseRepository;
import com.campus.platform.repository.SubmissionRepository;
import com.campus.platform.repository.UserRepository;
import com.campus.platform.security.UserPrincipal;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class LmsControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private SubmissionRepository submissionRepository;

    private UserPrincipal studentPrincipal;
    private UserPrincipal professorPrincipal;
    private Assignment cs101Assignment;

    @BeforeEach
    void setUp() {
        studentPrincipal = toPrincipal(userRepository.findByEmail("student11@campus.local").orElseThrow());
        professorPrincipal = toPrincipal(userRepository.findByEmail("prof1@campus.local").orElseThrow());
        Long courseId = courseRepository.findByCode("CS101").orElseThrow().getId();
        cs101Assignment = assignmentRepository.findByCourseIdOrderByDueAtAsc(courseId).get(0);
        submissionRepository.findByAssignmentIdAndStudentId(cs101Assignment.getId(), studentPrincipal.getId())
                .ifPresent(submissionRepository::delete);
    }

    @Test
    void resubmittingAssignmentOverwritesContentAndResetsGrade() throws Exception {
        MvcResult initialSubmit = mockMvc.perform(post("/api/lms/assignments/{id}/submissions", cs101Assignment.getId())
                        .with(user(studentPrincipal))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "contentText": "첫 제출 내용입니다."
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.contentText").value("첫 제출 내용입니다."))
                .andExpect(jsonPath("$.score").value(nullValue()))
                .andExpect(jsonPath("$.feedback").value(nullValue()))
                .andReturn();

        JsonNode createdSubmission = objectMapper.readTree(initialSubmit.getResponse().getContentAsString());
        long submissionId = createdSubmission.get("id").asLong();

        mockMvc.perform(post("/api/lms/submissions/{id}/grade", submissionId)
                        .with(user(professorPrincipal))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "score": 95,
                                  "feedback": "첫 채점 결과"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.score").value(95))
                .andExpect(jsonPath("$.feedback").value("첫 채점 결과"));

        MvcResult resubmit = mockMvc.perform(post("/api/lms/assignments/{id}/submissions", cs101Assignment.getId())
                        .with(user(studentPrincipal))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "contentText": "재제출한 최신 답안입니다."
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(submissionId))
                .andExpect(jsonPath("$.contentText").value("재제출한 최신 답안입니다."))
                .andExpect(jsonPath("$.score").value(nullValue()))
                .andExpect(jsonPath("$.feedback").value(nullValue()))
                .andReturn();

        JsonNode updatedSubmission = objectMapper.readTree(resubmit.getResponse().getContentAsString());
        assertThat(updatedSubmission.get("submittedAt").asText())
                .isNotEqualTo(createdSubmission.get("submittedAt").asText());

        mockMvc.perform(get("/api/lms/assignments/{id}", cs101Assignment.getId())
                        .with(user(studentPrincipal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.submissions.length()").value(1))
                .andExpect(jsonPath("$.submissions[0].id").value(submissionId))
                .andExpect(jsonPath("$.submissions[0].contentText").value("재제출한 최신 답안입니다."))
                .andExpect(jsonPath("$.submissions[0].score").value(nullValue()))
                .andExpect(jsonPath("$.submissions[0].feedback").value(nullValue()));

        assertThat(submissionRepository.findByAssignmentIdAndStudentId(cs101Assignment.getId(), studentPrincipal.getId()))
                .isPresent()
                .get()
                .extracting("contentText", "score", "feedback")
                .containsExactly("재제출한 최신 답안입니다.", null, null);
    }

    private UserPrincipal toPrincipal(User user) {
        return new UserPrincipal(
                user.getId(),
                user.getEmail(),
                user.getPasswordHash(),
                user.getName(),
                user.getRole()
        );
    }
}
