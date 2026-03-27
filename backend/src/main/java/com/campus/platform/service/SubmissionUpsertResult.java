package com.campus.platform.service;

import com.campus.platform.dto.lms.SubmissionResponse;

public record SubmissionUpsertResult(
        SubmissionResponse submission,
        boolean created
) {
}
