package com.campus.platform.service;

import com.campus.platform.domain.AcademicEvent;
import com.campus.platform.domain.Announcement;
import com.campus.platform.dto.publicapi.AcademicEventResponse;
import com.campus.platform.dto.publicapi.AnnouncementDetailResponse;
import com.campus.platform.dto.publicapi.AnnouncementPageResponse;
import com.campus.platform.dto.publicapi.AnnouncementSummaryResponse;
import com.campus.platform.exception.ApiException;
import com.campus.platform.repository.AcademicEventRepository;
import com.campus.platform.repository.AnnouncementRepository;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@Transactional(readOnly = true)
public class PublicService {

    private final AnnouncementRepository announcementRepository;
    private final AcademicEventRepository academicEventRepository;

    public PublicService(AnnouncementRepository announcementRepository, AcademicEventRepository academicEventRepository) {
        this.announcementRepository = announcementRepository;
        this.academicEventRepository = academicEventRepository;
    }

    public AnnouncementPageResponse getAnnouncements(
            String keyword,
            String sort,
            int page,
            int size,
            LocalDate dateFrom,
            LocalDate dateTo
    ) {
        if (dateFrom != null && dateTo != null && dateTo.isBefore(dateFrom)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "종료일은 시작일보다 빠를 수 없습니다.", "INVALID_DATE_RANGE");
        }

        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), 20),
                resolveSort(sort)
        );

        Specification<Announcement> specification = (root, query, criteriaBuilder) -> criteriaBuilder.conjunction();
        if (StringUtils.hasText(keyword)) {
            String normalizedKeyword = "%" + keyword.trim().toLowerCase() + "%";
            specification = specification.and((root, query, criteriaBuilder) -> criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), normalizedKeyword),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("content")), normalizedKeyword)
            ));
        }
        if (dateFrom != null) {
            specification = specification.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), dateFrom.atStartOfDay()));
        }
        if (dateTo != null) {
            specification = specification.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.lessThan(root.get("createdAt"), dateTo.plusDays(1).atStartOfDay()));
        }

        Page<Announcement> announcements = announcementRepository.findAll(specification, pageable);
        List<AnnouncementSummaryResponse> items = announcements.getContent()
                .stream()
                .map(item -> new AnnouncementSummaryResponse(item.getId(), item.getTitle(), item.getCreatedAt()))
                .toList();

        return new AnnouncementPageResponse(
                items,
                announcements.getNumber(),
                announcements.getSize(),
                announcements.getTotalElements(),
                announcements.getTotalPages(),
                announcements.hasPrevious(),
                announcements.hasNext()
        );
    }

    public AnnouncementDetailResponse getAnnouncement(Long id) {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Announcement not found"));
        return new AnnouncementDetailResponse(
                announcement.getId(),
                announcement.getTitle(),
                announcement.getContent(),
                announcement.getCreatedAt()
        );
    }

    public List<AcademicEventResponse> getAcademicEvents() {
        return academicEventRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(AcademicEvent::getDate))
                .map(event -> new AcademicEventResponse(event.getId(), event.getTitle(), event.getDate()))
                .toList();
    }

    private Sort resolveSort(String sort) {
        if ("oldest".equalsIgnoreCase(sort)) {
            return Sort.by(Sort.Order.asc("createdAt"), Sort.Order.asc("id"));
        }
        if ("title".equalsIgnoreCase(sort)) {
            return Sort.by(Sort.Order.asc("title"), Sort.Order.desc("createdAt"));
        }
        return Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"));
    }
}
