# WAF Overblocking Session Dataset Design

## 1. Goal

The objective is to generate JMeter traffic that causes WAF overblocking or over-detection, then use that result to train a local AI model to distinguish three session-level classes:

- normal user behavior
- ambiguous behavior
- attack-intent behavior

The target shape is a gradual intent gradient rather than a hard binary split.

Initial scenario template count:

- normal: 60
- ambiguous: 30
- attack: 10

This document also covers how to handle the current raw WAF CSV before the second parsing pipeline is ready.

## 2. Conclusion First

Yes. The current raw CSV should be refined once more before training.

Reason:

- it mixes business traffic, frontend asset traffic, and WAF detection records
- the same request information appears in duplicated columns
- environment noise is strong
- sensitive or low-value fields such as tokens, container metadata, and repeated host metadata are included

However, because the second parser is not ready yet, it is reasonable to do a temporary extraction with a small Python script and train on a reduced session dataset first.

Recommended temporary direction:

1. keep the raw CSV untouched
2. extract only important fields into a smaller intermediate CSV or JSONL
3. aggregate those rows into session-level samples
4. attach manual or semi-manual labels
5. train and validate on that smaller dataset first

## 3. What Was Observed In The Current CSV

Source file:

- [waf_log_260320.csv](C:/workspace/codex/saesac03_final/web/jmx/waf_log_260320.csv)

Current observations from the sample:

- rule `920350` appears repeatedly
- message `Host header is a numeric IP address` dominates many rows
- `/api/auth/me` appears frequently
- `DetectionOnly` and `Enabled` records are mixed
- business API rows and non-business rows are mixed
- some rows are closer to access log records than pure WAF detection records

Implication:

- if this raw CSV is used directly, the model may learn environment artifacts such as numeric IP host usage instead of user intent
- this is especially dangerous for a session classifier because a single noisy rule can dominate the whole session label

## 4. Recommended Immediate Handling Of The Current CSV

### 4-1. Do not train directly on the raw CSV

Avoid using the raw exported CSV as-is for model input.

Problems:

- too many duplicated columns
- container and agent metadata are mostly useless for intent learning
- `Authorization`, `request_id`, `unique_id`, raw response body, and host metadata can become leakage or noise
- the same request can appear once as plain access-like log and once as WAF detection-like log

### 4-2. Use a temporary Python extraction step now

Until the proper second parser is ready, use a small Python script to create a temporary clean dataset.

Recommended outputs:

- `parsed_request_rows.csv`
- `session_dataset.jsonl`

The temporary script should do only the minimum:

1. select important columns
2. normalize duplicated fields
3. drop obvious noise
4. assign a temporary session key
5. aggregate into session summaries

## 5. Fields To Keep In The Temporary Extraction

Recommended request-level fields to keep from the current CSV:

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

Normalization rule:

- if both `rule.id` and `waf_json.transaction.messages.details.ruleId` exist, keep one normalized field such as `normalized_rule_id`
- if both `url.path` and `waf_json.request_uri` exist, keep one normalized field such as `normalized_path`
- if both status fields exist, keep one normalized field such as `normalized_status`

## 6. Fields To Drop In The Temporary Extraction

Drop these by default:

- elastic agent metadata
- container metadata
- docker labels
- host MAC and host IP lists
- repeated headers not needed for intent classification
- raw response body
- `Authorization` header
- refresh/access tokens
- request IDs and correlation IDs unless strictly needed for join logic
- static asset rows such as `/assets/...`
- frontend route rows such as `/lms/...` when they are not actual business API calls

Important:

- if numeric IP Host usage is unavoidable in the environment, exclude rule `920350` from the initial training set or mark it as environment noise

## 7. Temporary Session Dataset Shape

Because the target is session-level classification, the final temporary training input should be session-oriented, not row-oriented.

Recommended session JSONL structure:

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

This format is better than feeding the raw flat CSV directly into Gemma.

## 8. Temporary Session Key Strategy

Because the current logs do not yet have a dedicated dataset session header, use a temporary session key.

Recommended temporary key:

- `client_ip + user_agent + time_window`

Suggested time window:

- 15 to 30 minutes

Warning:

- this is only a stopgap
- if many users share IP and user agent, session contamination can happen

For future JMeter-generated data, do this instead:

- send `X-Dataset-Session`
- send `X-Dataset-Scenario`

These should be opaque IDs only. Do not send the actual class label in the request.

## 9. Recommended Training Input For Now

For the current stage, train on a reduced session dataset rather than on raw WAF rows.

Best near-term option:

- request rows are parsed first
- rows are grouped into sessions
- session-level summaries are generated
- labels are attached to sessions

Recommended model input priority:

1. session summary JSONL
2. reduced request-level CSV
3. raw exported WAF CSV

So yes, using a temporary Python script now is the practical choice.

## 10. Session Design For The New JMX Dataset

### 10-1. Classification unit

- one session = one label

### 10-2. Template count

- 100 scenario templates
- normal 60
- ambiguous 30
- attack 10

### 10-3. Actual generated session count

Template count is not enough for learning. Generate multiple variants per template.

Recommended first target:

- 1,800 to 2,400 sessions

Recommended generated session ratio:

- normal 45 to 50 percent
- ambiguous 30 to 35 percent
- attack 15 to 20 percent

### 10-4. Requests per session

Recommended:

- minimum usable: 6 to 8
- preferred range: 8 to 18
- target median: 12 to 14
- upper bound for v1: about 20

Reason:

- too few requests provide weak context
- too many requests blur one dominant intent

### 10-5. Length distribution

- short sessions: 20 percent, 6 to 8 requests
- medium sessions: 60 percent, 9 to 15 requests
- long sessions: 20 percent, 16 to 20 requests

Do not tie session length too tightly to class.

## 11. Intent Gradient Design

Use a session-level `intent_score` from 0 to 9.

- `0 to 2`: clearly normal
- `3 to 5`: ambiguous but still plausible user behavior
- `6 to 9`: strong attack intent within business APIs only

Examples:

- score 1: login, notice view, board search, normal post, normal comment
- score 4: board search with code-like text, HTML-like fragments, path-like strings
- score 7: repeated suspicious search variants, ownership probing, ID enumeration within allowed business paths

## 12. Business Scope Only

The user requested that non-business paths be excluded.

Include only these areas:

- `/api/auth/*`
- `/api/public/*`
- `/api/lms/*`
- `/api/board/*`

Exclude:

- `/admin`
- `/.env`
- `/backup.zip`
- static assets
- frontend SPA routes

## 13. Recommended Output Files For The New Dataset

Planned deliverables:

- one `jmx`
- one session catalog CSV
- one request flow CSV
- one payload pool CSV

Suggested structure:

### 13-1. `session_catalog.csv`

Columns:

- `scenario_id`
- `persona`
- `role`
- `intent_class`
- `intent_score`
- `session_len`
- `think_profile`
- `variation_seed`

### 13-2. `request_flow.csv`

Columns:

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

Columns:

- `payload_id`
- `category`
- `suspicion_level`
- `text`

Category examples:

- `normal_text`
- `code_snippet`
- `path_like`
- `html_like`
- `sql_like`
- `authz_probe`

## 14. JMeter Structure Recommendation

Recommended JMeter design:

- `1 thread = 1 session`
- `Loop Count = 1`
- `HTTP Cookie Manager`
- `CSV Data Set Config`
- `Uniform Random Timer`
- `JSON Extractor` for login token or IDs where needed
- custom headers:
  - `X-Dataset-Session`
  - `X-Dataset-Scenario`

Important:

- do not send `intent_class` or `intent_score` as request headers
- label leakage must be avoided

## 15. Practical V0 Workflow

Use this order now:

1. keep [waf_log_260320.csv](C:/workspace/codex/saesac03_final/web/jmx/waf_log_260320.csv) as raw evidence
2. build a small Python extractor for reduced fields
3. create a temporary session dataset
4. validate which rules are real signal and which are environment noise
5. then build the new JMX-based dataset with explicit session IDs

## 16. Recommended Temporary Labeling Rule

For the current CSV-derived dataset, label carefully.

Suggested rule:

- if the row only contains environment noise like `920350` from numeric IP host usage, do not use it as attack evidence
- if a session contains only normal business flow plus environment noise, label it `normal` or exclude it from v0 training
- if the session contains user text that triggers WAF-like detection but stays inside normal user flow, label it `ambiguous`
- if the session contains repeated probing or clear misuse patterns within business APIs, label it `attack`

## 17. Final Recommendation

The right near-term move is:

- yes, refine the current CSV one more time
- yes, use a temporary Python script now
- no, do not wait for the full second parser before starting experiments

But the training input should already be moved one level up from raw rows to session-oriented data.
