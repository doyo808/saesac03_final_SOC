package com.campus.platform.service;

import com.campus.platform.domain.BoardComment;
import com.campus.platform.domain.BoardPost;
import com.campus.platform.domain.Role;
import com.campus.platform.domain.User;
import com.campus.platform.dto.board.BoardCommentResponse;
import com.campus.platform.dto.board.BoardPostDetailResponse;
import com.campus.platform.dto.board.BoardPostSummaryResponse;
import com.campus.platform.dto.board.CreateBoardCommentRequest;
import com.campus.platform.dto.board.CreateBoardPostRequest;
import com.campus.platform.exception.ApiException;
import com.campus.platform.repository.BoardCommentRepository;
import com.campus.platform.repository.BoardPostRepository;
import com.campus.platform.repository.UserRepository;
import com.campus.platform.security.UserPrincipal;
import java.time.LocalDateTime;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@Transactional(readOnly = true)
public class BoardService {

    private static final Logger log = LoggerFactory.getLogger(BoardService.class);
    private final BoardPostRepository boardPostRepository;
    private final BoardCommentRepository boardCommentRepository;
    private final UserRepository userRepository;

    public BoardService(
            BoardPostRepository boardPostRepository,
            BoardCommentRepository boardCommentRepository,
            UserRepository userRepository
    ) {
        this.boardPostRepository = boardPostRepository;
        this.boardCommentRepository = boardCommentRepository;
        this.userRepository = userRepository;
    }

    public List<BoardPostSummaryResponse> getPosts(UserPrincipal principal, String keyword) {
        getStudentUser(principal);

        List<BoardPost> posts;
        if (StringUtils.hasText(keyword)) {
            String trimmed = keyword.trim();
            posts = boardPostRepository.findByTitleContainingIgnoreCaseOrContentContainingIgnoreCaseOrderByCreatedAtDesc(
                    trimmed,
                    trimmed
            );
        } else {
            posts = boardPostRepository.findAllByOrderByCreatedAtDesc();
        }

        return posts
                .stream()
                .map(this::toSummaryResponse)
                .toList();
    }

    public BoardPostDetailResponse getPost(Long postId, UserPrincipal principal) {
        getStudentUser(principal);
        BoardPost post = boardPostRepository.findById(postId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Board post not found", "BOARD_POST_NOT_FOUND"));
        return toDetailResponse(post);
    }

    @Transactional
    public BoardPostDetailResponse createPost(CreateBoardPostRequest request, UserPrincipal principal) {
        User student = getStudentUser(principal);
        traceStudentOperation(student, "BOARD_POST_CREATE", "SUCCESS_CANDIDATE");
        BoardPost saved = boardPostRepository.save(new BoardPost(
                student,
                request.title().trim(),
                request.content().trim(),
                LocalDateTime.now()
        ));
        return toDetailResponse(saved);
    }

    @Transactional
    public BoardCommentResponse createComment(
            Long postId,
            CreateBoardCommentRequest request,
            UserPrincipal principal
    ) {
        User student = getStudentUser(principal);
        BoardPost post = boardPostRepository.findById(postId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Board post not found", "BOARD_POST_NOT_FOUND"));
        traceStudentOperation(student, "BOARD_COMMENT_CREATE", "SUCCESS_CANDIDATE");

        BoardComment saved = boardCommentRepository.save(new BoardComment(
                post,
                student,
                request.content().trim(),
                LocalDateTime.now()
        ));
        return toCommentResponse(saved);
    }

    @Transactional
    public BoardPostDetailResponse updatePost(
            Long postId,
            CreateBoardPostRequest request,
            UserPrincipal principal
    ) {
        User student = getStudentUser(principal);
        BoardPost post = boardPostRepository.findById(postId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Board post not found", "BOARD_POST_NOT_FOUND"));

        assertAuthor(
                post.getAuthor().getId(),
                student.getId(),
                "Only author can update post",
                "POST_OWNER_MISMATCH"
        );
        traceStudentOperation(student, "BOARD_POST_UPDATE", "SUCCESS_CANDIDATE");
        post.setTitle(request.title().trim());
        post.setContent(request.content().trim());
        return toDetailResponse(post);
    }

    @Transactional
    public void deletePost(Long postId, UserPrincipal principal) {
        User student = getStudentUser(principal);
        BoardPost post = boardPostRepository.findById(postId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Board post not found", "BOARD_POST_NOT_FOUND"));

        assertAuthor(
                post.getAuthor().getId(),
                student.getId(),
                "Only author can delete post",
                "POST_OWNER_MISMATCH"
        );
        traceStudentOperation(student, "BOARD_POST_DELETE", "SUCCESS_CANDIDATE");

        boardCommentRepository.deleteByPostId(postId);
        boardPostRepository.delete(post);
    }

    @Transactional
    public BoardCommentResponse updateComment(
            Long postId,
            Long commentId,
            CreateBoardCommentRequest request,
            UserPrincipal principal
    ) {
        User student = getStudentUser(principal);
        BoardComment comment = boardCommentRepository.findByIdAndPostId(commentId, postId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Board comment not found", "BOARD_COMMENT_NOT_FOUND"));

        assertAuthor(
                comment.getAuthor().getId(),
                student.getId(),
                "Only author can update comment",
                "COMMENT_OWNER_MISMATCH"
        );
        traceStudentOperation(student, "BOARD_COMMENT_UPDATE", "SUCCESS_CANDIDATE");
        comment.setContent(request.content().trim());
        return toCommentResponse(comment);
    }

    @Transactional
    public void deleteComment(Long postId, Long commentId, UserPrincipal principal) {
        User student = getStudentUser(principal);
        BoardComment comment = boardCommentRepository.findByIdAndPostId(commentId, postId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Board comment not found", "BOARD_COMMENT_NOT_FOUND"));

        assertAuthor(
                comment.getAuthor().getId(),
                student.getId(),
                "Only author can delete comment",
                "COMMENT_OWNER_MISMATCH"
        );
        traceStudentOperation(student, "BOARD_COMMENT_DELETE", "SUCCESS_CANDIDATE");
        boardCommentRepository.delete(comment);
    }

    private User getStudentUser(UserPrincipal principal) {
        if (principal == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication is required", "AUTH_REQUIRED");
        }
        if (principal.getRole() != Role.STUDENT) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Student permission is required", "ROLE_STUDENT_REQUIRED");
        }

        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found", "USER_NOT_FOUND"));
    }

    private void assertAuthor(Long authorId, Long actorId, String message, String reasonCode) {
        if (!authorId.equals(actorId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, message, reasonCode);
        }
    }

    private void traceStudentOperation(User user, String action, String reasonCode) {
        if (!"student1@campus.local".equalsIgnoreCase(user.getEmail())) {
            return;
        }
        log.info(
                "student-trace userId={} role={} action={} reasonCode={}",
                user.getId(),
                user.getRole().name(),
                action,
                reasonCode
        );
    }

    private BoardPostSummaryResponse toSummaryResponse(BoardPost post) {
        return new BoardPostSummaryResponse(
                post.getId(),
                post.getTitle(),
                buildExcerpt(post.getContent()),
                post.getAuthor().getId(),
                post.getAuthor().getName(),
                post.getCreatedAt()
        );
    }

    private BoardPostDetailResponse toDetailResponse(BoardPost post) {
        List<BoardCommentResponse> comments = boardCommentRepository.findByPostIdOrderByCreatedAtAsc(post.getId())
                .stream()
                .map(this::toCommentResponse)
                .toList();

        return new BoardPostDetailResponse(
                post.getId(),
                post.getTitle(),
                post.getContent(),
                post.getAuthor().getId(),
                post.getAuthor().getName(),
                post.getCreatedAt(),
                comments
        );
    }

    private BoardCommentResponse toCommentResponse(BoardComment comment) {
        return new BoardCommentResponse(
                comment.getId(),
                comment.getAuthor().getId(),
                comment.getAuthor().getName(),
                comment.getContent(),
                comment.getCreatedAt()
        );
    }

    private String buildExcerpt(String content) {
        String normalized = content.replaceAll("\\s+", " ").trim();
        if (normalized.length() <= 120) {
            return normalized;
        }
        return normalized.substring(0, 120) + "...";
    }
}
