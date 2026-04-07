# WAF Search Route FP 20

## Scope

This package verifies false positives only on the project's real search routes.

- `GET /api/board/posts`
- `GET /api/public/announcements`

`/api/public/academic-events` is not included because the current backend and frontend do not expose a search query for that route.

## Files

- `jmx/FP_SEARCH_ROUTE_FP_20.jmx`
- `jmx/search-route-fp-20.csv`
- `jmx/compare_fp_results.py`
- `jmx/waf_rule.txt`

## Rule intent

`jmx/waf_rule.txt` does two things:

1. Keeps the existing board CRUD method exceptions.
2. Removes CRS attack inspection only from these search arguments:
   - board search: `ARGS:keyword`, `ARGS:author`
   - announcement search: `ARGS:keyword`

The old phase-2 custom deny rules for SQLi, traversal, RCE/JNDI, and XSS search queries are intentionally removed. The new policy is path-scoped false-positive tuning, not query-token blocking.

## Planned metric change

The 20-case dataset is designed so that 8 requests are blocked before the rule change only because of WAF search overblocking.

- Metric: `WAF false positive count`
  - Definition: requests that should be allowed by the search route policy but return `403` or a transport failure before reaching the app
- Metric: `WAF false positive rate`
  - Definition: `WAF false positive count / 20`

Planned delta from the dataset:

- `WAF false positive count`: `8 -> 0`
- `WAF false positive rate`: `40% -> 0%`
- `Allowed search requests`: `12 -> 20`

The 8 changing cases are the `javascript:` keyword searches on board and announcement routes. They are blocked by the current WAF search rules but are not blocked by the application's `SuspiciousRequestGuardFilter`.

## Run

Baseline:

```bash
jmeter -n -t jmx\FP_SEARCH_ROUTE_FP_20.jmx ^
  -Jhost=www.kj.ac.kr ^
  -Jprotocol=http ^
  -Jport=80 ^
  -Jresult_file=jmx\FP_SEARCH_ROUTE_FP_20-before.jtl
```

After applying `jmx/waf_rule.txt`:

```bash
jmeter -n -t jmx\FP_SEARCH_ROUTE_FP_20.jmx ^
  -Jhost=www.kj.ac.kr ^
  -Jprotocol=http ^
  -Jport=80 ^
  -Jresult_file=jmx\FP_SEARCH_ROUTE_FP_20-after.jtl
```

Compare planned metrics:

```bash
python jmx\compare_fp_results.py ^
  --dataset jmx\search-route-fp-20.csv ^
  --expected-only
```

Compare actual metrics:

```bash
python jmx\compare_fp_results.py ^
  --dataset jmx\search-route-fp-20.csv ^
  --before jmx\FP_SEARCH_ROUTE_FP_20-before.jtl ^
  --after jmx\FP_SEARCH_ROUTE_FP_20-after.jtl
```

## Notes

- Board search requires login, so the JMX logs in once and reuses the access token.
- Public announcement requests reuse the same token, but the endpoint remains public.
- The comparison script treats `403` and `Non HTTP response code ...` as WAF-side false positives.
- `400` is counted separately as an app-side rejection, not as a WAF false positive.
