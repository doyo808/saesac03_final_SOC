# [긴급] 게시판 수정/삭제 403 이슈 대응용 WAF 경로 한정 허용 요청

요청일: 2026-03-16

## 배경

학생 게시판 정상 기능 사용 중 `PUT`, `DELETE`가 403으로 차단되는 케이스가 확인되어,  
전역 메서드 허용이 아닌 **게시판 경로 한정 예외**를 요청한다.

## 요청 범위 (메서드 + 경로)

1. `PUT /api/board/posts/{id}`
2. `DELETE /api/board/posts/{id}`
3. `PUT /api/board/posts/{postId}/comments/{commentId}`
4. `DELETE /api/board/posts/{postId}/comments/{commentId}`
5. `OPTIONS /api/board/posts/*` (preflight)

정규식 예시:

- `^/api/board/posts/[0-9]+$`
- `^/api/board/posts/[0-9]+/comments/[0-9]+$`

## 보안 가드레일

1. 전역 `PUT/DELETE` 허용 금지
2. 상기 게시판 경로에만 예외 적용
3. 애플리케이션 인증/인가(`Authorization: Bearer`)는 그대로 유지
4. 로깅은 유지하고 차단만 완화

## 검증 기준

1. 작성자 본인 수정/삭제: `200/204`
2. 비인증 요청: `401` 유지
3. 비작성자 수정/삭제: `403` 유지
4. 허용 목록 외 경로 `PUT/DELETE`: 기존 정책 유지
