package com.campus.platform.dto.lms;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SecurityEgressTestRequest(
        @NotBlank @Size(max = 64) String scenario,
        @NotBlank @Size(max = 8) String method,
        @NotBlank @Size(max = 200) String path,
        @Size(max = 64) String exerciseId,
        @Size(max = 4000) String body
) {
}
