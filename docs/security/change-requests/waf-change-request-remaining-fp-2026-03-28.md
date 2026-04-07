# [비교용 초안] 남은 과탐 완화 + 명확한 미탐 보강 룰 생성 요청

요청일: 2026-03-28

## 목적

이번 문서는 `FP_BOARD_SEARCH_URL_EXPANDED_500_V2` 결과 기준으로

1. 아직 남아 있는 의미 있는 과탐을 추가로 줄이고
2. 과탐을 줄이면서도 명확한 미탐은 다시 막기 위한

비교용 룰 초안을 정리한 것이다.

비교 기준 파일:

- [FP_BOARD_SEARCH_URL_EXPANDED_500_V2-results_on.jtl](../jmeter/scenarios/load/500/result/FP_BOARD_SEARCH_URL_EXPANDED_500_V2-results_on.jtl)
- [FP_BOARD_SEARCH_URL_EXPANDED_500_V2-results_on5.jtl](../archive/jmeter/load/500/result/FP_BOARD_SEARCH_URL_EXPANDED_500_V2-results_on5.jtl)
- [jmx-500-interpretation-full.csv](../datasets/jmx-500-interpretation-full.csv)

## 요약

- 기존 `on` 결과에서 남은 주요 과탐은
  - `POST /api/public/support-requests`
  - `POST /api/auth/register`
  - `POST /api/board/posts`
  - 일부 `GET /api/board/posts`, `GET /api/public/announcements`
  이다.
- 추가 룰이 적용된 `on5`에서는 과탐이 더 증가했다.
- `on -> on5` 비교 시 정상/애매 요청의 `403`이 `72 -> 98`로 늘었고, 악화된 `26건`은 전부 검색 계열이다.
- 따라서 새 룰은 `원시 query 문자열 전체 차단`보다 `경로 + 파라미터 + 문맥 단어` 기준의 정밀 허용이 필요하다.

## 요청 사항 1: 게시판 검색 문맥 허용

다음 요청들은 의도상 `200` 또는 앱 검증 결과 `400`이 맞지만, 현재는 `403`으로 차단되고 있다.

- `GET /api/board/posts?keyword=..%2Fadmin%20경로%20설명&sort=title&page=1&size=6`
  - 기존 `on`: `200`
  - 추가 룰 `on5`: `403`
  - 요청 의도: 보안 문자열을 설명하는 문맥성 검색
  - 필요 조치: `GET /api/board/posts`의 `keyword`에서 `../admin`, `../uploads`, `whoami`, `powershell -enc`, `nmap -sS`, `base64`, `jndi:ldap://` 같은 문자열이 `설명`, `예시`, `실습`, `메모`, `정리`, `사례`, `review`, `note`, `lab` 등과 함께 등장할 때는 앱까지 전달되도록 예외 필요

- `GET /api/board/posts?keyword=whoami%20명령%20결과&sort=latest&page=0&size=6`
  - 기존 `on`: `200`
  - 추가 룰 `on5`: `403`
  - 요청 의도: 명령 문자열 설명
  - 필요 조치: 위와 동일

- `GET /api/board/posts?keyword=powershell%20-enc%20예시&sort=latest&page=0&size=6`
  - 기존 `on`: `400`
  - 추가 룰 `on5`: `403`
  - 요청 의도: 앱 레벨 검증까지 도달해야 하는 문맥성 입력
  - 필요 조치: WAF가 무조건 `403`으로 선차단하지 않고 앱 검증으로 넘기도록 조정 필요

## 요청 사항 2: 공개 공지 검색 문맥 허용

- `GET /api/public/announcements?keyword=..%2Fadmin%20경로%20예시&sort=title&page=0&size=5`
  - 기존 `on`: `200`
  - 추가 룰 `on5`: `403`
  - 요청 의도: 공지 검색에서 문맥성 보안 문자열 조회
  - 필요 조치: `GET /api/public/announcements`의 `keyword`에 대해 게시판 검색과 동일한 문맥 허용 예외 필요

- `GET /api/public/announcements?keyword=whoami%20결과%20설명&sort=title&page=0&size=5`
  - 기존 `on`: `200`
  - 추가 룰 `on5`: `403`
  - 요청 의도: 문맥성 검색
  - 필요 조치: 위와 동일

- `GET /api/public/announcements?keyword=powershell%20-enc%20예시&sort=title&page=1&size=5`
  - 기존 `on`: `400`
  - 추가 룰 `on5`: `403`
  - 요청 의도: 앱 검증까지 도달해야 하는 입력
  - 필요 조치: 위와 동일

## 요청 사항 3: 공개 문의 등록 과탐 완화

다음 요청들은 정상 또는 문맥성 정상 문의인데 전부 `403`으로 차단되고 있다.

- `POST /api/public/support-requests`
  - payload:
    - `{"category":"PORTAL","subject":"도서관 좌석 문의 ...","message":"정상 문의입니다. 담당 부서 확인 부탁드립니다.","contactEmail":"portal-normal-01-...@campus.local","referenceUrl":"http://www.kj.ac.kr/support-center"}`
  - 현재 응답: `403`
  - 기대 응답: `201`

- `POST /api/public/support-requests`
  - payload:
    - `{"category":"PORTAL","subject":"select 문이 포함된 강의자료 문의 ...","message":"보안성 자료나 필터 사례를 설명하는 정상 문의입니다.","contactEmail":"portal-amb-11-...@campus.local","referenceUrl":"http://www.kj.ac.kr/security-lab"}`
  - 현재 응답: `403`
  - 기대 응답: `201`

- `POST /api/public/support-requests`
  - payload:
    - `{"category":"PORTAL","subject":"powershell -enc 예시 확인 ...","message":"보안성 자료나 필터 사례를 설명하는 정상 문의입니다.","contactEmail":"portal-amb-16-...@campus.local","referenceUrl":"http://www.kj.ac.kr/security-lab"}`
  - 현재 응답: `403`
  - 기대 응답: `201`

필요 조치:

- `POST /api/public/support-requests`에 한해 JSON 필드 `subject`, `message`, `referenceUrl`의 일반/문맥성 문자열은 앱까지 전달되도록 경로 한정 예외 필요
- 대신 아래 명확한 공격 패턴은 별도 custom deny로 유지 필요
  - backtick command substitution
  - `$()` command substitution
  - `<script`, `<svg onload`, `<img onerror>`
  - `| cat /etc/passwd`, `&& curl`, `;bash`

## 요청 사항 4: 회원가입 이름 필드 과탐 완화

다음 요청들은 회원가입 기능상 정상 입력인데 `403`으로 차단되고 있다.

- `POST /api/auth/register`
  - payload:
    - `{"email":"normal-v2-21-...@campus.local","password":"Password123!","name":"신입생A","role":"STUDENT"}`
  - 현재 응답: `403`
  - 기대 응답: `201`

- `POST /api/auth/register`
  - payload:
    - `{"email":"ambiguous-v2-31-...@campus.local","password":"Password123!","name":"WAF Test Lab","role":"STUDENT"}`
  - 현재 응답: `403`
  - 기대 응답: `201`

- `POST /api/auth/register`
  - payload:
    - `{"email":"ambiguous-v2-33-...@campus.local","password":"Password123!","name":"시큐어코딩반","role":"STUDENT"}`
  - 현재 응답: `403`
  - 기대 응답: `201`

필요 조치:

- `POST /api/auth/register`에서 `name` 필드에 대한 과도한 SQLi/XSS/RCE/LFI 시그니처 적용을 완화
- `email`, `password`, `role` 검증은 유지

## 요청 사항 5: 게시글 작성 과탐 완화

다음 요청들은 인증된 정상 또는 문맥성 게시글 작성인데 `403`으로 차단되고 있다.

- `POST /api/board/posts`
  - payload:
    - `{"title":"도서관 이용 안내 ...","content":"도서관 좌석 배정과 운영 시간 안내를 공유하는 정상 게시글입니다."}`
  - 현재 응답: `403`
  - 기대 응답: `201`

- `POST /api/board/posts`
  - payload:
    - `{"title":"보안 실습 메모 ...","content":"select 문, script 태그, ../admin 경로를 방어 관점에서 정리하는 게시글입니다."}`
  - 현재 응답: `403`
  - 기대 응답: `201`

- `POST /api/board/posts`
  - payload:
    - `{"title":"WAF 과탐 사례 ...","content":"cmd.exe, powershell -enc, union select 같은 문자열을 문맥적으로 설명하는 게시글입니다."}`
  - 현재 응답: `403`
  - 기대 응답: `201`

필요 조치:

- `POST /api/board/posts`에서 `title`, `content` 필드에 대해 문맥 단어가 함께 있는 보안 학습/설명성 문자열은 앱까지 도달하도록 경로 한정 예외 필요
- 단, 인증/인가와 애플리케이션 레벨 권한 검사는 그대로 유지

## 요청 사항 6: 명확한 미탐은 다시 막기

과탐 완화와 별개로 아래 요청은 명확한 공격인데 허용되고 있다.

- `POST /api/board/posts`
  - payload:
    - `{"title":"`id`","content":"백틱 명령 삽입 시도"}`
  - 현재 응답: `201`
  - 기대 응답: `403`

필요 조치:

- 아래 패턴은 write 경로에서 별도 custom deny 필요
  - backtick command substitution: `` `...` ``
  - subshell: `$()`
  - explicit XSS tag: `<script`, `<svg onload`, `<img onerror>`, `javascript:`
  - shell pipe/downloader: `| cat /etc/passwd`, `&& curl`, `;bash`, `;sh`, `;cmd.exe`

## 요청 룰 방향

1. `GET /api/board/posts`, `GET /api/public/announcements`
   - `keyword` 기반 문맥 허용
   - 원시 query 전체 차단 방식 지양
   - `문맥 단어 + 위험 토큰` 동시 등장 시만 예외

2. `POST /api/public/support-requests`
   - `subject`, `message`, `referenceUrl` 한정 예외
   - path scoped only

3. `POST /api/auth/register`
   - `name` 필드 한정 예외
   - `email/password/role` 검사는 유지

4. `POST /api/board/posts`
   - `title`, `content`의 문맥성 학습 문자열 한정 예외
   - 명확한 backtick, `$()`, XSS tag, shell pipe 패턴은 별도 deny

## 첨부 초안

비교용 초안 파일:

- [waf_rule_phase2_remaining_fp.txt](../rules/waf_rule_phase2_remaining_fp.txt)
- [snort_rule_phase2_remaining_fp.rules](../rules/snort_rule_phase2_remaining_fp.rules)

위 초안은 팀 내 비교용이며, 실제 적용 전에는 감사 로그 기준 실제 hit rule id 확인 후 `ruleRemoveById` 값 치환이 필요하다.
