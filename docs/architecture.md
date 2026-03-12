# 아키텍처 개요

## 구성

- Frontend: React + TypeScript + Vite + TailwindCSS
- Backend: Spring Boot (Java 17) + Spring Security + JWT + Spring Data JPA
- DB: PostgreSQL (Docker Compose)

## 레이어 구조 (Backend)

- `controller`: HTTP 엔드포인트
- `service`: 비즈니스 로직/권한 체크
- `repository`: JPA 데이터 접근
- `domain`: 엔티티/열거형
- `dto`: 요청/응답 모델
- `security`: JWT 발급/검증, 필터, 인증 예외 처리
- `exception`: 통일된 에러 응답 포맷

## 인증 흐름

1. 사용자가 `/api/auth/login`으로 로그인한다.
2. 백엔드는 Access Token(JSON 응답) + Refresh Token(HttpOnly Cookie)을 발급한다.
3. 프론트는 Access Token을 메모리에 저장하고 API 호출 시 `Authorization` 헤더에 포함한다.
4. Access Token 만료로 401 발생 시 axios interceptor가 `/api/auth/refresh`를 1회 호출해 재시도한다.
5. 로그아웃 시 `/api/auth/logout`으로 Refresh 쿠키를 제거한다.

## 데이터 흐름

- Public 페이지는 `/api/public/**`를 호출해 공지/학사일정을 조회한다.
- LMS 페이지는 `/api/lms/**`를 호출하며 JWT 인증이 필요하다.
- 과제 제출/채점은 `Submission` 엔티티를 중심으로 저장된다.
