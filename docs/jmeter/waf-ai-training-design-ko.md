# WAF 과탐 세션 데이터셋 설계

## 1. 목표

목표는 WAF의 과탐 또는 과도한 탐지를 유발하는 JMeter 트래픽을 만들고, 그 결과를 이용해 로컬 AI 모델이 아래 3가지 세션 단위 클래스를 구분하도록 학습시키는 것이다.

- 정상 사용자 행위
- 애매한 행위
- 공격 의도가 있는 행위

분류는 이진 분류보다는 의도가 점진적으로 높아지는 그라데이션 형태를 목표로 한다.

초기 시나리오 템플릿 수는 다음과 같다.

- 정상: 60
- 애매: 30
- 공격: 10

이 문서는 2차 파싱 파이프라인이 아직 없는 상태에서 현재 raw WAF CSV를 어떻게 다뤄야 하는지도 함께 정리한다.

## 2. 결론 먼저

맞다. 현재 raw CSV는 학습 전에 한 번 더 정제해서 넘기는 것이 맞다.

이유:

- 업무 트래픽, 프론트 정적 자산 트래픽, WAF 탐지 레코드가 섞여 있다
- 같은 요청 정보가 중복 컬럼으로 반복된다
- 환경성 노이즈가 강하다
- 토큰, 컨테이너 메타데이터, 반복되는 호스트 메타데이터처럼 학습에 불필요하거나 오히려 해가 되는 값이 포함돼 있다

다만 아직 2차 파서가 준비되지 않았다면, 작은 Python 스크립트로 임시 추출을 해서 축약된 세션 데이터셋으로 먼저 학습하는 접근은 충분히 합리적이다.

권장 임시 방향:

1. raw CSV는 원본 그대로 보존한다
2. 중요한 필드만 뽑아 더 작은 중간 CSV 또는 JSONL을 만든다
3. 그 행들을 세션 단위 샘플로 집계한다
4. 수동 또는 반자동 라벨을 붙인다
5. 이 축약 데이터셋으로 먼저 학습과 검증을 진행한다

## 3. 현재 CSV에서 확인된 사항

대상 파일:

- [waf_log_260320.csv](C:/workspace/codex/saesac03_final/web/jmx/waf_log_260320.csv)

현재 샘플에서 보인 특징:

- `920350` 룰이 반복적으로 많이 등장한다
- `Host header is a numeric IP address` 메시지가 많은 행을 지배한다
- `/api/auth/me` 가 자주 등장한다
- `DetectionOnly` 와 `Enabled` 로그가 섞여 있다
- 업무 API 행과 비업무 행이 섞여 있다
- 일부 행은 순수 WAF 탐지 로그보다 access log 성격에 더 가깝다

의미:

- 이 raw CSV를 그대로 학습에 넣으면, 모델이 사용자 의도보다 숫자 IP Host 사용 같은 환경 아티팩트를 먼저 학습할 수 있다
- 특히 세션 분류에서는 특정 노이즈 룰 하나가 세션 전체 라벨을 왜곡할 위험이 크다

## 4. 현재 CSV의 즉시 처리 방향

### 4-1. raw CSV를 그대로 학습에 쓰지 않는다

현재 export된 raw CSV를 그대로 모델 입력으로 쓰는 것은 피하는 것이 좋다.

문제점:

- 중복 컬럼이 너무 많다
- 컨테이너 및 에이전트 메타데이터는 의도 학습에 거의 쓸모가 없다
- `Authorization`, `request_id`, `unique_id`, raw response body, host 메타데이터는 누수나 노이즈가 되기 쉽다
- 같은 요청이 access 성격의 로그와 WAF 탐지 성격의 로그로 중복 표현될 수 있다

### 4-2. 지금은 임시 Python 추출 단계를 둔다

정식 2차 파서가 준비되기 전까지는, 작은 Python 스크립트로 임시 정제 데이터를 만드는 것이 적절하다.

권장 산출물:

- `parsed_request_rows.csv`
- `session_dataset.jsonl`

임시 스크립트는 최소 기능만 하면 된다.

1. 중요한 컬럼만 선택한다
2. 중복 필드를 정규화한다
3. 명백한 노이즈를 제거한다
4. 임시 세션 키를 만든다
5. 세션 요약 단위로 집계한다

## 5. 임시 추출에서 남길 필드

현재 CSV에서 요청 단위로 우선 남길 것을 권장하는 필드:

- `@timestamp`
- `http.request.method`
- `http.response.status_code`
- `url.path`
- `url.original`
- `waf_json.query_string`
- `waf_json.transaction.request.body`
- `user_agent.original`
- `source.ip`
- `waf_json.transaction.unique_id`
- `rule.id`
- `rule.name`
- `waf_json.transaction.messages.details.ruleId`
- `waf_json.transaction.messages.message`
- `waf_json.transaction.messages.details.severity`
- `waf_json.transaction.producer.secrules_engine`
- `event.action`
- `event.outcome`

정규화 규칙:

- `rule.id` 와 `waf_json.transaction.messages.details.ruleId` 가 둘 다 있으면 `normalized_rule_id` 같은 하나의 필드로 통합한다
- `url.path` 와 `waf_json.request_uri` 가 둘 다 있으면 `normalized_path` 같은 하나의 필드로 통합한다
- status 관련 필드가 여러 개면 `normalized_status` 같은 하나의 필드로 통합한다

## 6. 임시 추출에서 버릴 필드

기본적으로 제거 권장:

- elastic agent 메타데이터
- 컨테이너 메타데이터
- docker label
- host MAC 및 host IP 목록
- 의도 분류에 필요 없는 반복 헤더
- raw response body
- `Authorization` 헤더
- refresh/access token
- join에 꼭 필요하지 않은 request ID 및 correlation ID
- `/assets/...` 같은 정적 자산 행
- 실제 업무 API가 아닌 `/lms/...` 같은 프론트 라우트 행

중요:

- 현재 환경에서 숫자 IP Host 사용이 불가피하다면, 초기 학습셋에서는 `920350` 을 제외하거나 환경 노이즈로 별도 마킹하는 것이 좋다

## 7. 임시 세션 데이터셋 형태

목표가 세션 단위 분류이므로, 최종 임시 학습 입력도 행 단위가 아니라 세션 단위여야 한다.

권장 세션 JSONL 구조:

```json
{
  "session_id": "tmp-0001",
  "intent_class": "ambiguous",
  "intent_score": 4,
  "client_ip": "192.168.40.100",
  "user_agent_group": "edge-desktop",
  "request_count": 12,
  "requests": [
    {
      "step": 1,
      "method": "POST",
      "path": "/api/auth/login",
      "status": 200,
      "rule_ids": [],
      "waf_message_count": 0
    },
    {
      "step": 2,
      "method": "GET",
      "path": "/api/board/posts",
      "status": 200,
      "query_text": "select course summary",
      "rule_ids": ["942100"],
      "waf_message_count": 1
    }
  ],
  "session_features": {
    "detected_rule_count": 2,
    "distinct_rule_count": 1,
    "status_2xx": 10,
    "status_4xx": 2
  }
}
```

이 형식이 raw flat CSV를 Gemma에 바로 넣는 것보다 훨씬 낫다.

## 8. 임시 세션 키 전략

현재 로그에는 아직 데이터셋용 세션 헤더가 없으므로, 임시 세션 키가 필요하다.

권장 임시 키:

- `client_ip + user_agent + time_window`

권장 time window:

- 15분에서 30분

주의:

- 이 방식은 임시 대안일 뿐이다
- 동일한 IP와 user agent를 여러 사용자가 공유하면 세션 오염 가능성이 있다

향후 JMeter 생성 데이터에서는 다음처럼 가는 것이 맞다.

- `X-Dataset-Session` 전송
- `X-Dataset-Scenario` 전송

이 값들은 불투명한 ID만 넣어야 한다. 실제 클래스 라벨은 요청에 직접 넣으면 안 된다.

## 9. 현재 단계에서의 권장 학습 입력

현재 단계에서는 raw WAF 행보다 축약된 세션 데이터셋으로 학습하는 것이 낫다.

가장 현실적인 근접 해법:

- 먼저 요청 행을 파싱한다
- 그 행들을 세션으로 묶는다
- 세션 단위 요약을 만든다
- 세션에 라벨을 붙인다

권장 모델 입력 우선순위:

1. 세션 요약 JSONL
2. 축약된 요청 단위 CSV
3. raw export WAF CSV

즉, 지금은 임시 Python 스크립트를 쓰는 것이 맞다.

## 10. 새 JMX 데이터셋의 세션 설계

### 10-1. 분류 단위

- 세션 하나당 라벨 하나

### 10-2. 템플릿 수

- 시나리오 템플릿 100개
- 정상 60
- 애매 30
- 공격 10

### 10-3. 실제 생성 세션 수

템플릿 수만으로는 학습 데이터가 부족하다. 템플릿당 여러 변형이 필요하다.

권장 1차 목표:

- 1,800 ~ 2,400 세션

권장 실제 생성 비율:

- 정상 45 ~ 50 퍼센트
- 애매 30 ~ 35 퍼센트
- 공격 15 ~ 20 퍼센트

### 10-4. 세션당 요청 수

권장:

- 최소 사용 가능: 6 ~ 8개
- 선호 범위: 8 ~ 18개
- 목표 중앙값: 12 ~ 14개
- v1 상한: 약 20개

이유:

- 요청 수가 너무 적으면 맥락이 약하다
- 요청 수가 너무 많으면 하나의 지배적 의도가 흐려진다

### 10-5. 길이 분포

- 짧은 세션: 20퍼센트, 6 ~ 8개
- 중간 세션: 60퍼센트, 9 ~ 15개
- 긴 세션: 20퍼센트, 16 ~ 20개

세션 길이가 클래스와 너무 강하게 연결되지 않도록 해야 한다.

## 11. 의도 그라데이션 설계

세션 단위 `intent_score` 를 0부터 9까지 둔다.

- `0 ~ 2`: 명확한 정상
- `3 ~ 5`: 애매하지만 여전히 그럴듯한 사용자 행위
- `6 ~ 9`: 업무 API 범위 안에서 공격 의도가 강한 세션

예시:

- score 1: 로그인, 공지 조회, 게시판 검색, 정상 글 작성, 정상 댓글
- score 4: 코드 조각, HTML 유사 문자열, path 유사 문자열이 포함된 게시판 검색
- score 7: 의심 검색어 반복 변형, 권한 탐색, 허용된 업무 경로 안에서의 ID enumeration

## 12. 업무 범위만 포함

요청대로 비업무 경로는 제외한다.

포함 범위:

- `/api/auth/*`
- `/api/public/*`
- `/api/lms/*`
- `/api/board/*`

제외 범위:

- `/admin`
- `/.env`
- `/backup.zip`
- 정적 자산
- 프론트 SPA 라우트

## 13. 새 데이터셋의 권장 산출물

예정 산출물:

- `jmx` 1개
- 세션 카탈로그 CSV 1개
- 요청 흐름 CSV 1개
- payload pool CSV 1개

권장 구조:

### 13-1. `session_catalog.csv`

컬럼:

- `scenario_id`
- `persona`
- `role`
- `intent_class`
- `intent_score`
- `session_len`
- `think_profile`
- `variation_seed`

### 13-2. `request_flow.csv`

컬럼:

- `scenario_id`
- `step_no`
- `method`
- `path`
- `query_template`
- `body_template`
- `auth_required`
- `expected_app_status`
- `ownership_mode`

### 13-3. `payload_pool.csv`

컬럼:

- `payload_id`
- `category`
- `suspicion_level`
- `text`

카테고리 예시:

- `normal_text`
- `code_snippet`
- `path_like`
- `html_like`
- `sql_like`
- `authz_probe`

## 14. JMeter 구조 권장안

권장 JMeter 설계:

- `1 thread = 1 session`
- `Loop Count = 1`
- `HTTP Cookie Manager`
- `CSV Data Set Config`
- `Uniform Random Timer`
- 필요한 경우 로그인 토큰이나 ID 추출용 `JSON Extractor`
- custom header:
  - `X-Dataset-Session`
  - `X-Dataset-Scenario`

중요:

- `intent_class` 나 `intent_score` 를 요청 헤더에 직접 넣으면 안 된다
- 라벨 누수를 반드시 막아야 한다

## 15. 현실적인 V0 진행 순서

지금은 다음 순서가 적절하다.

1. [waf_log_260320.csv](C:/workspace/codex/saesac03_final/web/jmx/waf_log_260320.csv) 는 raw 증적 파일로 그대로 보관한다
2. 축약 필드 추출용 작은 Python 스크립트를 만든다
3. 임시 세션 데이터셋을 만든다
4. 어떤 룰이 실제 신호이고 어떤 룰이 환경 노이즈인지 확인한다
5. 그다음 명시적 session ID를 가진 새 JMX 기반 데이터셋으로 넘어간다

## 16. 현재 CSV 기반 임시 라벨링 규칙

현재 CSV에서 만든 임시 데이터셋은 라벨링을 신중하게 해야 한다.

권장 규칙:

- 숫자 IP Host 사용 때문에 발생한 `920350` 같은 환경 노이즈만 있는 행은 공격 근거로 쓰지 않는다
- 정상 업무 흐름에 환경 노이즈만 붙은 세션은 `normal` 로 두거나 v0 학습셋에서 제외한다
- 사용자 입력 텍스트 때문에 WAF 유사 탐지가 발생했지만 전체 흐름은 정상 사용자 행위라면 `ambiguous` 로 둔다
- 업무 API 안에서 반복적 탐색이나 명확한 오남용 패턴이 있으면 `attack` 으로 둔다

## 17. 최종 권장안

현재 시점에서 맞는 방향은 다음과 같다.

- 맞다, 현재 CSV는 한 번 더 정제해서 넘겨야 한다
- 맞다, 지금은 임시 Python 스크립트를 써도 된다
- 아니다, 정식 2차 파서를 기다리느라 실험 자체를 미룰 필요는 없다

다만 학습 입력은 raw row 수준이 아니라, 이미 세션 지향 데이터로 한 단계 올려서 가는 것이 좋다.
