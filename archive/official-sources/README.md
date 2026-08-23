# K-Volley Lab Official Source Archive

이 디렉터리는 **원본 PDF 저장소가 아니라 Official Source Archive 운영 규칙을 설명하는 메타데이터용 디렉터리**입니다.

## 저장 원칙

- 원본 PDF, HWP, XLSX, 이미지 등은 **Google Drive의 기존 대회별 폴더 구조**에 보관한다.
- GitHub/K-Volley Lab에는 원본 바이너리를 대량 누적하지 않는다.
- 공식자료 메타데이터 원본은 `assets/data/official-source-archive.json`에서 관리한다.
- 각 자료는 영구 `source_id`를 가진다.
- Drive File ID를 가능한 한 유지해 링크 안정성을 확보한다.
- 보관 여부(`archive_status`)와 홈페이지 공개 여부(`public_access`)를 분리한다.
- 라이선스/저작권이 확인되지 않은 파일은 Drive에 보관하더라도 웹에서 직접 노출하지 않는다.
- Player Master, Tournament Snapshot, Match DB는 `source_id`로 동일 근거자료를 참조한다.

## 작업 전 필수 확인

1. 현재 GitHub 구조 확인
2. 현재 Google Drive 대상 대회 폴더 확인
3. 기존 하위 폴더와 파일을 재사용할 수 있는지 확인
4. 중복 폴더/중복 원본을 만들지 않음
5. 필요한 경우 기존 파일을 올바른 하위 폴더로 이동하되 Drive File ID는 유지
6. `official-source-archive.json`에 Source ID와 Drive 참조 등록

## Source ID 규칙

`KVL-SRC-{YEAR}-{COMPETITION}-{TYPE}-{SEQ}`

예시:

`KVL-SRC-2026-KUSF-UL-ROSTER-001`

자료종류 예시:

- `REG`: 대회요강
- `ROSTER`: 공식 선수명단/팸플릿
- `SCHEDULE`: 경기일정
- `RESULT`: 경기결과
- `RECORD`: 공식기록지

## 공개 처리

`public_access`가 `공개가능`이고 `drive_file_id`가 등록된 경우에만 `official-source.html`에서 Google Drive PDF Viewer를 표시한다.

Drive에 원본이 존재하더라도 `public_access`가 `검토필요`, `비공개` 등인 경우에는 홈페이지에서 PDF 원본을 노출하지 않는다.
