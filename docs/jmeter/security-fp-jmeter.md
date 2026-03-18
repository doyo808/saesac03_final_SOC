# 중간발표용 과탐 유발 시나리오 (JMeter 구현판)

## 1. 추진 목적

이번 테스트는 침해 성공 재현이 아니라, 탐지 이벤트가 많이 발생해도 일부는 정상 행위와 구분이 애매한 과탐일 수 있음을 시연하는 데 목적이 있다.

핵심 메시지:

1. 탐지는 충분히 발생한다.
2. 일부는 실제 공격보다 운영/입력 특성에 의한 과탐일 수 있다.
3. 관제 품질 향상을 위해 룰 정제와 예외 정책이 필요하다.

## 2. 최종 선정 시나리오

### 시나리오 1. 수상한 검색/조회 파라미터 입력

정상 조회 API에 시그니처 기반 룰이 민감하게 반응하는 문자열을 포함해 요청한다.

- 대상 API: `/api/public/announcements`, `/api/public/academic-events`
- 특징: SQL/XSS/경로 문자열처럼 보이지만 실제로는 조회 요청
- 기대 효과: ModSecurity CRS의 generic signature 탐지 다량 발생

### 시나리오 2. 관리자/백업/점검 경로 탐색

일반 사용자가 접근하지 않는 경로를 순차 요청해 정찰/이상 접근 형태 로그를 유도한다.

- 대상 경로: `/admin`, `/.env`, `/backup.zip`, `/actuator/health`, `/api/lms/admin/users`
- 특징: 단순 GET 요청이지만 관제에서는 이상행위로 분류 가능
- 기대 효과: WAF/방화벽/서버 로그에서 401/403/404 기반 이벤트 증가

## 3. JMeter 구현 절차

### 3-1. 테스트 플랜 구조

하나의 Test Plan에 Thread Group 2개를 둔다.

1. `TG-Scenario1-ParamNoise`
2. `TG-Scenario2-PathProbe`

공통 컴포넌트:

- `HTTP Request Defaults`
  - Protocol: `http` 또는 `https`
  - Server Name: 대상 WEB/WAF 도메인
  - Port: 환경에 맞게 설정
- `HTTP Header Manager`
  - `X-SOC-Test: fp-lab`
  - `User-Agent: ${ua}`
- `HTTP Cookie Manager` (세션형 트래픽 유사화)
- `Uniform Random Timer`
  - Random Delay Maximum: `1200`
  - Constant Delay Offset: `300`

### 3-2. Thread Group 권장값

1. `TG-Scenario1-ParamNoise`
   - Number of Threads: `30`
   - Ramp-up: `60`
   - Loop Count: `20`
   - CSV: `docs/jmeter/scenario1-params.csv`

2. `TG-Scenario2-PathProbe`
   - Number of Threads: `15`
   - Ramp-up: `45`
   - Loop Count: `20`
   - CSV: `docs/jmeter/scenario2-paths.csv`

### 3-3. CSV 연결 방식

각 Thread Group 아래에 `CSV Data Set Config`를 추가하고 아래처럼 설정한다.

- Filename:
  - Scenario1: `docs/jmeter/scenario1-params.csv`
  - Scenario2: `docs/jmeter/scenario2-paths.csv`
- Variable Names: `method,url_path,ua`
- Ignore first line: `True`
- Recycle on EOF: `True`
- Stop thread on EOF: `False`

`HTTP Request` 샘플러는 아래 변수로 설정한다.

- Method: `${method}`
- Path: `${url_path}`

### 3-4. 실행 단계

1. 1차 저부하 검증: 각 시나리오 5분 실행
2. 2차 본실행: 15~30분 실행
3. 실행 중 확인 포인트:
   - 응답코드 분포(200/401/403/404)
   - WAF 탐지 로그 증가 여부
   - 서비스 장애(실패율 급증) 여부

비GUI 실행 예시:

```bash
jmeter -n -t fp-demo.jmx -l fp-demo-result.jtl
```

## 4. WAF(ModSecurity) 설정 체크리스트

발표 목적상 차단보다 탐지량 확보가 중요하므로, 테스트 시간에는 아래 설정을 권장한다.

1. `SecRuleEngine DetectionOnly`
2. CRS 활성화
3. `tx.paranoia_level=3` (과탐 시연 목적)
4. anomaly threshold 완화
   - `inbound=3`
   - `outbound=2`
5. `SecAuditEngine On`
6. `SecAuditLogFormat JSON`
7. `SecAuditLogParts ABIJDEFHZ`
8. 테스트 식별용 룰 1개 추가 (`X-SOC-Test` 태그)

예시:

```apache
SecRule REQUEST_HEADERS:X-SOC-Test "@streq fp-lab" \
"id:990130,phase:1,pass,log,t:none,msg:'SOC_FP_LAB_TRAFFIC',tag:'soc-lab',tag:'fp-demo',severity:'NOTICE'"
```

## 5. 발표 시 결과 정리 지표

1. 총 탐지 이벤트 수
2. 상위 룰 ID/시그니처 분포
3. 상태코드 분포 (정상/인증실패/미존재 경로)
4. 과탐 후보 비율 (정상 기능 요청 대비 탐지 발생률)
5. 튜닝 전후 비교(예외 정책 적용 전/후)

## 6. 결론 문구(발표용)

"탐지량 증가만으로 보안 성숙도를 판단할 수 없으며, 운영 맥락을 반영한 룰 정제와 예외 정책이 함께 필요하다."
