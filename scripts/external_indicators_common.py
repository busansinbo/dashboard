"""Shared helpers for external indicator collectors and validators."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def read_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + ".tmp")
    with temp.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(value, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    temp.replace(path)


def load_config() -> dict[str, Any]:
    return read_json(ROOT / "config" / "external-indicators.json")


def load_local_env(path: Path | None = None) -> dict[str, str]:
    """Read local secrets without logging values or adding dependencies."""
    env_path = path or ROOT / ".env.local"
    values: dict[str, str] = {}
    if not env_path.exists():
        return values
    for line_number, raw_line in enumerate(env_path.read_text(encoding="utf-8-sig").splitlines(), 1):
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            raise ValueError(f"invalid .env.local entry at line {line_number}")
        name, value = line.split("=", 1)
        name, value = name.strip(), value.strip()
        if value[:1] == value[-1:] and value[:1] in {'"', "'"}:
            value = value[1:-1]
        if name:
            values[name] = value
    return values


def local_secret(name: str) -> str | None:
    """Prefer .env.local for project-local API credentials."""
    value = load_local_env().get(name)
    return value if value and not value.isspace() else None


def load_data(config: dict[str, Any]) -> dict[str, Any]:
    return read_json(ROOT / config["output"])


def append_log(config: dict[str, Any], event: dict[str, Any]) -> None:
    path = ROOT / config["updateLog"]
    log = read_json(path) if path.exists() else {"schemaVersion": "1.0.0", "updatedAt": None, "events": []}
    log["updatedAt"] = utc_now()
    log["events"].append({"at": log["updatedAt"], **event})
    write_json(path, log)


def numeric(value: Any) -> float:
    if value is None or isinstance(value, bool):
        raise ValueError("numeric value is missing")
    text = str(value).strip().replace(",", "").replace("%", "")
    if not text or text in {"-", "—", "…", ".."}:
        raise ValueError("numeric value is missing")
    return float(text)


def period_month(value: Any) -> str:
    digits = "".join(ch for ch in str(value) if ch.isdigit())
    if len(digits) < 6:
        raise ValueError(f"invalid monthly period: {value}")
    year, month = int(digits[:4]), int(digits[4:6])
    if not 1 <= month <= 12:
        raise ValueError(f"invalid monthly period: {value}")
    return f"{year:04d}-{month:02d}"


def period_quarter(value: Any) -> str:
    text = str(value).strip().upper().replace(" ", "")
    korean_match = __import__("re").search(r"(\d{4})[.년]?(\d)(?:/4)?분기", text)
    if korean_match:
        year, quarter = map(int, korean_match.groups())
        return f"{year:04d}-Q{quarter}"
    digits = "".join(ch for ch in text if ch.isdigit())
    if "Q" in text:
        year, quarter = int(digits[:4]), int(digits[-1])
    elif "분기" in text:
        year, quarter = int(digits[:4]), int(digits[-1])
    elif len(digits) == 5:
        year, quarter = int(digits[:4]), int(digits[-1])
    elif len(digits) >= 6:
        year, month = int(digits[:4]), int(digits[4:6])
        quarter = (month - 1) // 3 + 1
    else:
        raise ValueError(f"invalid quarterly period: {value}")
    if not 1 <= quarter <= 4:
        raise ValueError(f"invalid quarterly period: {value}")
    return f"{year:04d}-Q{quarter}"


def merge_period_rows(existing: list[dict[str, Any]], incoming: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    merged = {row["period"]: row for row in existing}
    changes: list[dict[str, Any]] = []
    for row in incoming:
        previous = merged.get(row["period"])
        if previous != row:
            changes.append({"period": row["period"], "action": "update" if previous else "insert", "before": previous, "after": row})
        merged[row["period"]] = row
    return [merged[key] for key in sorted(merged)], changes
