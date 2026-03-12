package com.campus.platform.repository;

import com.campus.platform.domain.BoardComment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardCommentRepository extends JpaRepository<BoardComment, Long> {
    List<BoardComment> findByPostIdOrderByCreatedAtAsc(Long postId);
}
