package com.campus.platform.dto.lms;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record GradeSubmissionRequest(
        @NotNull @Min(0) @Max(100) Integer score,
        @Size(max = 2000) String feedback
) {
}
