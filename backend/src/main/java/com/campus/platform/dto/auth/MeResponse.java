package com.campus.platform.dto.auth;

import com.campus.platform.domain.Role;

public record MeResponse(
        Long id,
        String email,
        String name,
        Role role
) {
}
