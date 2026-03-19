package com.campus.platform.repository;

import com.campus.platform.domain.BoardPost;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.domain.Specification;

public interface BoardPostRepository extends JpaRepository<BoardPost, Long>, JpaSpecificationExecutor<BoardPost> {

    Optional<BoardPost> findByAuthorIdAndTitle(Long authorId, String title);

    @Override
    @EntityGraph(attributePaths = "author")
    Page<BoardPost> findAll(Specification<BoardPost> spec, Pageable pageable);
}
