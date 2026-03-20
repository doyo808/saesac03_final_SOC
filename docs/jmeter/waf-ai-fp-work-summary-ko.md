# WAF AI 과탐 방지 작업 요약 보고서

## 1. 목적

이번 작업의 목적은 WAF 로그를 그대로 학습시키는 것이 아니라, 정상/애매/공격 의도를 세션 단위로 구분할 수 있는 학습 데이터를 만들어 AI가 환경성 노이즈와 실제 공격 징후를 구분하도록 돕는 데 있다. 최종적으로는 단순 시그니처 매칭으로 과탐이 발생하는 구간을 줄이고, 운영 맥락을 반영한 분류 성능을 확보하는 것이 목표다.

## 2. 진행한 일

### 2-1. raw 로그 성격 파악

- raw WAF CSV를 확보하고 어떤 룰과 필드가 반복되는지 확인했다.
- 확인 결과 `920350` (`Host header is a numeric IP address`) 같은 환경성 노이즈가 많이 섞여 있었고, access log 성격과 WAF 탐지 레코드가 혼재되어 있었다.
- 결론적으로 raw Discover export는 증적 보관용으로는 유효하지만, AI 학습 입력으로는 바로 쓰기 어렵다고 판단했다.

### 2-2. 축약/세션 지향 데이터셋 방향 수립

- raw CSV는 원본 그대로 보존하고, 중요한 요청/세션 정보만 뽑은 축약 데이터셋을 따로 만드는 방향으로 정리했다.
- 분류 단위는 개별 요청이 아니라 세션으로 잡고, `normal / ambiguous / attack` 또는 `intent_score` 기반 그라데이션 분류를 목표로 설계했다.
- 업무 범위는 `/api/auth/*`, `/api/public/*`, `/api/lms/*`, `/api/board/*` 안에서만 다루고, 비업무 경로는 별도 스캔/정찰 시나리오로 분리했다.

### 2-3. 과탐/탐지 유발용 JMeter 자산 정리

- 중간발표용 과탐 유발 시나리오 문서를 작성해 `수상한 파라미터 조회`와 `관리자/백업/점검 경로 탐색`을 대표 케이스로 정리했다.
- JMeter용 CSV와 JMX를 만들어 low-load 환경에서도 WAF 탐지와 과탐 후보 로그가 안정적으로 쌓이도록 했다.
- 이후 세션 단위 학습을 위해 `WAF_SESSION_NORMAL_TEST`, `WAF_SESSION_AMBIGUOUS_TEST`, `WAF_SESSION_ATTACK_TEST`를 추가해 정상/애매/공격 의도가 섞인 세션 흐름을 만들었다.

### 2-4. 최근 보강 사항

- 팀 요청에 맞춰 SQLi, XSS, Path Traversal, Random Scan이 고르게 섞인 경량 CSV를 새로 만들었다.
- 단순히 `요청 1개짜리 JMX`가 아니라 `CSV 1행 = 공격 세션 1개`가 되도록 JMX를 다시 키웠다.
- 현재 mixed attack 세션 CSV는 총 42개 세션으로 구성되어 있으며 분포는 다음과 같다.
  - SQLi 12
  - XSS 10
  - Path Traversal 10
  - Random Scan 10
- mixed attack 세션 JMX는 로그인, 프로필 조회, 공용 조회, LMS 조회, 게시판 검색 2회, category별 probe 요청, 게시글 작성, 상세 조회까지 포함하는 다단계 세션 구조다.

## 3. 주요 산출물

- 설계 문서: `docs/jmeter/waf-ai-training-design-ko.md`
- 중간발표용 과탐 시나리오 문서: `docs/jmeter/security-fp-jmeter.md`
- 세션형 JMX:
  - `docs/jmeter/jmx_session/WAF_SESSION_NORMAL_TEST.jmx`
  - `docs/jmeter/jmx_session/WAF_SESSION_AMBIGUOUS_TEST.jmx`
  - `docs/jmeter/jmx_session/WAF_SESSION_ATTACK_TEST.jmx`
  - `docs/jmeter/jmx_session/WAF_SESSION_MIXED_ATTACK_TRAINING.jmx`
- raw CSV 보관:
  - `docs/csv/Untitled Discover session (42).csv`
  - `jmx/waf_log_260320.csv`
- 경량 학습/실행용 CSV:
  - `docs/csv/waf-mixed-attack-training.csv`

## 4. 기대 효과

이 작업으로 모델은 단일 룰 ID 하나에만 반응하는 대신, 세션 전체의 흐름과 요청 조합을 보고 판단할 수 있게 된다. 예를 들어 숫자 IP Host 같은 환경 노이즈는 과감히 약화하고, 실제 공격 의도가 강한 검색/경로탐색/정찰 패턴은 세션 맥락 속에서 더 정확히 잡는 방향으로 학습시킬 수 있다. 즉, 탐지량을 늘리는 것이 아니라 과탐을 줄이면서도 의미 있는 탐지를 유지하는 데이터 기반 튜닝 토대를 마련한 셈이다.

## 5. 다음 단계

1. mixed attack 세션 JMX를 실행해 로그를 다시 수집한다.
2. raw 로그와 세션 헤더를 기준으로 세션 데이터셋(JSONL/축약 CSV)을 만든다.
3. 세션 라벨(`normal / ambiguous / attack`)을 붙여 학습셋을 확정한다.
4. 모델 학습 후 false positive 감소율, precision/recall, 룰별 오분류를 점검한다.
5. 결과를 바탕으로 WAF 예외 정책과 AI 분류 후처리를 함께 조정한다.
