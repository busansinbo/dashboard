#!/usr/bin/env python3
"""Reconcile every dashboard KPI and graph point with standardized source aggregates."""

from __future__ import annotations

import argparse
import calendar
import json
from collections import defaultdict
from datetime import date, datetime, timezone
from decimal import Decimal
from pathlib import Path
from typing import Any


AMOUNT_MAP = {
    "newGuarantee": "new_guarantee_amount",
    "accidents": "accident_net_amount",
    "balance": "guarantee_balance_amount",
}
DIMENSIONS = ("district", "industry", "age", "tenure")


def dec(value: Any) -> Decimal:
    if value is None:
        return Decimal("0")
    return Decimal(str(value))


def numeric(value: Decimal) -> int | float:
    return int(value) if value == value.to_integral_value() else float(value)


def round_decimal(value: Decimal, places: int) -> Decimal:
    return value.quantize(Decimal("1").scaleb(-places))


def rate_for_period(period: str, balance: Decimal, monthly_net: list[tuple[str, Decimal]]) -> Decimal | None:
    if balance == 0:
        return None
    year, month = map(int, period.split("-"))
    ytd_net = sum(
        (value for item_period, value in monthly_net if item_period[:4] == period[:4] and item_period <= period),
        Decimal("0"),
    )
    annual_days = Decimal(366 if calendar.isleap(year) else 365)
    month_end = date(year, month, calendar.monthrange(year, month)[1])
    elapsed_days = Decimal(month_end.timetuple().tm_yday)
    return ytd_net / balance * annual_days / elapsed_days * Decimal(100)


def comparison(
    scope: str,
    period: str,
    indicator: str,
    source_raw: Decimal | None,
    dashboard_value: Any,
    label: str | None = None,
    json_decimals: int | None = None,
    screen_decimals: int = 0,
) -> dict[str, Any]:
    if source_raw is None:
        source_comparable = None
        dashboard_decimal = None if dashboard_value is None else dec(dashboard_value)
        difference = None if dashboard_decimal is None else dashboard_decimal
        screen_source = screen_dashboard = screen_difference = None
        raw_rounding_delta = None
    else:
        source_comparable = round_decimal(source_raw, json_decimals) if json_decimals is not None else source_raw
        dashboard_decimal = dec(dashboard_value)
        difference = dashboard_decimal - source_comparable
        raw_rounding_delta = source_comparable - source_raw
        screen_source = round_decimal(source_raw, screen_decimals)
        screen_dashboard = round_decimal(dashboard_decimal, screen_decimals)
        screen_difference = screen_dashboard - screen_source
    return {
        "scope": scope,
        "period": period,
        "label": label,
        "indicator": indicator,
        "unit": "%" if indicator == "accidentRate" else "백만원",
        "source_aggregate_raw": None if source_raw is None else numeric(source_raw),
        "source_comparable": None if source_comparable is None else numeric(source_comparable),
        "dashboard_json_value": dashboard_value,
        "difference": None if difference is None else numeric(difference),
        "difference_is_zero": difference == 0 if difference is not None else dashboard_value is None,
        "json_rounding_decimals": json_decimals,
        "raw_rounding_delta": None if raw_rounding_delta is None else numeric(raw_rounding_delta),
        "screen_display_decimals": screen_decimals,
        "screen_source_rounded": None if screen_source is None else numeric(screen_source),
        "screen_dashboard_rounded": None if screen_dashboard is None else numeric(screen_dashboard),
        "screen_difference": None if screen_difference is None else numeric(screen_difference),
        "screen_difference_is_zero": screen_difference == 0 if screen_difference is not None else dashboard_value is None,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dashboard", type=Path, default=Path("data/dashboard-data.json"))
    parser.add_argument("--history", type=Path, default=Path("data/generated/dashboard-history.json"))
    parser.add_argument("--report", type=Path, default=Path("data/generated/validation-report.json"))
    args = parser.parse_args()

    dashboard = json.loads(args.dashboard.read_text(encoding="utf-8"))
    history = json.loads(args.history.read_text(encoding="utf-8"))
    report = json.loads(args.report.read_text(encoding="utf-8"))

    history_monthly = {row["period"]: row for row in history["monthly"]}
    checks: list[dict[str, Any]] = []

    # Every monthly KPI/graph point.
    monthly_net = [
        (period, dec(row["accident_net_amount"])) for period, row in sorted(history_monthly.items())
    ]
    for row in dashboard["monthly"]:
        period = row["period"]
        source = history_monthly[period]
        for dashboard_key, source_key in AMOUNT_MAP.items():
            checks.append(comparison(
                "monthly", period, dashboard_key, dec(source[source_key]), row[dashboard_key],
                screen_decimals=0,
            ))
        raw_rate = rate_for_period(period, dec(source["guarantee_balance_amount"]), monthly_net)
        checks.append(comparison(
            "monthly", period, "accidentRate", raw_rate, row["accidentRate"],
            json_decimals=4, screen_decimals=1,
        ))

    # Every latest-period breakdown graph/table point.
    latest = dashboard["monthly"][-1]["period"]
    for dimension in DIMENSIONS:
        history_rows = history["dimensions"][dimension]
        by_key = {(row["period"], row["label"]): row for row in history_rows}
        net_by_label: dict[str, list[tuple[str, Decimal]]] = defaultdict(list)
        for row in history_rows:
            net_by_label[row["label"]].append((row["period"], dec(row["accident_net_amount"])))
        for row in dashboard[dimension]:
            label = row["label"]
            source = by_key[(latest, label)]
            for dashboard_key, source_key in AMOUNT_MAP.items():
                checks.append(comparison(
                    dimension, latest, dashboard_key, dec(source[source_key]), row[dashboard_key],
                    label=label, screen_decimals=0,
                ))
            raw_rate = rate_for_period(
                latest,
                dec(source["guarantee_balance_amount"]),
                net_by_label[label],
            )
            checks.append(comparison(
                dimension, latest, "accidentRate", raw_rate, row["accidentRate"],
                label=label, json_decimals=4, screen_decimals=1,
            ))

    zero_failures = [item for item in checks if not item["difference_is_zero"]]
    screen_failures = [item for item in checks if not item["screen_difference_is_zero"]]
    by_scope: dict[str, dict[str, int | bool]] = {}
    for scope in ("monthly", *DIMENSIONS):
        scoped = [item for item in checks if item["scope"] == scope]
        by_scope[scope] = {
            "check_count": len(scoped),
            "difference_zero_count": sum(item["difference_is_zero"] for item in scoped),
            "all_difference_zero": all(item["difference_is_zero"] for item in scoped),
            "all_screen_difference_zero": all(item["screen_difference_is_zero"] for item in scoped),
        }

    report["dashboard_value_reconciliation"] = {
        "verified_at": datetime.now(timezone.utc).isoformat(),
        "source_basis": "dashboard-history.json 집계값; validation-report overall에서 원본 Excel과 건수·합계 일치 확인",
        "period_coverage": {
            "first": dashboard["monthly"][0]["period"],
            "last": latest,
            "months": len(dashboard["monthly"]),
        },
        "unit_and_rounding": {
            "amount_source_unit": "백만원",
            "amount_json_conversion": "단위 변환 및 반올림 없음; 원본 집계 정밀도 유지",
            "amount_screen_display": "소수점 0자리로 반올림 표시",
            "rate_json_conversion": "공식 계산 결과를 소수점 4자리로 반올림",
            "rate_screen_display": "소수점 1자리로 반올림 표시",
            "rate_formula": "(연초~기준월 사고순증금액 누계 / 당월말 보증잔액) × (365 또는 윤년 366 / 1월1일~기준월말 경과일수) × 100",
        },
        "excluded_indicators": dashboard["meta"].get("excludedIndicators", []),
        "summary": {
            "total_checks": len(checks),
            "difference_zero_count": sum(item["difference_is_zero"] for item in checks),
            "screen_difference_zero_count": sum(item["screen_difference_is_zero"] for item in checks),
            "all_difference_zero": not zero_failures,
            "all_screen_difference_zero": not screen_failures,
            "failure_count": len(zero_failures),
            "screen_failure_count": len(screen_failures),
        },
        "by_scope": by_scope,
        "checks": checks,
    }

    args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report["dashboard_value_reconciliation"]["summary"], ensure_ascii=False))
    if zero_failures or screen_failures:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
