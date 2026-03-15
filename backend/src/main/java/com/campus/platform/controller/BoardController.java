package com.campus.platform.controller;

import com.campus.platform.dto.board.BoardCommentResponse;
import com.campus.platform.dto.board.BoardPostDetailResponse;
import com.campus.platform.dto.board.BoardPostSummaryResponse;
import com.campus.platform.dto.board.CreateBoardCommentRequest;
import com.campus.platform.dto.board.CreateBoardPostRequest;
import com.campus.platform.security.UserPrincipal;
import com.campus.platform.service.BoardService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/board")
public class BoardController {

    private final BoardService boardService;

    public BoardController(BoardService boardService) {
        this.boardService = boardService;
    }

    @GetMapping("/posts")
    public List<BoardPostSummaryResponse> posts(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String keyword
    ) {
        return boardService.getPosts(principal, keyword);
    }

    @GetMapping("/posts/{id}")
    public BoardPostDetailResponse post(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return boardService.getPost(id, principal);
    }

    @PostMapping("/posts")
    @ResponseStatus(HttpStatus.CREATED)
    public BoardPostDetailResponse createPost(
            @Valid @RequestBody CreateBoardPostRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return boardService.createPost(request, principal);
    }

    @PutMapping("/posts/{id}")
    public BoardPostDetailResponse updatePost(
            @PathVariable Long id,
            @Valid @RequestBody CreateBoardPostRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return boardService.updatePost(id, request, principal);
    }

    @DeleteMapping("/posts/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePost(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        boardService.deletePost(id, principal);
    }

    @PostMapping("/posts/{id}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public BoardCommentResponse createComment(
            @PathVariable Long id,
            @Valid @RequestBody CreateBoardCommentRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return boardService.createComment(id, request, principal);
    }

    @PutMapping("/posts/{postId}/comments/{commentId}")
    public BoardCommentResponse updateComment(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @Valid @RequestBody CreateBoardCommentRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return boardService.updateComment(postId, commentId, request, principal);
    }

    @DeleteMapping("/posts/{postId}/comments/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteComment(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        boardService.deleteComment(postId, commentId, principal);
    }
}
