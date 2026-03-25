from __future__ import annotations

import argparse
import csv
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


@dataclass(frozen=True)
class Case:
    case_id: str
    endpoint_group: str
    path: str
    case_class: str
    before_expected: str
    after_expected: str
    query_suffix: str

    @property
    def request_suffix(self) -> str:
        return f"{self.path}{self.query_suffix}"


@dataclass(frozen=True)
class StageSummary:
    name: str
    total_cases: int
    waf_fp_count: int
    waf_fp_rate: float
    allowed_count: int
    app_reject_count: int
    transport_fail_count: int


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Compare false-positive metrics for the 20-route search JMX dataset.")
    parser.add_argument("--dataset", required=True, help="CSV dataset used by the JMX plan.")
    parser.add_argument("--before", help="Baseline JTL file.")
    parser.add_argument("--after", help="Post-rule JTL file.")
    parser.add_argument("--expected-only", action="store_true", help="Print only the planned before/after metrics from the dataset.")
    return parser.parse_args()


def load_cases(dataset_path: Path) -> list[Case]:
    with dataset_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        return [
            Case(
                case_id=row["case_id"],
                endpoint_group=row["endpoint_group"],
                path=row["path"],
                case_class=row["case_class"],
                before_expected=row["before_expected"],
                after_expected=row["after_expected"],
                query_suffix=row["query_suffix"],
            )
            for row in reader
        ]


def summarize_expected(cases: Iterable[Case], stage: str) -> StageSummary:
    cases = list(cases)
    expected_attr = "before_expected" if stage == "before" else "after_expected"
    expected_values = [getattr(case, expected_attr) for case in cases]
    waf_fp_count = sum(1 for value in expected_values if value == "waf_block")
    allowed_count = sum(1 for value in expected_values if value == "pass")
    return StageSummary(
        name=f"expected-{stage}",
        total_cases=len(cases),
        waf_fp_count=waf_fp_count,
        waf_fp_rate=(waf_fp_count / len(cases)) if cases else 0.0,
        allowed_count=allowed_count,
        app_reject_count=0,
        transport_fail_count=0,
    )


def load_jtl_rows(jtl_path: Path) -> list[dict[str, str]]:
    with jtl_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        return [row for row in reader if row.get("label") == "FP Search Route Case"]


def match_case_rows(cases: Iterable[Case], rows: Iterable[dict[str, str]]) -> list[tuple[Case, dict[str, str] | None]]:
    rows = list(rows)
    matched: list[tuple[Case, dict[str, str] | None]] = []
    for case in cases:
        row = next((item for item in rows if (item.get("URL") or "").endswith(case.request_suffix)), None)
        matched.append((case, row))
    return matched


def summarize_actual(stage_name: str, cases: Iterable[Case], rows: Iterable[dict[str, str]]) -> StageSummary:
    matched = match_case_rows(cases, rows)
    waf_fp_count = 0
    allowed_count = 0
    app_reject_count = 0
    transport_fail_count = 0

    for _, row in matched:
        if row is None:
            transport_fail_count += 1
            waf_fp_count += 1
            continue

        response_code = row.get("responseCode", "")
        if response_code.startswith("Non HTTP response code"):
            transport_fail_count += 1
            waf_fp_count += 1
        elif response_code == "403":
            waf_fp_count += 1
        elif response_code == "400":
            app_reject_count += 1
        elif response_code.startswith("2"):
            allowed_count += 1

    total_cases = len(list(cases))
    return StageSummary(
        name=stage_name,
        total_cases=total_cases,
        waf_fp_count=waf_fp_count,
        waf_fp_rate=(waf_fp_count / total_cases) if total_cases else 0.0,
        allowed_count=allowed_count,
        app_reject_count=app_reject_count,
        transport_fail_count=transport_fail_count,
    )


def print_summary(summary: StageSummary) -> None:
    print(summary.name)
    print(f"  total_cases          : {summary.total_cases}")
    print(f"  waf_fp_count         : {summary.waf_fp_count}")
    print(f"  waf_fp_rate          : {summary.waf_fp_rate:.2%}")
    print(f"  allowed_count        : {summary.allowed_count}")
    print(f"  app_reject_count     : {summary.app_reject_count}")
    print(f"  transport_fail_count : {summary.transport_fail_count}")


def print_delta(before: StageSummary, after: StageSummary) -> None:
    print("delta")
    print(f"  waf_fp_count         : {before.waf_fp_count} -> {after.waf_fp_count}")
    print(f"  waf_fp_rate          : {before.waf_fp_rate:.2%} -> {after.waf_fp_rate:.2%}")
    print(f"  allowed_count        : {before.allowed_count} -> {after.allowed_count}")
    print(f"  app_reject_count     : {before.app_reject_count} -> {after.app_reject_count}")
    print(f"  transport_fail_count : {before.transport_fail_count} -> {after.transport_fail_count}")


def main() -> None:
    args = parse_args()
    dataset_path = Path(args.dataset)
    cases = load_cases(dataset_path)

    if args.expected_only:
        before = summarize_expected(cases, "before")
        after = summarize_expected(cases, "after")
        print_summary(before)
        print_summary(after)
        print_delta(before, after)
        return

    if not args.before or not args.after:
        raise SystemExit("--before and --after are required unless --expected-only is used.")

    before_rows = load_jtl_rows(Path(args.before))
    after_rows = load_jtl_rows(Path(args.after))

    before = summarize_actual("actual-before", cases, before_rows)
    after = summarize_actual("actual-after", cases, after_rows)
    print_summary(before)
    print_summary(after)
    print_delta(before, after)


if __name__ == "__main__":
    main()
