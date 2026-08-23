# K-Volley Lab Official Source Archive

공식 대회자료 원본 PDF 보관 디렉터리입니다.

## 기본 원칙

- 메타데이터 원본: `assets/data/official-source-archive.json`
- 각 자료는 영구 `source_id`를 가진다.
- PDF 보관 여부(`archive_status`)와 홈페이지 공개 여부(`public_access`)를 분리한다.
- 라이선스/저작권이 확인되지 않은 파일은 보관하더라도 웹에서 직접 노출하지 않는다.
- Player Master, Tournament Snapshot, Match DB는 `source_id`로 이 메타데이터를 참조한다.

## 권장 파일 경로

`archive/official-sources/{year}/{competition_id}/{filename}.pdf`

예시:

`archive/official-sources/2026/KUSF-2026-UL/2026_KUSF_U리그_공식선수명단_v1.pdf`

## 권장 파일명

`{연도}_{대회}_{자료종류}_{버전}.pdf`

자료종류 예시:

- 대회요강
- 공식선수명단
- 경기일정
- 대진표
- 경기결과
- 최종순위
- 공식기록지

## Source ID 규칙

`KVL-SRC-{YEAR}-{COMPETITION}-{TYPE}-{SEQ}`

예시:

`KVL-SRC-2026-KUSF-UL-ROSTER-001`

## 공개 처리

`public_access`가 `공개가능`이고 `archive_file`이 등록된 경우에만 `official-source.html`에서 PDF viewer를 표시한다.
