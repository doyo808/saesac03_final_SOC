package com.campus.platform.dto.lms;

import com.campus.platform.domain.Role;

public record AdminUserResponse(
        Long id,
        String email,
        String name,
        Role role
) {
}
