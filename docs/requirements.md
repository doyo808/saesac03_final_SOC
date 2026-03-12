# Campus Platform 요구사항 요약

## 권한

| 역할 | 설명 |
|---|---|
| STUDENT | 수강 강의 조회, 과제 조회/제출 |
| PROFESSOR | 담당 강의 조회, 과제 조회, 제출 채점 |
| ADMIN | LMS 통합 접근 관리(학생 개인 현황/수강신청), 제출 채점 |

## 기능 범위 (MVP)

| 영역 | 기능 | 인증 | 권한 |
|---|---|---|---|
| Public | 공지사항 목록 조회 | 불필요 | 전체 |
| Public | 공지사항 상세 조회 | 불필요 | 전체 |
| Public | 학사일정 목록 조회 | 불필요 | 전체 |
| Auth | 회원가입/로그인/토큰 재발급/로그아웃 | 일부 불필요 | 전체 |
| Auth | 내 정보 조회(`/api/auth/me`) | 필요 | 로그인 사용자 |
| LMS | 내 강의 목록 조회 | 필요 | STUDENT/PROFESSOR/ADMIN |
| LMS | 강의별 과제 목록 조회 | 필요 | 수강생/담당교수/ADMIN |
| LMS | 과제 상세 조회 | 필요 | 수강생/담당교수/ADMIN |
| LMS | 과제 제출 | 필요 | STUDENT |
| LMS | 과제 채점 | 필요 | PROFESSOR/ADMIN |
| LMS Admin | 사용자 목록 조회 | 필요 | ADMIN |
| LMS Admin | 강의 목록 조회 | 필요 | ADMIN |
| LMS Admin | 수강신청 등록/해제 | 필요 | ADMIN |
| LMS Admin | 학생별 LMS 개인 현황 조회 | 필요 | ADMIN |

## 인증 정책

| 항목 | 정책 |
|---|---|
| Access Token | `Authorization: Bearer <token>` |
| Refresh Token | HttpOnly Cookie (`secure`는 로컬에서 `false`) |
| 재발급 | `POST /api/auth/refresh` |
| 로그아웃 | Refresh 쿠키 삭제 |
