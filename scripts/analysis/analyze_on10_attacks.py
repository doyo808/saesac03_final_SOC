import csv
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SECURITY_DOCS = ROOT / "docs" / "security"
INTERP = SECURITY_DOCS / "datasets" / "jmx-500-interpretation-full.csv"
ON = SECURITY_DOCS / "jmeter" / "scenarios" / "load" / "500" / "result" / "FP_BOARD_SEARCH_URL_EXPANDED_500_V2-results_on.jtl"
ON10 = SECURITY_DOCS / "jmeter" / "scenarios" / "load" / "500" / "result" / "FP_BOARD_SEARCH_URL_EXPANDED_500_V2-results_on10.jtl"

GROUP_ORDER = [
    "Board Search Mixed",
    "URL Typo Mixed",
    "Board Search Expanded",
    "Public Search Location",
    "Auth Search Location",
    "Public Post Feature",
    "Auth Post Feature",
]


def load_csv(path: Path):
    with path.open(encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def rows_for_group(rows, group_name):
    if group_name == "Board Search Mixed":
        return [r for r in rows if "Board Search Mixed Thread Group" in r["threadName"] and not r["label"].startswith("Login ")]
    if group_name == "URL Typo Mixed":
        return [r for r in rows if "URL Typo Mixed Thread Group" in r["threadName"]]
    if group_name == "Board Search Expanded":
        return [r for r in rows if "Board Search Expanded Thread Group" in r["threadName"] and not r["label"].startswith("Login ")]
    if group_name == "Public Search Location":
        return [r for r in rows if "Public Search Location Thread Group" in r["threadName"]]
    if group_name == "Auth Search Location":
        return [r for r in rows if "Auth Search Location Thread Group" in r["threadName"] and not r["label"].startswith("Login ")]
    if group_name == "Public Post Feature":
        return [r for r in rows if "Public Post Feature Thread Group" in r["threadName"]]
    if group_name == "Auth Post Feature":
        return [
            r for r in rows
            if "Auth Post Feature Thread Group" in r["threadName"]
            and not r["label"].startswith("Login ")
            and not r["label"].startswith("LMS Setup ")
        ]
    raise ValueError(group_name)


def flatten_main_rows(path: Path):
    rows = load_csv(path)
    flat = []
    for group in GROUP_ORDER:
        flat.extend(rows_for_group(rows, group))
    return flat


interp_rows = load_csv(INTERP)
on_rows = flatten_main_rows(ON)
on10_rows = flatten_main_rows(ON10)

if not (len(interp_rows) == len(on_rows) == len(on10_rows) == 500):
    raise RuntimeError(f"count mismatch interp={len(interp_rows)} on={len(on_rows)} on10={len(on10_rows)}")

merged = []
for interp, on, on10 in zip(interp_rows, on_rows, on10_rows):
    row = dict(interp)
    row["observed_on"] = on["responseCode"]
    row["observed_on10"] = on10["responseCode"]
    merged.append(row)


attack_rows = [r for r in merged if r["intent_class"] == "attack"]


def blocked(code: str) -> bool:
    return code in {"400", "401", "403", "404"}


print("summary")
print(f"attack_total|{len(attack_rows)}")
print(f"blocked_on|{sum(1 for r in attack_rows if blocked(r['observed_on']))}")
print(f"blocked_on10|{sum(1 for r in attack_rows if blocked(r['observed_on10']))}")
print(f"missed_on|{sum(1 for r in attack_rows if r['observed_on'] in {'200','201','204'})}")
print(f"missed_on10|{sum(1 for r in attack_rows if r['observed_on10'] in {'200','201','204'})}")
print(f"expected_match_on|{sum(1 for r in attack_rows if r['expected_code'] == r['observed_on'])}")
print(f"expected_match_on10|{sum(1 for r in attack_rows if r['expected_code'] == r['observed_on10'])}")

print("by_group")
for group in GROUP_ORDER:
    group_rows = [r for r in attack_rows if r["group_name"] == group]
    if not group_rows:
        continue
    print(
        f"{group}|total={len(group_rows)}|blocked_on={sum(1 for r in group_rows if blocked(r['observed_on']))}"
        f"|blocked_on10={sum(1 for r in group_rows if blocked(r['observed_on10']))}"
        f"|missed_on={sum(1 for r in group_rows if r['observed_on'] in {'200','201','204'})}"
        f"|missed_on10={sum(1 for r in group_rows if r['observed_on10'] in {'200','201','204'})}"
    )

print("transition_counts")
for key, value in Counter(f"{r['observed_on']}->{r['observed_on10']}" for r in attack_rows if r["observed_on"] != r["observed_on10"]).most_common():
    print(f"{key}|{value}")

print("missed_cases_on10")
for r in attack_rows:
    if r["observed_on10"] in {"200", "201", "204"}:
        print(
            "CASE|{case_id}|{group_name}|{attack_family}|{target}|{payload_or_query}|expected={expected_code}|on={observed_on}|on10={observed_on10}".format(
                **r
            )
        )

print("improved_attack_blocking_on10")
for r in attack_rows:
    if r["observed_on"] in {"200", "201", "204"} and blocked(r["observed_on10"]):
        print(
            "CASE|{case_id}|{group_name}|{attack_family}|{target}|{payload_or_query}|expected={expected_code}|on={observed_on}|on10={observed_on10}".format(
                **r
            )
        )
