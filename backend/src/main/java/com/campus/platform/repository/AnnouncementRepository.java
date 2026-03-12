package com.campus.platform.repository;

import com.campus.platform.domain.Announcement;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    List<Announcement> findTop5ByOrderByCreatedAtDesc();
}
