package com.campus.platform.repository;

import com.campus.platform.domain.Announcement;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long>, JpaSpecificationExecutor<Announcement> {
    List<Announcement> findTop5ByOrderByCreatedAtDesc();
}
