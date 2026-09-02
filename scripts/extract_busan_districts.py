#!/usr/bin/env python3
"""Extract the 16 Busan districts from a national boundary file.

The source spatial file is read only. The script refuses to guess unmatched
administrative names, missing CRS information, or ambiguous region fields.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path
from typing import Iterable


BUSAN_DISTRICTS = (
    "중구", "서구", "동구", "영도구", "부산진구", "동래구", "남구", "북구",
    "해운대구", "사하구", "금정구", "강서구", "연제구", "수영구", "사상구", "기장군",
)
BUSAN_PROVINCE_NAMES = {"부산", "부산광역시"}
BUSAN_SIG_CODE_PREFIX = "26"
NAME_FIELD_CANDIDATES = ("SIG_KOR_NM", "SGG_NM", "SIG_NM", "district", "name")
PROVINCE_FIELD_CANDIDATES = ("CTP_KOR_NM", "SIDO_NM", "province", "CTP_NM")
CODE_FIELD_CANDIDATES = ("SIG_CD", "SGG_CD", "district_code", "code")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def import_geopandas():
    try:
        import geopandas as gpd
    except ImportError as error:
        raise SystemExit(
            "공간파일 처리 라이브러리가 없습니다. "
            "requirements-spatial.txt를 별도 환경에 설치한 뒤 다시 실행하세요."
        ) from error
    return gpd


def resolve_field(columns: Iterable[str], requested: str | None, candidates: tuple[str, ...], kind: str) -> str | None:
    lookup = {str(column).casefold(): str(column) for column in columns}
    if requested:
        matched = lookup.get(requested.casefold())
        if not matched:
            raise SystemExit(f"지정한 {kind} 속성 {requested!r}을 찾지 못했습니다. 사용 가능 속성: {list(columns)}")
        return matched
    for candidate in candidates:
        if candidate.casefold() in lookup:
            return lookup[candidate.casefold()]
    return None


def validate_shapefile(path: Path) -> None:
    if path.suffix.lower() != ".shp":
        return
    missing = [suffix for suffix in (".dbf", ".shx", ".prj") if not path.with_suffix(suffix).exists()]
    if missing:
        raise SystemExit(f"SHP 구성파일이 누락됐습니다: {', '.join(missing)}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="전국 시군구 SHP 또는 GeoJSON")
    parser.add_argument("--output", type=Path, default=Path("assets/maps/busan-districts.geojson"))
    parser.add_argument("--name-field", help="구군명 속성명. 미지정 시 알려진 후보를 엄격 탐색")
    parser.add_argument("--province-field", help="시도명 속성명")
    parser.add_argument("--code-field", help="시군구 코드 속성명")
    parser.add_argument("--force", action="store_true", help="기존 출력 파일 덮어쓰기")
    args = parser.parse_args()

    source = args.source.resolve()
    output = args.output.resolve()
    if not source.is_file():
        raise SystemExit(f"원본 공간파일을 찾지 못했습니다: {source}")
    if source.suffix.lower() not in {".shp", ".geojson", ".json"}:
        raise SystemExit("지원 형식은 .shp, .geojson, .json입니다.")
    validate_shapefile(source)
    if output.exists() and not args.force:
        raise SystemExit(f"출력 파일이 이미 있습니다. 확인 후 --force를 사용하세요: {output}")

    before_hash = sha256(source)
    gpd = import_geopandas()
    frame = gpd.read_file(source)
    if frame.empty:
        raise SystemExit("원본 공간파일에 Feature가 없습니다.")
    if frame.crs is None:
        raise SystemExit("원본 좌표계(CRS)를 확인할 수 없습니다. CRS가 명시된 파일을 제공해 주세요.")

    name_field = resolve_field(frame.columns, args.name_field, NAME_FIELD_CANDIDATES, "구군명")
    province_field = resolve_field(frame.columns, args.province_field, PROVINCE_FIELD_CANDIDATES, "시도명")
    code_field = resolve_field(frame.columns, args.code_field, CODE_FIELD_CANDIDATES, "시군구 코드")
    if not name_field:
        raise SystemExit(f"구군명 속성을 자동 확인하지 못했습니다. --name-field를 지정하세요. 속성: {list(frame.columns)}")
    if not province_field and not code_field:
        raise SystemExit(
            "부산을 구분할 시도명 또는 시군구 코드 속성이 없습니다. "
            "--province-field 또는 --code-field를 지정하세요."
        )

    if province_field:
        province_values = frame[province_field].astype(str).str.strip()
        busan = frame[province_values.isin(BUSAN_PROVINCE_NAMES)].copy()
        filter_basis = f"{province_field} in {sorted(BUSAN_PROVINCE_NAMES)}"
    else:
        code_values = frame[code_field].astype(str).str.strip()
        busan = frame[code_values.str.startswith(BUSAN_SIG_CODE_PREFIX)].copy()
        filter_basis = f"{code_field} startswith {BUSAN_SIG_CODE_PREFIX}"

    busan["_district_name"] = busan[name_field].astype(str).str.strip()
    actual_names = set(busan["_district_name"])
    expected_names = set(BUSAN_DISTRICTS)
    missing_names = sorted(expected_names - actual_names)
    unexpected_names = sorted(actual_names - expected_names)
    if missing_names or unexpected_names:
        raise SystemExit(
            "부산 구군명이 정확히 매칭되지 않습니다. 임의 보정하지 않았습니다.\n"
            f"누락: {missing_names}\n예상 외: {unexpected_names}\n"
            f"확인된 값: {sorted(actual_names)}"
        )
    if len(busan) != 16:
        duplicates = busan[busan["_district_name"].duplicated(keep=False)]["_district_name"].tolist()
        raise SystemExit(f"부산 Feature 수가 16개가 아닙니다: {len(busan)}개, 중복 후보={duplicates}")
    if busan.geometry.is_empty.any() or busan.geometry.isna().any():
        raise SystemExit("비어 있거나 누락된 구군 geometry가 있습니다.")
    if not busan.geometry.is_valid.all():
        invalid = busan.loc[~busan.geometry.is_valid, "_district_name"].tolist()
        raise SystemExit(f"유효하지 않은 geometry가 있습니다. 임의 수정하지 않았습니다: {invalid}")

    source_crs = str(busan.crs)
    if busan.crs.to_epsg() != 4326:
        busan = busan.to_crs(epsg=4326)
    busan["SIG_KOR_NM"] = busan["_district_name"]
    keep = ["SIG_KOR_NM"]
    if code_field:
        busan["SIG_CD"] = busan[code_field].astype(str).str.strip()
        keep.insert(0, "SIG_CD")
    order = {name: index for index, name in enumerate(BUSAN_DISTRICTS)}
    busan["_order"] = busan["SIG_KOR_NM"].map(order)
    busan = busan.sort_values("_order")[keep + ["geometry"]]

    output.parent.mkdir(parents=True, exist_ok=True)
    busan.to_file(output, driver="GeoJSON", encoding="utf-8")
    if sha256(source) != before_hash:
        output.unlink(missing_ok=True)
        raise SystemExit("원본 공간파일 해시가 작업 전후 달라져 출력을 제거했습니다.")

    written = gpd.read_file(output)
    if len(written) != 16 or set(written["SIG_KOR_NM"]) != expected_names:
        output.unlink(missing_ok=True)
        raise SystemExit("출력 재검증에 실패해 생성 파일을 제거했습니다.")
    if written.crs is None or written.crs.to_epsg() != 4326:
        output.unlink(missing_ok=True)
        raise SystemExit("출력 CRS 검증에 실패해 생성 파일을 제거했습니다.")

    print(json.dumps({
        "source": str(source),
        "source_sha256": before_hash,
        "source_crs": source_crs,
        "output": str(output),
        "output_crs": "EPSG:4326",
        "feature_count": len(written),
        "name_field": name_field,
        "province_field": province_field,
        "code_field": code_field,
        "filter_basis": filter_basis,
        "districts": list(written["SIG_KOR_NM"]),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
