# K-Volley Lab Project Board

최종 갱신: 2026-10-23

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
# 2026-10-24 후속 작업

- IMPLEMENTED / LOCAL QA: 기존 선수 페이지용 회원 인증·관심선수·다중 개인 메모, PostgreSQL 소유권 정책과 테스트.
- BLOCKED ACTIVATION: Supabase 설치/연결 확인, 운영 프로젝트·메일 발송 및 실제 두 계정 검증. 현재 회원 설정 비활성, 운영 배포 아님.
- REVIEW COMPLETE / DATA NOT CHANGED: 신청자 18명 중 이름 정정 근거 6, 과거 원본 재검수 4, DOB 충돌 1, 기존 ID 없음 7. [정정안](DRAFT_18_REVIEW_20261024.md).
