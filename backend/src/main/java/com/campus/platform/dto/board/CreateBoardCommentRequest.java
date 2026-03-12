package com.campus.platform.dto.board;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateBoardCommentRequest(
        @NotBlank @Size(max = 4000) String content
) {
}
