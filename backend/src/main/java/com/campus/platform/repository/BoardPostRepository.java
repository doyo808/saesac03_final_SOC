package com.campus.platform.repository;

import com.campus.platform.domain.BoardPost;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardPostRepository extends JpaRepository<BoardPost, Long> {
    List<BoardPost> findAllByOrderByCreatedAtDesc();

    List<BoardPost> findByTitleContainingIgnoreCaseOrContentContainingIgnoreCaseOrderByCreatedAtDesc(
            String titleKeyword,
            String contentKeyword
    );
}
