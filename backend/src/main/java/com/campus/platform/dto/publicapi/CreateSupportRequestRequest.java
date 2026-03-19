package com.campus.platform.dto.publicapi;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateSupportRequestRequest(
        @NotBlank
        @Size(max = 64)
        String category,
        @NotBlank
        @Size(max = 160)
        String subject,
        @NotBlank
        @Size(max = 4000)
        String message,
        @NotBlank
        @Email
        @Size(max = 160)
        String contactEmail,
        @Size(max = 500)
        String referenceUrl
) {
}
