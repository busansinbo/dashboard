# 부산 구·군 경계 데이터

전국 시군구 행정경계 원본은 이 폴더에 직접 복사하지 않아도 된다. 원본 경로를 추출 스크립트에 전달하면 검증을 통과한 결과만 아래 파일로 생성한다.

- 출력 파일: `assets/maps/busan-districts.geojson`
- 출력 좌표계: `EPSG:4326`
- 표준 구군명 속성: `SIG_KOR_NM`
- 선택 행정코드 속성: `SIG_CD`
- Feature 수: 정확히 16개

SHP를 제공할 때는 `.shp`, `.dbf`, `.shx`, `.prj` 파일을 같은 폴더에 같은 이름으로 둔다.

실행 예시:

```powershell
python scripts/extract_busan_districts.py "source/spatial/TL_SCCO_SIG.shp"
```

속성명이 일반적인 명칭과 다른 경우 원본 메타데이터를 확인한 뒤 명시적으로 지정한다.

```powershell
python scripts/extract_busan_districts.py "source/spatial/districts.geojson" `
  --name-field "구군명" `
  --province-field "시도명" `
  --code-field "시군구코드"
```

구군명 누락·예상 외 값·중복 Feature·CRS 누락·유효하지 않은 geometry가 있으면 임의 보정하지 않고 생성 작업을 중단한다.
