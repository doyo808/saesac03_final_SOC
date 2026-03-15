package com.campus.platform.controller;

import com.campus.platform.domain.BoardPost;
import com.campus.platform.domain.User;
import com.campus.platform.repository.BoardPostRepository;
import com.campus.platform.repository.UserRepository;
import com.campus.platform.security.UserPrincipal;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class BoardControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BoardPostRepository boardPostRepository;

    private UserPrincipal studentPrincipal;
    private UserPrincipal student2Principal;
    private UserPrincipal professorPrincipal;

    @BeforeEach
    void setUp() {
        studentPrincipal = toPrincipal(userRepository.findByEmail("student1@campus.local").orElseThrow());
        student2Principal = toPrincipal(userRepository.findByEmail("student2@campus.local").orElseThrow());
        professorPrincipal = toPrincipal(userRepository.findByEmail("prof1@campus.local").orElseThrow());
    }

    @Test
    void listsBoardPostsForStudent() throws Exception {
        mockMvc.perform(get("/api/board/posts").with(user(studentPrincipal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").isNumber())
                .andExpect(jsonPath("$[0].title").isNotEmpty())
                .andExpect(jsonPath("$[0].authorName").isNotEmpty());
    }

    @Test
    void createsBoardPostForStudent() throws Exception {
        long before = boardPostRepository.count();

        mockMvc.perform(post("/api/board/posts")
                        .with(user(studentPrincipal))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "시험기간 열람실 좌석 문의",
                                  "content": "중간고사 기간에 중앙도서관 열람실 좌석 회전이 빠른 시간대가 언제인지 궁금합니다."
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("시험기간 열람실 좌석 문의"))
                .andExpect(jsonPath("$.authorName").value("student1"))
                .andExpect(jsonPath("$.comments").isArray());

        assertThat(boardPostRepository.count()).isEqualTo(before + 1);
    }

    @Test
    void blocksProfessorFromCreatingComment() throws Exception {
        Long postId = boardPostRepository.findAllByOrderByCreatedAtDesc().get(0).getId();

        mockMvc.perform(post("/api/board/posts/{id}/comments", postId)
                        .with(user(professorPrincipal))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "content": "교수 계정으로는 댓글을 달 수 없어야 합니다."
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void updatesBoardPostForAuthor() throws Exception {
        User student = userRepository.findByEmail("student1@campus.local").orElseThrow();
        BoardPost post = boardPostRepository.save(new BoardPost(
                student,
                "수정 전 제목",
                "수정 전 내용",
                LocalDateTime.now()
        ));

        mockMvc.perform(put("/api/board/posts/{id}", post.getId())
                        .with(user(studentPrincipal))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "수정된 제목",
                                  "content": "수정된 내용"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("수정된 제목"))
                .andExpect(jsonPath("$.content").value("수정된 내용"));
    }

    @Test
    void blocksBoardPostUpdateForNonAuthor() throws Exception {
        User student = userRepository.findByEmail("student1@campus.local").orElseThrow();
        BoardPost post = boardPostRepository.save(new BoardPost(
                student,
                "작성자만 수정 가능",
                "원본",
                LocalDateTime.now()
        ));

        mockMvc.perform(put("/api/board/posts/{id}", post.getId())
                        .with(user(student2Principal))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "다른 사람이 수정 시도",
                                  "content": "변경 시도"
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void deletesBoardPostForAuthor() throws Exception {
        User student = userRepository.findByEmail("student1@campus.local").orElseThrow();
        BoardPost post = boardPostRepository.save(new BoardPost(
                student,
                "삭제 대상 제목",
                "삭제 대상 내용",
                LocalDateTime.now()
        ));

        mockMvc.perform(delete("/api/board/posts/{id}", post.getId())
                        .with(user(studentPrincipal)))
                .andExpect(status().isNoContent());

        assertThat(boardPostRepository.findById(post.getId())).isEmpty();
    }

    @Test
    void searchesBoardPostsByKeyword() throws Exception {
        mockMvc.perform(get("/api/board/posts")
                        .param("keyword", "와이파이")
                        .with(user(studentPrincipal)))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("와이파이")));
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
