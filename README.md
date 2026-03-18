# Campus Platform (Campus Site + LMS)

React 프론트엔드와 Spring Boot 백엔드를 분리한 모노레포 MVP입니다.

## 저장소 구조

```text
campus-platform/
  README.md
  .gitignore
  docker-compose.yml
  deploy/
    admin-office/docker-compose.yml
    dmz/docker-compose.yml
    was/docker-compose.yml
  docs/
    requirements.md
    architecture.md
    api.md
    deployment-dmz-was.md
  frontend/
  backend/
```

## 기술 스택

- Frontend: React + TypeScript + Vite + React Router + TailwindCSS + axios
- Backend: Spring Boot + Java 17 + Gradle + Spring Data JPA + Spring Security + JWT
- DB: PostgreSQL (Docker Compose)
- API 문서: springdoc-openapi (Swagger UI)

## 로컬 실행 방법

### 1) PostgreSQL 실행

```bash
docker-compose up -d
```

### 2) Backend 실행

사전 조건: Java 17

```bash
cd backend
./gradlew bootRun
```

Windows에서 `JAVA_HOME` 문제가 있으면 Java 17 경로를 지정한 뒤 실행:

```powershell
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
./gradlew.bat bootRun
```

백엔드 기본 URL: `http://localhost:8080`  
Swagger UI: `http://localhost:8080/swagger-ui/index.html`

### 3) Frontend 실행

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

프론트 기본 URL: `http://localhost:5173`
관리자 페이지: `http://localhost:5173/lms/admin` (ADMIN 계정 로그인 필요)

## 기본 테스트 계정

비밀번호는 모두 `Password123!` 입니다.

- `student1@campus.local` (STUDENT)
- `prof1@campus.local` (PROFESSOR)
- `admin1@campus.local` (ADMIN)
- `student2@campus.local` (STUDENT)
- `student3@campus.local` (STUDENT)
- `student4@campus.local` (STUDENT)
- `student5@campus.local` (STUDENT)

## 주요 기능

- Public: 공지사항 목록/상세, 학사일정 목록
- LMS: 내 강의 조회, 과제 목록/상세, 과제 제출, 채점
- LMS Admin: 학생별 개인 LMS 현황(수강/제출/채점) 조회, 수강신청 등록/해제
- Student Board: 게시글/댓글 작성, 검색, 수정, 삭제(작성자 본인만)

## 환경변수

Backend (`application.yml` 기본값 있음):

- `DB_URL` (default: `jdbc:postgresql://localhost:5432/campus`)
- `DB_USERNAME` (default: `campus`)
- `DB_PASSWORD` (default: `campus`)
- `JWT_SECRET` (dev 기본값 제공)
- `JWT_ACCESS_TOKEN_MINUTES` (default: `30`)
- `JWT_REFRESH_TOKEN_DAYS` (default: `7`)
- `JWT_REFRESH_COOKIE_NAME` (default: `refresh_token`)
- `JWT_REFRESH_COOKIE_SECURE` (default: `false`)
- `JWT_REFRESH_COOKIE_SAME_SITE` (default: `Lax`)
- `JWT_REFRESH_COOKIE_DOMAIN` (default: empty)
- `APP_CORS_ALLOWED_ORIGINS` (default: `http://localhost:5173,http://127.0.0.1:5173`)
- `APP_CORS_ALLOWED_ORIGIN_PATTERNS` (default: empty, example: `http://192.168.*:5173`)
- `ADMIN_NETWORK_ENABLED` (default: `false`)
- `ADMIN_ALLOWED_IP_RANGES` (example: `10.10.30.40/32,10.10.30.0/24`)
- `ADMIN_USE_FORWARDED_FOR` (default: `false`)
- `ADMIN_FORWARDED_FOR_HEADER` (default: `X-Forwarded-For`)
- `SECURITY_EGRESS_TEST_ENABLED` (default: `false`)
- `SECURITY_EGRESS_TEST_BASE_URL` (example: `http://192.168.40.100:8081`)
- `SECURITY_EGRESS_TEST_ALLOWED_USER_EMAILS` (example: `admin1@campus.local,security-admin@campus.local`)
- `SECURITY_EGRESS_TEST_CONNECT_TIMEOUT_MS` (default: `2000`)
- `SECURITY_EGRESS_TEST_READ_TIMEOUT_MS` (default: `3000`)

## 보안 훈련용 서버발신

이 기능은 고정된 base URL로만 outbound를 보내고, 관리자는 UI에서 시나리오 `label`, `method`, `path`, `body`를 직접 작성합니다. 관리자는 full target URL을 입력하지 않습니다.

- 인증된 관리자만 실행합니다.
- 서버는 `SECURITY_EGRESS_TEST_BASE_URL` 아래로만 요청을 보냅니다.
- 시나리오 식별은 `label`로 하고, 실제 전송 방식은 `method`와 `path`로 작성합니다.
- `body`는 선택 사항이며, `GET` 또는 `POST` 형태로 테스트할 수 있습니다.
- 응답은 body 저장이 아니라 `requestId`, `statusCode`, `durationMs` 같은 실행 메타데이터만 확인합니다.

예시:

```text
base URL: http://192.168.40.100:8081
label: dmz-canary-webhook
method: POST
path: /webhook/test
body: {"source":"campus-platform","channel":"training-egress"}
```

Frontend:

- `VITE_API_BASE_URL` (default/example: `http://localhost:8080`)
- `VITE_ADMIN_PAGE_ENABLED` (default: `true`)

## 인증/인가 디버깅 포인트

- API 오류 응답에 `requestId`, `reasonCode`, `source` 필드가 포함됩니다.
- API 오류 응답 헤더에 `X-Request-Id`, `X-Error-Source`가 포함됩니다.
- 게시판 수정/삭제 403 점검 시 `reasonCode`로 원인 구분:
  - `POST_OWNER_MISMATCH`, `COMMENT_OWNER_MISMATCH`: 작성자 불일치
  - `ROLE_STUDENT_REQUIRED`: 학생 권한 아님
  - `AUTH_REQUIRED`: 인증 토큰 누락/만료
- 새로고침 로그아웃 점검 시 확인 항목:
  - `POST /api/auth/refresh` 응답 코드
  - refresh cookie 속성(`Secure`, `SameSite`, `Domain`, `Path`, `HttpOnly`)
  - CORS와 `credentials` 설정
  - `OPTIONS` preflight 응답

## DMZ/내부망 배포

DMZ에 WEB, 내부망에 WAS/DB를 분리해서 배포하려면 아래 문서를 참고하세요.

- `docs/deployment-dmz-was.md`
- 게시판 수정/삭제 경로 한정 WAF 룰 변경 요청서: `docs/waf-change-request-board-methods.md`
