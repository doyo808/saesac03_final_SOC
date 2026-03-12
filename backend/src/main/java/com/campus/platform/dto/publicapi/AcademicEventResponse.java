package com.campus.platform.dto.publicapi;

import java.time.LocalDate;

public record AcademicEventResponse(
        Long id,
        String title,
        LocalDate date
) {
}
