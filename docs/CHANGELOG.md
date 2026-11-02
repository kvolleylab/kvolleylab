# K-Volley Lab Changelog

이 문서는 프로젝트의 주요 구조 변경, 기능 추가, 복구 작업을 기록합니다.

## 2026-11-02 — Scoped player MASTER connection pilot

- Add one-event number/position writer, native readback, application journal, idempotent current-season export and exact Pages verification.
- Keep Google authentication and writes disabled until explicit effective-date evidence, one pinned review and workbook access are verified.
- Verify 오재성 `KVL-P-001585` against the existing MASTER and live roster; both already show number 5. Record the connection check without manufacturing a value change or applied event.
- Prepare a dedicated empty journal on the existing men's MASTER. Preserve current player values, IDs, legacy history and historical tournament rosters.
- See [scope, evidence, blockers and recovery](validation/player-master-pilot-20261102.md). CI, merge and deployment evidence is recorded on the release PR.

## 2026-10-24 — Reviewed player names and draft links

- Apply six names explicitly reviewed by the project owner, retaining permanent IDs and correction evidence.
- Synchronize the existing Drive MASTER and active website sources; preserve other identity and history fields.
- Link six approved applicants: 53/59 men and 52/58 women, 105 total; retain 12 unresolved records.
- See [scope, evidence and recovery](PLAYER_NAME_REVIEW_20261024.md). Release status is recorded on the PR.

## 2026-10-23 — Player/Draft integration (pre-release verification)

- Reuse the approved B player UI with the original 1,842-player pipeline and canonical routes.
- Add official KOVO 59 men/58 women applications to the existing annual Draft Hub; 99 verified links and 18 pending. Keep the former 44-player eligibility board.
- Append independent application history to original profiles; preserve all existing data and shared navigation.
- Disable prototype private actions until server authentication and per-user ownership exist.
- See [evidence and recovery](PLAYER_DRAFT_INTEGRATION_v1.md); actual release result is recorded on the integration PR.

## 2026-07-10

### Project Standardization v1

- README 프로젝트 소개 및 문서 링크 개편
- Roadmap 최신화
- Project Board 생성
- feature 브랜치 및 Pull Request 중심 작업 방식 도입
- 기존 운영 페이지와 보호 파일 기준 재확인

영향받는 파일:

```text
README.md
docs/ROADMAP.md
docs/PROJECT_BOARD.md
docs/CHANGELOG.md
docs/DEVELOPMENT_WORKFLOW_v1.md
```

## 2026-06-25

### Domestic Database Foundation

- `domestic/`, `data/`, `assets/` 폴더 구조 생성
- Player Master Schema 초안 생성
- School Master Schema 초안 생성
- Country Master Schema 초안 생성
- 인하대학교 선수 명단 Seed 데이터 생성

## 2026-06-24

### VNL Recovery and Stable Backup

- VNL 선수 데이터 복구
- Players 검색 페이지 복구
- VNL/AVC 일정 달력 복구
- Stable Release 생성

복구 기준:

```text
vnl-stable-2026-06-24
```

## 기록 규칙

큰 구조 변경이나 운영 기능 변경 시 아래 내용을 기록합니다.

```text
날짜
변경 목적
추가/수정/삭제 파일
영향받는 기능
복구 기준
다음 작업
```
