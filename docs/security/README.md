# 보안 자료 안내

포트폴리오 제출 기준으로 보안 실험 자료를 `현재 기준으로 바로 봐야 하는 자료`와 `비교용 이력`으로 분리했다.

## 바로 볼 자료

- `rules/`
  - 운영/검토 대상 WAF 룰 초안과 Snort 룰 초안
- `change-requests/`
  - 경로 한정 허용 요청서, 남은 과탐 보정 요청서
- `dashboard/`
  - 대시보드용 JMeter 시나리오
- `datasets/`
  - 500건 해석 CSV, 학습용 공격 데이터, 룰 리뷰 데이터, 파싱 기준 CSV
- `jmeter/`
  - 실사용 JMeter 가이드, 세션 시나리오, 정상/경계/공격/부하 테스트 시나리오

## 핵심 추천 순서

1. `rules/waf_rule.txt`
2. `change-requests/waf-change-request-remaining-fp-2026-03-28.md`
3. `jmeter/scenarios/load/500/FP_BOARD_SEARCH_URL_EXPANDED_500_V2.jmx`
4. `jmeter/scenarios/load/500/result/FP_BOARD_SEARCH_URL_EXPANDED_500_V2-results_on.jtl`
5. `jmeter/scenarios/load/500/result/FP_BOARD_SEARCH_URL_EXPANDED_500_V2-results_on10.jtl`
6. `datasets/jmx-500-interpretation-full.csv`

## 보관 이력

- `archive/datasets/`
  - 샘플 CSV, 원본 Discover export
- `archive/jmeter/guides/`
  - 제외한 영문 초안
- `archive/jmeter/load/`
  - 중간 튜닝 결과, v1/v2 초안, 비교용 JTL

현재 제출용 기준에서는 `jmeter/` 아래 자료만 보면 되고, `archive/`는 필요할 때만 비교 참고용으로 보면 된다.
