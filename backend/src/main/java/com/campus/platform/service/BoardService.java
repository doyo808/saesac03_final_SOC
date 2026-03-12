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
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class BoardService {

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

    public List<BoardPostSummaryResponse> getPosts(UserPrincipal principal) {
        getStudentUser(principal);
        return boardPostRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toSummaryResponse)
                .toList();
    }

    public BoardPostDetailResponse getPost(Long postId, UserPrincipal principal) {
        getStudentUser(principal);
        BoardPost post = boardPostRepository.findById(postId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Board post not found"));
        return toDetailResponse(post);
    }

    @Transactional
    public BoardPostDetailResponse createPost(CreateBoardPostRequest request, UserPrincipal principal) {
        User student = getStudentUser(principal);
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
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Board post not found"));

        BoardComment saved = boardCommentRepository.save(new BoardComment(
                post,
                student,
                request.content().trim(),
                LocalDateTime.now()
        ));
        return toCommentResponse(saved);
    }

    private User getStudentUser(UserPrincipal principal) {
        if (principal == null || principal.getRole() != Role.STUDENT) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Student permission is required");
        }

        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
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
