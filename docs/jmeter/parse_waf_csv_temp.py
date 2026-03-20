from __future__ import annotations

import argparse
import csv
import hashlib
import json
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable


EMPTY_VALUES = {"", "-", "(empty)", "null", "None"}
BUSINESS_PREFIXES = ("/api/auth/", "/api/public/", "/api/lms/", "/api/board/")
ASSET_PREFIXES = ("/assets/", "/favicon", "/vite.svg", "/static/")
DEFAULT_EXCLUDED_RULES: tuple[str, ...] = ()
FIELD_SIZE_LIMIT = 1024 * 1024 * 64


@dataclass
class ParsedRow:
    row_index: int
    timestamp: datetime | None
    timestamp_text: str
    source_ip_actual: str
    claimed_ip_header: str
    claimed_ip_mode: str
    user_agent: str
    method: str
    path: str
    url_original: str
    query_string: str
    body_preview: str
    status_code: str
    path_scope: str
    unique_id: str
    rule_ids: list[str]
    rule_names: list[str]
    waf_messages: list[str]
    severities: list[str]
    engine_modes: list[str]
    event_actions: list[str]
    event_outcomes: list[str]


def normalize_value(value: str | None) -> str:
    if value is None:
        return ""
    value = str(value).strip()
    if value in EMPTY_VALUES:
        return ""
    return " ".join(value.split())


def normalize_raw_candidate(value: str | None) -> str:
    if value is None:
        return ""
    value = str(value).strip()
    if value in EMPTY_VALUES:
        return ""
    return value


def first_non_empty(row: dict[str, str], field_names: Iterable[str]) -> str:
    for field_name in field_names:
        value = normalize_value(row.get(field_name))
        if value:
            return value
    return ""


def get_nested_value(obj: object, path: tuple[str, ...]) -> str:
    current = obj
    for key in path:
        if not isinstance(current, dict):
            return ""
        current = current.get(key)
    if isinstance(current, (dict, list)):
        return ""
    return normalize_value(current)


def try_parse_json(value: object) -> object | None:
    if isinstance(value, (dict, list)):
        return value
    if not isinstance(value, str):
        return None
    candidate = normalize_raw_candidate(value)
    if not candidate or candidate[0] not in "{[":
        return None
    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        return None


def collect_embedded_json_objects(value: object, objects: list[dict[str, object]]) -> None:
    parsed = try_parse_json(value)
    if parsed is None:
        return

    if isinstance(parsed, dict):
        objects.append(parsed)
        for nested_value in parsed.values():
            if isinstance(nested_value, (dict, list, str)):
                collect_embedded_json_objects(nested_value, objects)
        return

    if isinstance(parsed, list):
        for item in parsed:
            if isinstance(item, (dict, list, str)):
                collect_embedded_json_objects(item, objects)


def looks_like_access_log(obj: dict[str, object]) -> bool:
    return any(
        key in obj
        for key in (
            "request_method",
            "request_uri",
            "status_code",
            "request_line",
            "client_ip",
        )
    )


def looks_like_transaction(obj: dict[str, object]) -> bool:
    return (
        isinstance(obj.get("request"), dict)
        and isinstance(obj.get("response"), dict)
        and any(key in obj for key in ("client_ip", "time_stamp", "producer", "messages"))
    )


def first_nested_value(objects: list[dict[str, object]], paths: list[tuple[str, ...]]) -> str:
    for obj in objects:
        for path in paths:
            value = get_nested_value(obj, path)
            if value:
                return value
    return ""


def extract_embedded_fields(row: dict[str, str]) -> dict[str, str]:
    objects: list[dict[str, object]] = []
    for field_name in ("event.original", "message"):
        raw_value = row.get(field_name)
        if raw_value:
            collect_embedded_json_objects(raw_value, objects)

    wrapper_objects: list[dict[str, object]] = []
    access_objects: list[dict[str, object]] = []
    transaction_objects: list[dict[str, object]] = []

    for obj in objects:
        wrapper_objects.append(obj)
        if looks_like_access_log(obj):
            access_objects.append(obj)
        if looks_like_transaction(obj):
            transaction_objects.append(obj)
        transaction = obj.get("transaction")
        if isinstance(transaction, dict):
            transaction_objects.append(transaction)

    rule_ids: list[str] = []
    rule_names: list[str] = []
    waf_messages: list[str] = []
    severities: list[str] = []
    engine_modes: list[str] = []

    for transaction in transaction_objects:
        engine_mode = get_nested_value(transaction, ("producer", "secrules_engine"))
        if engine_mode:
            engine_modes.append(engine_mode)

        messages = transaction.get("messages")
        if not isinstance(messages, list):
            continue
        for message in messages:
            if not isinstance(message, dict):
                continue
            message_text = normalize_value(message.get("message"))
            if message_text:
                waf_messages.append(message_text)
                rule_names.append(message_text)

            details = message.get("details")
            if not isinstance(details, dict):
                continue
            rule_id = normalize_value(details.get("ruleId"))
            severity = normalize_value(details.get("severity"))
            if rule_id:
                rule_ids.append(rule_id)
            if severity:
                severities.append(severity)

    deduped_rules = serialize_multi_value(rule_ids)
    deduped_rule_names = serialize_multi_value(rule_names)
    deduped_messages = serialize_multi_value(waf_messages)
    deduped_severities = serialize_multi_value(severities)
    deduped_engine_modes = serialize_multi_value(engine_modes)

    return {
        "__fallback_timestamp": first_nested_value(
            access_objects + wrapper_objects + transaction_objects,
            [("timestamp",), ("time",), ("time_stamp",)],
        ),
        "__fallback_source_ip": first_nested_value(
            access_objects + transaction_objects,
            [("client_ip",)],
        ),
        "__fallback_user_agent": first_nested_value(
            access_objects + transaction_objects,
            [("user_agent",), ("request", "headers", "User-Agent")],
        ),
        "__fallback_method": first_nested_value(
            access_objects + transaction_objects,
            [("request_method",), ("request", "method")],
        ),
        "__fallback_path": first_nested_value(
            access_objects + transaction_objects,
            [("request_uri",), ("request", "uri")],
        ),
        "__fallback_url_original": first_nested_value(
            access_objects + transaction_objects,
            [("request_line",), ("request_uri",), ("request", "uri")],
        ),
        "__fallback_query_string": first_nested_value(
            access_objects + transaction_objects,
            [("query_string",)],
        ),
        "__fallback_body": first_nested_value(
            transaction_objects,
            [("request", "body")],
        ),
        "__fallback_status_code": first_nested_value(
            access_objects + transaction_objects,
            [("status_code",), ("response", "http_code")],
        ),
        "__fallback_unique_id": first_nested_value(
            transaction_objects + access_objects,
            [("unique_id",), ("request_id",)],
        ),
        "__fallback_claimed_xff": first_nested_value(
            access_objects + transaction_objects,
            [("forwarded_for",), ("request", "headers", "X-Forwarded-For")],
        ),
        "__fallback_claimed_x_real_ip": first_nested_value(
            transaction_objects,
            [("request", "headers", "X-Real-IP")],
        ),
        "__fallback_claimed_forwarded": first_nested_value(
            transaction_objects,
            [("request", "headers", "Forwarded")],
        ),
        "__fallback_rule_ids": deduped_rules,
        "__fallback_rule_names": deduped_rule_names,
        "__fallback_waf_messages": deduped_messages,
        "__fallback_severities": deduped_severities,
        "__fallback_engine_modes": deduped_engine_modes,
    }


def parse_timestamp(value: str) -> datetime | None:
    value = normalize_value(value)
    if not value:
        return None

    known_formats = (
        "%b %d, %Y @ %H:%M:%S.%f",
        "%b %d, %Y @ %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S.%f%z",
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%S.%f",
        "%Y-%m-%dT%H:%M:%S",
    )
    for fmt in known_formats:
        try:
            parsed = datetime.strptime(value, fmt)
            if parsed.tzinfo is None:
                return parsed.replace(tzinfo=timezone.utc)
            return parsed.astimezone(timezone.utc)
        except ValueError:
            continue

    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            return parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc)
    except ValueError:
        return None


def truncate_text(value: str, max_length: int) -> str:
    value = normalize_value(value)
    if len(value) <= max_length:
        return value
    if max_length <= 3:
        return value[:max_length]
    return f"{value[: max_length - 3]}..."


def classify_path_scope(path: str) -> str:
    if not path:
        return "unknown"
    if any(path.startswith(prefix) for prefix in BUSINESS_PREFIXES):
        return "business"
    if any(path.startswith(prefix) for prefix in ASSET_PREFIXES):
        return "asset"
    if path.startswith("/api/"):
        return "api_other"
    if path.startswith("/"):
        return "frontend_or_other"
    return "unknown"


def parse_multi_value(value: str) -> list[str]:
    value = normalize_value(value)
    if not value:
        return []
    return [part.strip() for part in value.split("|") if part.strip()]


def serialize_multi_value(values: Iterable[str]) -> str:
    seen: list[str] = []
    for value in values:
        normalized = normalize_value(value)
        if normalized and normalized not in seen:
            seen.append(normalized)
    return "|".join(seen)


def build_request_signature(row: ParsedRow) -> str:
    timestamp_key = ""
    if row.timestamp is not None:
        timestamp_key = row.timestamp.replace(microsecond=0).isoformat()
    raw = "||".join(
        [
            row.method,
            row.path,
            row.status_code,
            row.source_ip_actual,
            row.user_agent,
            timestamp_key,
        ]
    )
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()[:16]


def make_session_key(
    source_ip_actual: str,
    user_agent: str,
    timestamp: datetime | None,
    session_window_minutes: int,
) -> tuple[str, str]:
    if timestamp is None:
        bucket_start = "unknown-time"
    else:
        bucket_minutes = (timestamp.minute // session_window_minutes) * session_window_minutes
        bucket_dt = timestamp.replace(minute=bucket_minutes, second=0, microsecond=0)
        bucket_start = bucket_dt.isoformat()

    raw_key = f"{source_ip_actual}|{user_agent}|{bucket_start}"
    session_hash = hashlib.sha1(raw_key.encode("utf-8")).hexdigest()[:12]
    return f"tmp-session-{session_hash}", bucket_start


def merge_values(rows: list[ParsedRow], attr_name: str) -> list[str]:
    merged: list[str] = []
    for row in rows:
        value = getattr(row, attr_name)
        if isinstance(value, list):
            merged.extend(value)
        else:
            normalized = normalize_value(value)
            if normalized:
                merged.append(normalized)
    return [value for value in dict.fromkeys(merged)]


def parse_row(
    row_index: int,
    row: dict[str, str],
    body_preview_length: int,
    excluded_rules: set[str],
) -> ParsedRow:
    lookup_row = dict(row)
    lookup_row.update(extract_embedded_fields(row))

    timestamp_raw = first_non_empty(
        lookup_row,
        (
            "@timestamp",
            "waf_json.timestamp",
            "event.ingested",
            "waf_json.transaction.time_stamp",
            "__fallback_timestamp",
        ),
    )
    timestamp = parse_timestamp(timestamp_raw)

    source_ip_actual = first_non_empty(
        lookup_row,
        (
            "source.ip",
            "waf_json.client_ip",
            "waf_json.transaction.client_ip",
            "__fallback_source_ip",
        ),
    )
    user_agent = first_non_empty(
        lookup_row,
        (
            "user_agent.original",
            "waf_json.user_agent",
            "waf_json.transaction.request.headers.User-Agent",
            "__fallback_user_agent",
        ),
    )
    method = first_non_empty(
        lookup_row,
        (
            "http.request.method",
            "waf_json.request_method",
            "waf_json.transaction.request.method",
            "__fallback_method",
        ),
    )
    path = first_non_empty(
        lookup_row,
        (
            "url.path",
            "waf_json.request_uri",
            "waf_json.transaction.request.uri",
            "__fallback_path",
        ),
    )
    url_original = first_non_empty(
        lookup_row,
        ("url.original", "waf_json.request_uri", "waf_json.request_line", "__fallback_url_original"),
    )
    query_string = first_non_empty(lookup_row, ("waf_json.query_string", "__fallback_query_string"))
    body_preview = truncate_text(
        first_non_empty(lookup_row, ("waf_json.transaction.request.body", "__fallback_body")),
        body_preview_length,
    )
    status_code = first_non_empty(
        lookup_row,
        (
            "http.response.status_code",
            "waf_json.status_code",
            "waf_json.transaction.response.http_code",
            "__fallback_status_code",
        ),
    )

    claimed_xff = first_non_empty(
        lookup_row,
        (
            "waf_json.forwarded_for",
            "waf_json.transaction.request.headers.X-Forwarded-For",
            "__fallback_claimed_xff",
        ),
    )
    claimed_x_real_ip = first_non_empty(
        lookup_row,
        ("waf_json.transaction.request.headers.X-Real-IP", "__fallback_claimed_x_real_ip"),
    )
    claimed_forwarded = first_non_empty(
        lookup_row,
        ("waf_json.transaction.request.headers.Forwarded", "__fallback_claimed_forwarded"),
    )
    claimed_ip_header = claimed_xff or claimed_x_real_ip or claimed_forwarded
    if claimed_xff:
        claimed_ip_mode = "x-forwarded-for"
    elif claimed_x_real_ip:
        claimed_ip_mode = "x-real-ip"
    elif claimed_forwarded:
        claimed_ip_mode = "forwarded"
    else:
        claimed_ip_mode = "none"

    rule_ids = parse_multi_value(
        serialize_multi_value(
            [
                first_non_empty(lookup_row, ("rule.id", "waf_json.transaction.messages.details.ruleId", "__fallback_rule_ids")),
            ]
        )
    )
    rule_ids = [rule_id for rule_id in rule_ids if rule_id not in excluded_rules]

    rule_names = parse_multi_value(
        serialize_multi_value(
            [
                first_non_empty(lookup_row, ("rule.name", "waf_json.transaction.messages.message", "__fallback_rule_names")),
            ]
        )
    )

    waf_messages = parse_multi_value(
        first_non_empty(lookup_row, ("waf_json.transaction.messages.message", "__fallback_waf_messages"))
    )
    severities = parse_multi_value(
        serialize_multi_value(
            [
                first_non_empty(lookup_row, ("waf_json.transaction.messages.details.severity", "event.severity", "__fallback_severities")),
            ]
        )
    )
    engine_modes = parse_multi_value(
        first_non_empty(lookup_row, ("waf_json.transaction.producer.secrules_engine", "__fallback_engine_modes"))
    )
    event_actions = parse_multi_value(first_non_empty(lookup_row, ("event.action",)))
    event_outcomes = parse_multi_value(first_non_empty(lookup_row, ("event.outcome",)))
    unique_id = first_non_empty(lookup_row, ("waf_json.transaction.unique_id", "waf_json.request_id", "__fallback_unique_id"))

    return ParsedRow(
        row_index=row_index,
        timestamp=timestamp,
        timestamp_text=timestamp.isoformat() if timestamp else timestamp_raw,
        source_ip_actual=source_ip_actual,
        claimed_ip_header=claimed_ip_header,
        claimed_ip_mode=claimed_ip_mode,
        user_agent=user_agent,
        method=method,
        path=path,
        url_original=url_original,
        query_string=query_string,
        body_preview=body_preview,
        status_code=status_code,
        path_scope=classify_path_scope(path),
        unique_id=unique_id,
        rule_ids=rule_ids,
        rule_names=rule_names,
        waf_messages=waf_messages,
        severities=severities,
        engine_modes=engine_modes,
        event_actions=event_actions,
        event_outcomes=event_outcomes,
    )


def merge_request_rows(rows: list[ParsedRow]) -> list[dict[str, object]]:
    grouped: dict[str, list[ParsedRow]] = defaultdict(list)
    for row in rows:
        signature = build_request_signature(row)
        grouped[signature].append(row)

    merged_requests: list[dict[str, object]] = []
    for signature, group_rows in grouped.items():
        group_rows.sort(key=lambda item: (item.timestamp or datetime.min.replace(tzinfo=timezone.utc), item.row_index))
        first = group_rows[0]

        merged_requests.append(
            {
                "request_signature": signature,
                "timestamp": first.timestamp,
                "timestamp_text": first.timestamp_text,
                "source_ip_actual": first.source_ip_actual,
                "claimed_ip_header": first.claimed_ip_header,
                "claimed_ip_mode": first.claimed_ip_mode,
                "user_agent": first.user_agent,
                "method": first.method,
                "path": first.path,
                "url_original": first.url_original,
                "query_string": first.query_string,
                "body_preview": first.body_preview,
                "status_code": first.status_code,
                "path_scope": first.path_scope,
                "unique_ids": merge_values(group_rows, "unique_id"),
                "rule_ids": merge_values(group_rows, "rule_ids"),
                "rule_names": merge_values(group_rows, "rule_names"),
                "waf_messages": merge_values(group_rows, "waf_messages"),
                "severities": merge_values(group_rows, "severities"),
                "engine_modes": merge_values(group_rows, "engine_modes"),
                "event_actions": merge_values(group_rows, "event_actions"),
                "event_outcomes": merge_values(group_rows, "event_outcomes"),
                "merged_row_count": len(group_rows),
                "raw_row_indexes": [row.row_index for row in group_rows],
            }
        )

    merged_requests.sort(
        key=lambda item: (
            item["timestamp"] or datetime.min.replace(tzinfo=timezone.utc),
            str(item["path"]),
            str(item["method"]),
        )
    )
    return merged_requests


def build_sessions(
    merged_requests: list[dict[str, object]],
    session_window_minutes: int,
) -> list[dict[str, object]]:
    session_groups: dict[tuple[str, str], list[dict[str, object]]] = defaultdict(list)
    session_meta: dict[tuple[str, str], dict[str, str]] = {}

    for request in merged_requests:
        session_id, bucket_start = make_session_key(
            source_ip_actual=str(request["source_ip_actual"]),
            user_agent=str(request["user_agent"]),
            timestamp=request["timestamp"] if isinstance(request["timestamp"], datetime) else None,
            session_window_minutes=session_window_minutes,
        )
        key = (session_id, bucket_start)
        session_groups[key].append(request)
        session_meta[key] = {
            "session_id": session_id,
            "bucket_start": bucket_start,
            "source_ip_actual": str(request["source_ip_actual"]),
            "user_agent": str(request["user_agent"]),
        }

    sessions: list[dict[str, object]] = []
    for key, requests in session_groups.items():
        requests.sort(
            key=lambda item: (
                item["timestamp"] or datetime.min.replace(tzinfo=timezone.utc),
                str(item["path"]),
                str(item["method"]),
            )
        )
        meta = session_meta[key]
        start_time = requests[0]["timestamp_text"] if requests else ""
        end_time = requests[-1]["timestamp_text"] if requests else ""

        status_counter = Counter()
        distinct_paths = set()
        all_rule_ids: list[str] = []
        for request in requests:
            status = str(request["status_code"])
            if status.startswith("2"):
                status_counter["2xx"] += 1
            elif status.startswith("3"):
                status_counter["3xx"] += 1
            elif status.startswith("4"):
                status_counter["4xx"] += 1
            elif status.startswith("5"):
                status_counter["5xx"] += 1
            else:
                status_counter["other"] += 1
            distinct_paths.add(str(request["path"]))
            all_rule_ids.extend(request["rule_ids"])

        session_requests = []
        for step_no, request in enumerate(requests, start=1):
            session_requests.append(
                {
                    "step": step_no,
                    "timestamp": request["timestamp_text"],
                    "method": request["method"],
                    "path": request["path"],
                    "path_scope": request["path_scope"],
                    "status": request["status_code"],
                    "request_signature": request["request_signature"],
                    "query_string": request["query_string"],
                    "body_preview": request["body_preview"],
                    "rule_ids": request["rule_ids"],
                    "waf_messages": request["waf_messages"],
                    "waf_message_count": len(request["waf_messages"]),
                }
            )

        sessions.append(
            {
                "session_id": meta["session_id"],
                "intent_class": None,
                "intent_score": None,
                "bucket_start": meta["bucket_start"],
                "source_ip_actual": meta["source_ip_actual"],
                "user_agent": meta["user_agent"],
                "request_count": len(requests),
                "distinct_path_count": len(distinct_paths),
                "start_time": start_time,
                "end_time": end_time,
                "session_features": {
                    "status_2xx": status_counter["2xx"],
                    "status_3xx": status_counter["3xx"],
                    "status_4xx": status_counter["4xx"],
                    "status_5xx": status_counter["5xx"],
                    "status_other": status_counter["other"],
                    "detected_rule_count": len(all_rule_ids),
                    "distinct_rule_count": len(set(all_rule_ids)),
                },
                "requests": session_requests,
            }
        )

    sessions.sort(key=lambda item: (item["start_time"], item["session_id"]))
    return sessions


def write_requests_csv(output_path: Path, merged_requests: list[dict[str, object]], session_map: dict[str, str]) -> None:
    fieldnames = [
        "session_id",
        "request_signature",
        "timestamp",
        "source_ip_actual",
        "claimed_ip_header",
        "claimed_ip_mode",
        "user_agent",
        "method",
        "path",
        "path_scope",
        "url_original",
        "query_string",
        "body_preview",
        "status_code",
        "rule_ids",
        "rule_names",
        "waf_messages",
        "severities",
        "engine_modes",
        "event_actions",
        "event_outcomes",
        "unique_ids",
        "merged_row_count",
        "raw_row_indexes",
    ]
    with output_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for request in merged_requests:
            writer.writerow(
                {
                    "session_id": session_map.get(str(request["request_signature"]), ""),
                    "request_signature": request["request_signature"],
                    "timestamp": request["timestamp_text"],
                    "source_ip_actual": request["source_ip_actual"],
                    "claimed_ip_header": request["claimed_ip_header"],
                    "claimed_ip_mode": request["claimed_ip_mode"],
                    "user_agent": request["user_agent"],
                    "method": request["method"],
                    "path": request["path"],
                    "path_scope": request["path_scope"],
                    "url_original": request["url_original"],
                    "query_string": request["query_string"],
                    "body_preview": request["body_preview"],
                    "status_code": request["status_code"],
                    "rule_ids": serialize_multi_value(request["rule_ids"]),
                    "rule_names": serialize_multi_value(request["rule_names"]),
                    "waf_messages": serialize_multi_value(request["waf_messages"]),
                    "severities": serialize_multi_value(request["severities"]),
                    "engine_modes": serialize_multi_value(request["engine_modes"]),
                    "event_actions": serialize_multi_value(request["event_actions"]),
                    "event_outcomes": serialize_multi_value(request["event_outcomes"]),
                    "unique_ids": serialize_multi_value(request["unique_ids"]),
                    "merged_row_count": request["merged_row_count"],
                    "raw_row_indexes": serialize_multi_value(str(index) for index in request["raw_row_indexes"]),
                }
            )


def write_sessions_jsonl(output_path: Path, sessions: list[dict[str, object]]) -> None:
    with output_path.open("w", encoding="utf-8") as handle:
        for session in sessions:
            handle.write(json.dumps(session, ensure_ascii=False) + "\n")


def parse_args() -> argparse.Namespace:
    script_dir = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(
        description="Temporary parser for exported WAF CSV. Produces a reduced request CSV and a session JSONL.",
    )
    parser.add_argument(
        "--input",
        default=str(script_dir / "waf_log_260320.csv"),
        help="Path to the raw exported WAF CSV.",
    )
    parser.add_argument(
        "--output-dir",
        default=str(script_dir / "out"),
        help="Directory for parsed outputs.",
    )
    parser.add_argument(
        "--session-window-minutes",
        type=int,
        default=20,
        help="Temporary session bucket size in minutes.",
    )
    parser.add_argument(
        "--body-preview-length",
        type=int,
        default=280,
        help="Maximum length of request body preview kept in the reduced outputs.",
    )
    parser.add_argument(
        "--business-only",
        action="store_true",
        help="Keep only business API paths: /api/auth, /api/public, /api/lms, /api/board.",
    )
    parser.add_argument(
        "--exclude-rule",
        action="append",
        default=list(DEFAULT_EXCLUDED_RULES),
        help="Rule ID to exclude from normalized detection fields. Repeat to exclude multiple rules.",
    )
    return parser.parse_args()


def main() -> int:
    csv.field_size_limit(FIELD_SIZE_LIMIT)
    args = parse_args()

    input_path = Path(args.input).resolve()
    output_dir = Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    if not input_path.exists():
        print(f"[error] input file not found: {input_path}", file=sys.stderr)
        return 1

    excluded_rules = {normalize_value(rule) for rule in args.exclude_rule if normalize_value(rule)}
    parsed_rows: list[ParsedRow] = []

    with input_path.open("r", encoding="utf-8-sig", errors="replace", newline="") as handle:
        reader = csv.DictReader(handle)
        for row_index, row in enumerate(reader, start=1):
            parsed = parse_row(
                row_index=row_index,
                row=row,
                body_preview_length=args.body_preview_length,
                excluded_rules=excluded_rules,
            )
            if args.business_only and parsed.path_scope != "business":
                continue
            if not parsed.path:
                continue
            parsed_rows.append(parsed)

    merged_requests = merge_request_rows(parsed_rows)
    sessions = build_sessions(merged_requests, session_window_minutes=args.session_window_minutes)

    session_map: dict[str, str] = {}
    for session in sessions:
        for request in session["requests"]:
            session_map[str(request["request_signature"])] = str(session["session_id"])

    input_stem = input_path.stem
    requests_output_path = output_dir / f"{input_stem}.parsed_requests.csv"
    sessions_output_path = output_dir / f"{input_stem}.session_dataset.jsonl"

    write_requests_csv(requests_output_path, merged_requests, session_map)
    write_sessions_jsonl(sessions_output_path, sessions)

    rule_counter = Counter()
    for request in merged_requests:
        rule_counter.update(request["rule_ids"])

    print(f"[done] input: {input_path}")
    print(f"[done] reduced requests csv: {requests_output_path}")
    print(f"[done] session dataset jsonl: {sessions_output_path}")
    print(f"[stats] raw rows kept: {len(parsed_rows)}")
    print(f"[stats] merged requests: {len(merged_requests)}")
    print(f"[stats] sessions: {len(sessions)}")
    print(f"[stats] top rule ids: {rule_counter.most_common(10)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
