# 부산 신용보증 월별 통계 대시보드

빌드 과정 없이 배포되는 HTML/CSS/JavaScript 정적 대시보드입니다. 모든 통계는 외부 JSON 파일에서 불러옵니다.

## 실행

JSON 파일 로딩에는 HTTP 환경이 필요합니다. 프로젝트 루트에서 정적 웹 서버를 실행한 후 브라우저로 접속합니다.

예시:

```bash
npx serve .
```

Cloudflare Pages에서는 별도 빌드 명령 없이 프로젝트 루트를 배포 디렉터리로 지정하면 됩니다.

## 매월 데이터 교체

화면 코드와 데이터는 분리되어 있습니다. `data/dashboard-data.json`의 값만 갱신하면 모든 핵심지표, 그래프, 순위, 상세표가 자동으로 갱신됩니다.

금액 단위는 백만원이며 신규보증 지표는 `신규보증 실행`으로 표시합니다. 연령대는 `20대 이하`, `30대`, `40대`, `50대`, `60대 이상`으로 집계합니다.

- `meta`: 기준일 및 표시 문구
- `monthly`: 월별 통계
- `district`: 구·군별 통계
- `age`: 연령대별 통계
- `industry`: 업종별 통계

각 통계 행은 `label`, `newGuarantee`, `accidents`, `accidentRate`, `balance` 속성을 사용하며 금액 단위는 억원입니다.

> 브라우저 보안 정책상 `index.html`을 더블클릭하는 `file://` 방식에서는 외부 JSON 요청이 차단될 수 있습니다. 로컬 정적 서버 또는 Cloudflare Pages 환경에서 실행하세요.

## 실제 원본 자료 변환

원본 ZIP은 `source/5개년 자료.zip`에 보관하며 Git에는 포함하지 않습니다. 변환 환경 준비:

```bash
python -m pip install -r requirements-data.txt
```

전체 분석 및 검증용 JSON 생성:

```bash
python scripts/transform_dashboard_data.py "source/5개년 자료.zip"
```

검증 후 현재 대시보드 데이터까지 교체:

```bash
python scripts/transform_dashboard_data.py "source/5개년 자료.zip" --publish-dashboard
```

세부 구조와 확인 필요 사항은 `analysis/source-data-report.md`를 참고합니다.
