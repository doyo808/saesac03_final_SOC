package com.campus.platform.dto.board;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateBoardPostRequest(
        @NotBlank @Size(max = 120) String title,
        @NotBlank @Size(max = 10000) String content
) {
}
