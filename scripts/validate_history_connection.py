#!/usr/bin/env python3
"""Validate dashboard-history values exposed by the expanded UI without modifying data."""

from __future__ import annotations

import json
from collections import defaultdict
from decimal import Decimal
from pathlib import Path


METRICS = (
    "new_guarantee_count",
    "new_guarantee_amount",
    "accident_net_count",
    "accident_net_amount",
    "guarantee_balance_count",
    "guarantee_balance_amount",
)
DIMENSIONS = ("district", "industry", "age", "tenure")
DISPLAY_MAP = {
    "newGuarantee": "new_guarantee_amount",
    "accidents": "accident_net_amount",
    "balance": "guarantee_balance_amount",
}


def dec(value) -> Decimal:
    return Decimal(str(value or 0))


def main() -> None:
    dashboard = json.loads(Path("data/dashboard-data.json").read_text(encoding="utf-8"))
    history = json.loads(Path("data/generated/dashboard-history.json").read_text(encoding="utf-8"))
    report = json.loads(Path("data/generated/validation-report.json").read_text(encoding="utf-8"))
    config = json.loads(Path("config/data-standardization.json").read_text(encoding="utf-8"))
    failures: list[dict[str, object]] = []
    checks = 0

    if dashboard["meta"]["sourceSha256"] != history["meta"]["sourceSha256"]:
        failures.append({"scope": "meta", "reason": "sourceSha256 mismatch"})
    checks += 1

    monthly = {row["period"]: row for row in history["monthly"]}
    regional_scope = report["regional_scope"]
    for period, source in monthly.items():
        for metric in METRICS:
            checks += 1
            scoped_total = sum(
                dec(regional_scope[scope].get(period, {}).get(metric, 0))
                for scope in ("busan_16_districts", "outside_busan", "busan_other")
            )
            if scoped_total != dec(source[metric]):
                failures.append({
                    "scope": "regional_reconciliation",
                    "period": period,
                    "metric": metric,
                    "monthly": str(source[metric]),
                    "regional_sum": str(scoped_total),
                })
    for row in dashboard["monthly"]:
        source = monthly[row["period"]]
        for display_key, history_key in DISPLAY_MAP.items():
            checks += 1
            if dec(row[display_key]) != dec(source[history_key]):
                failures.append({"scope": "monthly", "period": row["period"], "metric": history_key})

    for dimension in DIMENSIONS:
        totals: dict[str, dict[str, Decimal]] = defaultdict(lambda: defaultdict(Decimal))
        for row in history["dimensions"][dimension]:
            for metric in METRICS:
                totals[row["period"]][metric] += dec(row[metric])
        for period, source in monthly.items():
            expected = (
                report["regional_scope"]["busan_16_districts"][period]
                if dimension == "district"
                else source
            )
            for metric in METRICS:
                checks += 1
                if totals[period][metric] != dec(expected[metric]):
                    failures.append({
                        "scope": dimension,
                        "period": period,
                        "metric": metric,
                        "expected": str(expected[metric]),
                        "dimension_sum": str(totals[period][metric]),
                    })

    latest_period = dashboard["monthly"][-1]["period"]
    district_labels = {
        row["label"] for row in history["dimensions"]["district"]
        if row["period"] == latest_period
    }
    checks += 1
    if district_labels != set(config["target_districts"]):
        failures.append({
            "scope": "district_labels",
            "expected": sorted(config["target_districts"]),
            "actual": sorted(district_labels),
        })

    latest = latest_period
    latest_counts = {
        "new_guarantee_count": monthly[latest]["new_guarantee_count"],
        "guarantee_balance_count": monthly[latest]["guarantee_balance_count"],
        "accident_net_count": monthly[latest]["accident_net_count"],
    }
    result = {
        "period_coverage": {"first": dashboard["monthly"][0]["period"], "last": latest, "months": len(monthly)},
        "latest_counts": latest_counts,
        "dimensions": {name: len(history["dimensions"][name]) for name in DIMENSIONS},
        "scope_rules": {
            "district": "부산 16개 구·군",
            "industry_age_tenure_monthly": "전체 지역",
        },
        "check_count": checks,
        "failure_count": len(failures),
        "all_match": not failures,
        "failures": failures[:20],
    }
    print(json.dumps(result, ensure_ascii=False))
    if failures:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
