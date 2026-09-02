"""Validate external-indicators.json independently from foundation statistics."""
from __future__ import annotations

import argparse
import re
from pathlib import Path
from typing import Any

from external_indicators_common import ROOT, load_config, load_data, numeric, utc_now, write_json


MONTH = re.compile(r"^\d{4}-(0[1-9]|1[0-2])$")
QUARTER = re.compile(r"^\d{4}-Q[1-4]$")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--report", default=None)
    args = parser.parse_args()
    config, checks = load_config(), []
    data = load_data(config)

    def check(name: str, passed: bool, detail: Any = None, severity: str = "error") -> None:
        checks.append({"name": name, "passed": bool(passed), "severity": severity, "detail": detail})

    monthly = data.get("monthly", {})
    expected_monthly = {
        "smallBusinessBsi": config["monthly"]["smallBusinessBsi"]["acceptedUnits"],
        "smeLoanRate": config["monthly"]["smeLoanRate"]["acceptedUnits"],
        "baseRateMonthEnd": config["monthly"]["baseRate"]["acceptedUnits"],
    }
    for key, expected_units in expected_monthly.items():
        rows = monthly.get(key, [])
        periods = [row.get("period") for row in rows]
        check(f"{key}: duplicate periods", len(periods) == len(set(periods)), periods)
        check(f"{key}: monthly period format", all(isinstance(value, str) and MONTH.fullmatch(value) for value in periods), periods)
        check(f"{key}: numeric values", all(isinstance(row.get("value"), (int, float)) and not isinstance(row.get("value"), bool) for row in rows))
        check(f"{key}: units", all(row.get("unit") in expected_units for row in rows), sorted({row.get("unit") for row in rows}))
        check(f"{key}: source", all(bool(row.get("source")) for row in rows))
    check("smallBusinessBsi: 부산 scope", all(row.get("region") == "부산" for row in monthly.get("smallBusinessBsi", [])))
    check("smeLoanRate: 전국 scope", all(row.get("scope") == "전국" for row in monthly.get("smeLoanRate", [])))
    base_events = data.get("baseRateEvents", [])
    event_dates = [row.get("effectiveDate") for row in base_events]
    check("baseRateEvents: ordered unique dates", event_dates == sorted(set(event_dates)), event_dates)
    check("baseRateEvents: actual changes only", all(index == 0 or row.get("value") != base_events[index - 1].get("value") for index, row in enumerate(base_events)))
    check("baseRateEvents: latest matches monthly snapshot", bool(base_events) and bool(monthly.get("baseRateMonthEnd")) and base_events[-1].get("value") == monthly["baseRateMonthEnd"][-1].get("value"))

    quarter_rows = data.get("quarterly", {}).get("busanSmallBusiness", [])
    periods = [row.get("period") for row in quarter_rows]
    check("quarterly: duplicate periods", len(periods) == len(set(periods)), periods)
    check("quarterly: period format", all(isinstance(value, str) and QUARTER.fullmatch(value) for value in periods), periods)
    check("quarterly: 부산 전체 scope", all(row.get("region") == "부산 전체" for row in quarter_rows))
    check("quarterly: official 부산 total used", all(row.get("aggregationBasis") == "official_busan_total" for row in quarter_rows))
    for field in ("businessCount", "salesAmount", "startupRate", "closureRate"):
        check(f"quarterly: {field} numeric", all(isinstance(row.get(field), (int, float)) and not isinstance(row.get(field), bool) for row in quarter_rows))
        check(f"quarterly: {field} source reconciliation", all(row.get("sourceValues", {}).get(field) == row.get(field) for row in quarter_rows))
    check("quarterly: units", all(row.get("units") == {"businessCount": "개", "salesAmount": "백만원", "startupRate": "%", "closureRate": "%"} for row in quarter_rows))
    for rate, numerator in (("startupRate", "startupCount"), ("closureRate", "closureCount")):
        formula_matches = []
        published_matches = []
        for row in quarter_rows:
            inputs = row.get("formulaInputs", {})
            denominator, numerator_value = inputs.get("activityBusinessCount"), inputs.get(numerator)
            formula_matches.append(bool(denominator) and abs(row[rate] - numerator_value / denominator * 100) <= 1e-10)
            if row.get("sourceType", {}).get(rate) == "published":
                validation = row.get("publishedRateValidation", {}).get(rate, {})
                published_matches.append(validation.get("displayMatched") is True and abs(validation.get("difference", 1)) <= 1e-10)
        check(f"quarterly: {rate} official formula", all(formula_matches))
        check(f"quarterly: {rate} published reconciliation", all(published_matches), {"publishedPeriods": len(published_matches)})
    check("monthly/quarterly separation", not any(QUARTER.fullmatch(str(row.get("period", ""))) for rows in monthly.values() for row in rows) and not any(MONTH.fullmatch(str(row.get("period", ""))) for row in quarter_rows))
    check("source metadata", all(bool(source.get("provider") and source.get("url")) for source in data.get("sources", {}).values()))

    failed = sum(not item["passed"] and item["severity"] == "error" for item in checks)
    warnings = sum(not item["passed"] and item["severity"] == "warning" for item in checks)
    report = {"schemaVersion": "1.0.0", "validatedAt": utc_now(), "status": "passed" if not failed else "failed",
              "summary": {"passed": sum(item["passed"] for item in checks), "failed": failed, "warnings": warnings}, "checks": checks}
    write_json(ROOT / (args.report or config["validationOutput"]), report)
    print(f"external indicators validation: {report['status']} ({report['summary']})")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
