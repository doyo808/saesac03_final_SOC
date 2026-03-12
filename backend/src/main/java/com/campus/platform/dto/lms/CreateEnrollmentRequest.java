package com.campus.platform.dto.lms;

import jakarta.validation.constraints.NotNull;

public record CreateEnrollmentRequest(
        @NotNull Long courseId,
        @NotNull Long studentId
) {
}
