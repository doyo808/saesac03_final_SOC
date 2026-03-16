# API 요약

기본 URL: `http://localhost:8080`

## Health

| Method | Path | 설명 |
|---|---|---|
| GET | `/api/health` | 서버 헬스체크 (`OK`) |

## Auth

| Method | Path | 설명 |
|---|---|---|
| POST | `/api/auth/register` | 회원가입 |
| POST | `/api/auth/login` | 로그인 (Access 반환 + Refresh 쿠키 설정) |
| POST | `/api/auth/refresh` | Access 재발급 (Refresh 쿠키 필요) |
| POST | `/api/auth/logout` | 로그아웃 (Refresh 쿠키 삭제) |
| GET | `/api/auth/me` | 내 정보 조회 |

## Public

| Method | Path | 설명 |
|---|---|---|
| GET | `/api/public/announcements` | 공지사항 목록 |
| GET | `/api/public/announcements/{id}` | 공지사항 상세 |
| GET | `/api/public/academic-events` | 학사일정 목록 |

## LMS (인증 필요)

| Method | Path | 설명 |
|---|---|---|
| GET | `/api/lms/courses/my` | 내 강의 목록 |
| GET | `/api/lms/courses/{courseId}/assignments` | 강의별 과제 목록 |
| GET | `/api/lms/assignments/{id}` | 과제 상세 + 제출 목록(권한에 따라 제한) |
| POST | `/api/lms/assignments/{id}/submissions` | 과제 제출 (STUDENT) |
| POST | `/api/lms/submissions/{id}/grade` | 과제 채점 (PROFESSOR/ADMIN) |

## LMS Admin (ADMIN 전용)

| Method | Path | 설명 |
|---|---|---|
| GET | `/api/lms/admin/users` | 전체 사용자 조회 |
| GET | `/api/lms/admin/courses` | 전체 강의 조회 |
| GET | `/api/lms/admin/enrollments` | 전체 수강신청 조회 |
| POST | `/api/lms/admin/enrollments` | 수강신청 등록 |
| DELETE | `/api/lms/admin/enrollments/{id}` | 수강신청 해제 |
| GET | `/api/lms/admin/students/overviews` | 학생별 LMS 개인 현황(수강/제출/채점) |

## Student Board (STUDENT 전용)

| Method | Path | 설명 |
|---|---|---|
| GET | `/api/board/posts` | 게시글 목록 조회 (`keyword` 쿼리로 제목/내용 검색) |
| GET | `/api/board/posts/{id}` | 게시글 상세 조회 |
| POST | `/api/board/posts` | 게시글 작성 |
| PUT | `/api/board/posts/{id}` | 게시글 수정 (작성자 본인만) |
| DELETE | `/api/board/posts/{id}` | 게시글 삭제 (작성자 본인만) |
| POST | `/api/board/posts/{id}/comments` | 댓글 작성 |
| PUT | `/api/board/posts/{postId}/comments/{commentId}` | 댓글 수정 (작성자 본인만) |
| DELETE | `/api/board/posts/{postId}/comments/{commentId}` | 댓글 삭제 (작성자 본인만) |

## 에러 응답 포맷

```json
{
  "timestamp": "2026-02-27T10:00:00",
  "path": "/api/lms/courses/my",
  "error": "UNAUTHORIZED",
  "message": "Authentication is required",
  "requestId": "34cf5270-22b2-4c01-bca9-18f98254f8f0",
  "reasonCode": "AUTH_REQUIRED",
  "source": "APP"
}
```
