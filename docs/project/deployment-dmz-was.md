# DMZ WEB + Internal WAS/DB Deployment

This repository supports segmented deployment:

- `WEB (DMZ)`: public portal + LMS + security egress page (admin page disabled at build time)
- `WEB (Admin Office)`: internal admin portal (admin page enabled)
- `WAS (Internal)`: Spring Boot API + JWT
- `DB (Internal)`: PostgreSQL only

## 1) Build Images

### 1-1) DMZ WEB image (admin page OFF)

Build from `frontend/`:

```bash
docker build -t campus-web:latest \
  --build-arg VITE_ADMIN_PAGE_ENABLED=false \
  --build-arg VITE_SECURITY_EGRESS_ALLOWED_EMAILS=admin1@campus.local,student1@campus.local \
  --build-arg VITE_API_BASE_URL=/ .
```

### 1-2) Admin Office WEB image (admin page ON)

Build from `frontend/`:

```bash
docker build -t campus-web-admin:latest \
  --build-arg VITE_ADMIN_PAGE_ENABLED=true \
  --build-arg VITE_SECURITY_EGRESS_ALLOWED_EMAILS=admin1@campus.local,student1@campus.local \
  --build-arg VITE_API_BASE_URL=/ .
```

### 1-3) WAS image

Build from `backend/`:

```bash
docker build -t campus-was:latest .
```

## 2) Run WAS in Internal Network

`ADMIN_NETWORK_*` variables enforce admin API access source by IP/CIDR.

```bash
docker run -d --name campus-was \
  -p 8080:8080 \
  -e DB_URL=jdbc:postgresql://<DB_PRIVATE_IP>:5432/campus \
  -e DB_USERNAME=campus \
  -e DB_PASSWORD=campus \
  -e JWT_SECRET=<STRONG_SECRET> \
  -e JWT_REFRESH_COOKIE_SECURE=true \
  -e ADMIN_NETWORK_ENABLED=true \
  -e ADMIN_ALLOWED_IP_RANGES=<ADMIN_WEB_SERVER_IP>/32 \
  campus-was:latest
```

Optional proxy mode:

- `ADMIN_USE_FORWARDED_FOR=true`
- `ADMIN_FORWARDED_FOR_HEADER=X-Forwarded-For`

Use this only when you fully trust upstream reverse proxies.

## 3) Run WEB in DMZ

`WAS_UPSTREAM` must point to the internal WAS URL reachable from DMZ.

```bash
docker run -d --name campus-web \
  -p 80:80 \
  -e WAS_UPSTREAM=http://<WAS_PRIVATE_IP>:8080 \
  campus-web:latest
```

## 4) Run WEB in Admin Office Network

Deploy admin portal on admin office server:

```bash
docker run -d --name campus-admin-web \
  -p 8081:80 \
  -e WAS_UPSTREAM=http://<WAS_PRIVATE_IP>:8080 \
  campus-web-admin:latest
```

## 5) Optional Compose Files

- DMZ WEB compose: `deploy/dmz/docker-compose.yml`
- Admin Office WEB compose: `deploy/admin-office/docker-compose.yml`
- Internal WAS compose: `deploy/was/docker-compose.yml`

Update placeholder IP/secret values before use.

## 6) WEB Nginx Behavior

- `/` and client routes: served as SPA (`index.html` fallback)
- `/api/*`: proxied to `WAS_UPSTREAM`
- `/healthz`: returns `200 ok`

## 7) Admin Access Rule Summary

- Frontend: DMZ build removes `/lms/admin` route and admin links, but `/lms/security-egress` 는 화이트리스트 계정에 대해 유지됩니다.
- Backend: `/api/lms/admin/**` is allowed only when request source IP matches `ADMIN_ALLOWED_IP_RANGES`.
- Result: even if someone obtains an ADMIN account outside admin network, admin API access is blocked. 보안 훈련용 egress API는 `/api/lms/security-egress-tests` 로 분리되어 일반 WEB에서도 사용할 수 있습니다.

## 8) Network/Security Checklist

- Expose only DMZ WEB `80/443` publicly
- Do not expose internal admin WEB and WAS publicly
- Do not expose DB `5432` publicly
- Allow only specific hops in firewall:
  - DMZ WEB -> WAS
  - Admin WEB -> WAS
  - WAS -> DB
- Use HTTPS at DMZ and admin network entry points
