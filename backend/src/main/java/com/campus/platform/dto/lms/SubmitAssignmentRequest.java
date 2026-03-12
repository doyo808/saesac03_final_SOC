package com.campus.platform.dto.lms;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SubmitAssignmentRequest(
        @NotBlank @Size(max = 10000) String contentText
) {
}
