# 관제대학교 통합 캠퍼스 플랫폼

React 프론트엔드, Spring Boot 백엔드, PostgreSQL, DMZ 분리 배포 구성을 한 저장소에서 관리하는 모노레포다.  
포털 기능과 LMS 기능을 제공하면서, WAF 튜닝과 보안 실험 자료까지 함께 정리한 제출용 구조로 정돈했다.

## 핵심 요약

- 캠퍼스 포털 + LMS + 학생 게시판 기능 제공
- DMZ WEB / 내부망 WAS / DB 분리 배포 시나리오 지원
- WAF 오탐/미탐 분석용 JMeter 시나리오와 룰 초안 포함
- 보안 실험 이력은 `docs/security/archive/`로 분리해 현재 산출물과 구분

## 저장소 구조

```text
web/
  backend/                  Spring Boot API
  frontend/                 React + Vite SPA
  deploy/                   DMZ/WAS/Admin 배포 compose 및 패키징 Dockerfile
  docs/
    project/                요구사항, 아키텍처, API, 배포 문서
    security/               보안 실험, 룰, JMeter, 데이터셋
  firewall/                 실제 적용용 WAF 커스텀 룰
  scripts/analysis/         보안 로그/결과 분석 스크립트
  docker-compose.yml        로컬 PostgreSQL 실행용
```

## 주요 기능

- Public
  - 공지사항 목록/상세
  - 학사일정 조회
  - 문의 등록
- LMS
  - 내 강의 조회
  - 과제 목록/상세
  - 과제 제출과 채점
- Admin
  - 사용자/강의/수강 등록 관리
  - 학생별 LMS 개인 현황 조회
- Student Board
  - 게시글/댓글 작성, 수정, 삭제
  - 검색 기반 시나리오 테스트
- Security Training
  - 서버발신 egress 테스트
  - WAF/JMeter 기반 정상·경계·공격 트래픽 실험

## 로컬 실행

### 1. DB 실행

```bash
docker compose up -d
```

### 2. 백엔드 실행

사전 조건: Java 17

```bash
cd backend
gradlew.bat bootRun
```

Swagger UI: `http://localhost:8080/swagger-ui/index.html`

### 3. 프론트엔드 실행

Windows:

```bat
cd frontend
copy .env.example .env
npm install
npm run dev
```

macOS / Linux:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

기본 접속 주소: `http://localhost:5173`

## 기본 테스트 계정

비밀번호는 모두 `Password123!` 이다.

- `student1@campus.local` / `STUDENT`
- `prof1@campus.local` / `PROFESSOR`
- `admin1@campus.local` / `ADMIN`
- `student2@campus.local` / `STUDENT`
- `student3@campus.local` / `STUDENT`
- `student4@campus.local` / `STUDENT`
- `student5@campus.local` / `STUDENT`

## 주요 환경변수

백엔드

- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
- `JWT_SECRET`
- `APP_CORS_ALLOWED_ORIGINS`
- `ADMIN_NETWORK_ENABLED`, `ADMIN_ALLOWED_IP_RANGES`
- `SECURITY_EGRESS_TEST_ENABLED`
- `SECURITY_EGRESS_TEST_BASE_URL`
- `SECURITY_EGRESS_TEST_ALLOWED_USER_EMAILS`

프론트엔드

- `VITE_API_BASE_URL`
- `VITE_ADMIN_PAGE_ENABLED`
- `VITE_SECURITY_EGRESS_ALLOWED_EMAILS`

세부 값은 [docs/project/api.md](docs/project/api.md), [backend/src/main/resources/application.yml](backend/src/main/resources/application.yml), [frontend/.env.example](frontend/.env.example)를 기준으로 확인하면 된다.

## 문서 안내

- 프로젝트 기본 문서
  - [요구사항](docs/project/requirements.md)
  - [아키텍처](docs/project/architecture.md)
  - [API 요약](docs/project/api.md)
  - [DMZ/내부망 배포](docs/project/deployment-dmz-was.md)
- 보안 문서 모음
  - [보안 자료 인덱스](docs/security/README.md)
  - [현재 WAF 룰 초안](docs/security/rules/waf_rule.txt)
  - [남은 과탐 조정 요청서](docs/security/change-requests/waf-change-request-remaining-fp-2026-03-28.md)
  - [게시판 경로 한정 허용 요청서](docs/security/change-requests/waf-change-request-board-methods.md)

## 배포 관련 파일

- `deploy/dmz/docker-compose.yml`: DMZ WEB
- `deploy/admin-office/docker-compose.yml`: 내부 관리자 WEB
- `deploy/was/docker-compose.yml`: 내부 WAS
- `deploy/package/Dockerfile`: 배포용 compose 묶음 패키징
- `firewall/waf_custom_rule`: 실제 적용 기준 커스텀 룰 파일

## 제출용 정리 원칙

- 현재 기준으로 바로 봐야 하는 문서는 `docs/project/`, `docs/security/`에 유지
- 중간 실험본, 초안, 비교용 결과물은 `docs/security/archive/`로 분리
- 재생성 가능한 로컬 산출물(`node_modules`, `dist`, `build`, 로그)은 저장소에서 제거

Maintainer: doyo808 (mhg1070@gmail.com)
