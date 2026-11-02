# K-Volley Lab Project Board

최종 갱신: 2026-11-02

## 2026-11-02 · 선수 MASTER 연결 1차

- 완료: 오재성 기존 ID·공식 원문·MASTER·운영 명단 대조, 원격 연결 검증 메모와 빈 적용 저널 저장·재조회.
- 구현: 단일 사건의 허용 셀 쓰기·재조회·중복 방지·현재 시즌 export·Pages 검증과 GitHub 활성화 gate.
- 차단 유지: 명시적 효력일 미확인, 실행계정의 선수 MASTER 공유 미연결. `pilot.json.enabled=false`.
- 실제 운영 완료 조건: 적합한 공식 사건과 권한을 확인한 후 단일 사건의 런타임·재조회·게시 영수증. [근거·복구](validation/player-master-pilot-20261102.md).

## 2026-10-23 scoped update

Player B UI and the single annual official Draft Hub are implemented and under release verification; see [handoff](PLAYER_DRAFT_INTEGRATION_v1.md). Remaining: 18 identity reviews, official selection results, real authentication and server ownership enforcement. Existing MASTERs are unchanged. Older board items below retain their historical scope.

## Backlog

- [ ] Team Master Schema v1
- [ ] Competition Master Schema v1
- [ ] Match Master Schema v1
- [ ] Source Master 정식 구조
- [ ] Excel → JSON 변환 자동화
- [ ] 국제대회 허브 페이지
- [ ] 팜플렛 아카이브 검색
- [ ] 국내 선수 동명이인 검수 규칙
- [ ] 공통 헤더/메뉴 컴포넌트

## Doing

- [ ] 프로젝트 문서 표준화
- [ ] 국내 선수 DB Seed 검증
- [ ] Player Master ID 정책 확정
- [ ] data 폴더 구조 정리 계획

## Review

- [ ] README 개편
- [ ] Roadmap 개편
- [ ] Development Workflow 검토

## Done

- [x] GitHub Pages 배포
- [x] VNL 국가별 진입 페이지
- [x] VNL 선수 검색
- [x] 선수 상세 페이지
- [x] VNL/AVC 일정 달력
- [x] 프로젝트 폴더 뼈대 생성
- [x] Player Master Schema 초안
- [x] School Master Schema 초안
- [x] Country Master Schema 초안
- [x] 국내 선수 DB 폴더 분리

## 작업 이동 규칙

```text
Backlog → Doing → Review → Done
```

한 번에 `Doing` 항목을 지나치게 많이 늘리지 않습니다. 기존 운영 기능에 영향을 주는 작업은 반드시 `Review` 단계를 거칩니다.
