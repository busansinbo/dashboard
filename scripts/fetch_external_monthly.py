"""Fetch KOSIS/ECOS monthly external indicators using environment-held API keys."""
from __future__ import annotations

import argparse
import calendar
import json
import urllib.parse
import urllib.request
from datetime import date, datetime
from typing import Any

from external_indicators_common import ROOT, append_log, load_config, load_data, local_secret, merge_period_rows, numeric, period_month, utc_now, write_json


def request_json(url: str) -> dict[str, Any] | list[dict[str, Any]]:
    request = urllib.request.Request(url, headers={"User-Agent": "busansinbo-dashboard/1.0"})
    with urllib.request.urlopen(request, timeout=45) as response:
        return json.loads(response.read().decode("utf-8"))


def current_month() -> str:
    return date.today().strftime("%Y%m")


def kosis_bsi(config: dict[str, Any], key: str, end_period: str) -> list[dict[str, Any]]:
    params = {
        "method": "getList", "apiKey": key, "orgId": config["organizationId"], "tblId": config["tableId"],
        "itmId": config["itemCode"], "objL1": config["regionCode"], "format": "json", "jsonVD": "Y",
        "prdSe": config["frequency"], "startPrdDe": config["startPeriod"], "endPrdDe": end_period,
        "outputFields": "ORG_ID TBL_ID TBL_NM NM ITM_ID ITM_NM UNIT_NM PRD_DE DT C1 C1_NM C2 C2_NM".replace(" ", "+")
    }
    url = config["endpoint"] + "?" + urllib.parse.urlencode(params, safe="+")
    payload = request_json(url)
    if isinstance(payload, dict) and payload.get("err"):
        raise RuntimeError(f"KOSIS API error: {payload.get('errMsg', payload['err'])}")
    rows = payload if isinstance(payload, list) else payload.get("data", [])
    accepted = {name.replace(" ", "") for name in config["acceptedItemNames"]}
    selected = []
    for row in rows:
        names = [str(row.get(field, "")) for field in ("NM", "C1_NM", "C2_NM")]
        item = str(row.get("ITM_NM", ""))
        if not any(config["regionName"] in name for name in names) or item.replace(" ", "") not in accepted:
            continue
        selected.append({
            "period": period_month(row.get("PRD_DE")), "value": numeric(row.get("DT")), "unit": row.get("UNIT_NM") or config["unit"],
            "source": "KOSIS", "tableId": config["tableId"], "itemCode": row.get("ITM_ID"),
            "region": "부산", "retrievedAt": utc_now()
        })
    if not selected:
        raise RuntimeError("KOSIS response did not contain the 부산 / 체감실적 BSI series; verify table selectors in config")
    return selected


def ecos_rows(config: dict[str, Any], key: str, start: str, end: str, item_code: str | None = None) -> list[dict[str, Any]]:
    segments = [config["endpoint"], key, "json", "kr", "1", "10000", config["statCode"], config["frequency"], start, end]
    if item_code:
        segments.append(item_code)
    url = "/".join(part.strip("/") for part in segments)
    payload = request_json(url)
    if "RESULT" in payload:
        raise RuntimeError(f"ECOS API error: {payload['RESULT'].get('MESSAGE', payload['RESULT'])}")
    return payload.get("StatisticSearch", {}).get("row", [])


def ecos_loan(config: dict[str, Any], key: str, end_period: str) -> list[dict[str, Any]]:
    accepted = {name.replace(" ", "") for name in config["acceptedItemNames"]}
    rows = ecos_rows(config, key, config["startPeriod"], end_period)
    selected = []
    for row in rows:
        if str(row.get("ITEM_NAME1", "")).replace(" ", "") not in accepted:
            continue
        selected.append({
            "period": period_month(row["TIME"]), "value": numeric(row["DATA_VALUE"]), "unit": row.get("UNIT_NAME") or config["unit"],
            "source": "한국은행 ECOS", "statCode": config["statCode"], "itemCode": row.get("ITEM_CODE1"),
            "scope": "전국", "retrievedAt": utc_now()
        })
    if not selected:
        raise RuntimeError("ECOS response did not contain the 중소기업대출 series")
    return selected


def ecos_base_rate(config: dict[str, Any], key: str, end_period: str) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    end_day = f"{end_period}{calendar.monthrange(int(end_period[:4]), int(end_period[4:]))[1]:02d}"
    rows = ecos_rows(config, key, config["startPeriod"], end_day, config["itemCode"])
    daily = [{
        "effectiveDate": datetime.strptime(str(row["TIME"]), "%Y%m%d").strftime("%Y-%m-%d"), "value": numeric(row["DATA_VALUE"]),
        "unit": row.get("UNIT_NAME") or config["unit"], "source": "한국은행 ECOS", "statCode": config["statCode"],
        "itemCode": config["itemCode"], "retrievedAt": utc_now()
    } for row in rows]
    daily.sort(key=lambda row: row["effectiveDate"])
    # ECOS returns a daily effective-rate series. Preserve only the first
    # observation and actual value changes as policy-rate events.
    events = [row for index, row in enumerate(daily) if index == 0 or row["value"] != daily[index - 1]["value"]]
    monthly = {}
    for event in daily:
        monthly[event["effectiveDate"][:7]] = {"period": event["effectiveDate"][:7], "value": event["value"], "effectiveDate": event["effectiveDate"],
            "unit": event["unit"], "source": event["source"], "statCode": event["statCode"], "itemCode": event["itemCode"], "retrievedAt": event["retrievedAt"]}
    return list(monthly.values()), events


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--end-period", default=current_month(), help="YYYYMM")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    config, data = load_config(), None
    keys = {name: local_secret(env_name) for name, env_name in config["credentials"].items()}
    missing = [config["credentials"][name] for name, value in keys.items() if not value]
    if missing:
        print("Missing environment variables: " + ", ".join(missing))
        return 2
    data = load_data(config)
    bsi = kosis_bsi(config["monthly"]["smallBusinessBsi"], keys["kosis"], args.end_period)
    loan = ecos_loan(config["monthly"]["smeLoanRate"], keys["ecos"], args.end_period)
    base_monthly, base_events = ecos_base_rate(config["monthly"]["baseRate"], keys["ecos"], args.end_period)
    changes = []
    for target, incoming in (("smallBusinessBsi", bsi), ("smeLoanRate", loan), ("baseRateMonthEnd", base_monthly)):
        data["monthly"][target], diff = merge_period_rows(data["monthly"].get(target, []), incoming)
        changes.extend({"indicator": target, **item} for item in diff)
    data["baseRateEvents"] = base_events
    data["generatedAt"] = utc_now()
    periods = [row["period"] for values in data["monthly"].values() for row in values]
    data["latest"]["monthlyPeriod"] = max(periods) if periods else None
    for source in ("smallBusinessBsi", "smeLoanRate", "baseRate"):
        data["sources"][source]["retrievedAt"] = data["generatedAt"]
    if not args.dry_run:
        write_json(ROOT / config["output"], data)
        append_log(config, {"type": "monthly-api", "status": "success", "changes": changes})
    print(json.dumps({"status": "ok", "dryRun": args.dry_run, "changes": len(changes)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
