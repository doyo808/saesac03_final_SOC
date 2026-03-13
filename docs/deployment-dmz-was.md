# DMZ WEB + Internal WAS/DB Deployment Runbook

이 문서는 Ubuntu 기반 3계층 서버(DB/WAS/WEB)에서 Docker Compose로
안전하게 업데이트하는 표준 절차를 설명합니다.

## 1) 서버 역할과 디렉터리

- `deploy/db`: DB 서버(PostgreSQL)
- `deploy/was`: WAS 서버(Spring Boot API)
- `deploy/dmz`: DMZ WEB 서버(공개 포털)
- `deploy/admin-office`: 내부 행정망 WEB 서버(관리자 포털)
- `deploy/common`: 공통 업데이트 스크립트

## 2) 핵심 운영 원칙

1. `latest` 대신 버전 태그 이미지 사용
2. 서버에서는 빌드하지 않고 `pull + up -d`만 실행
3. 업데이트 순서 고정:
   `DB 백업 -> WAS -> DMZ WEB -> ADMIN WEB`
4. 롤백은 이전 이미지 태그로 즉시 복구

## 3) 사전 준비

각 서버에서 배포 폴더를 위치시키고 `.env`를 준비합니다.

```bash
cp .env.example .env
chmod +x update.sh
```

DB 서버는 백업 스크립트도 실행 권한을 줍니다.

```bash
chmod +x backup.sh
```

## 4) 이미지 태그 정책

예시 릴리즈 태그:

- `2026.03.13-5226ecd`

각 `.env`의 `*_IMAGE` 값을 같은 릴리즈 태그로 맞춰주세요.
예:

- DMZ: `WEB_DMZ_IMAGE=ghcr.io/doyo808/campus-web:2026.03.13-5226ecd`
- Admin: `WEB_ADMIN_IMAGE=ghcr.io/doyo808/campus-web-admin:2026.03.13-5226ecd`
- WAS: `WAS_IMAGE=ghcr.io/doyo808/campus-was:2026.03.13-5226ecd`

## 5) 표준 업데이트 절차

### 5-1) DB 서버

스키마 영향이 있거나 위험도가 있는 배포 전에는 반드시 백업:

```bash
cd deploy/db
./backup.sh
```

DB 컨테이너 자체 업데이트가 필요한 경우:

```bash
cd deploy/db
./update.sh
```

### 5-2) WAS 서버

```bash
cd deploy/was
./update.sh
```

`HEALTHCHECK_URL`이 설정되어 있으면 스크립트가 자동 확인합니다.

### 5-3) DMZ WEB 서버

```bash
cd deploy/dmz
./update.sh
```

### 5-4) ADMIN WEB 서버

```bash
cd deploy/admin-office
./update.sh
```

## 6) 롤백

1. 각 서버 `.env`에서 이미지 태그를 이전 버전으로 변경
2. 해당 서버에서 `./update.sh` 재실행

이 방식으로 서비스별 개별 롤백이 가능합니다.

## 7) Registry 접근이 어려운 망 분리 환경

Registry 직접 pull이 어려우면 아래 순서로 운영합니다.

1. 빌드 서버에서 `docker save`로 이미지 tar 생성
2. 대상 서버로 전송
3. 대상 서버에서 `docker load`
4. 기존과 동일하게 `./update.sh` 실행

## 8) 보안 체크리스트

- DMZ에는 WEB 80/443만 외부 노출
- WAS/DB는 내부망에서만 접근
- `JWT_SECRET`, DB 비밀번호는 `.env`에서 강한 값 사용
- `ADMIN_ALLOWED_IP_RANGES`는 최소 CIDR만 허용
