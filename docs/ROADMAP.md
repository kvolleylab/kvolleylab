# K-Volley Lab Roadmap

문서 상태: Active  
최종 갱신: 2026-07-10

## Phase 1. Website & VNL Foundation

상태: 운영 중

- 메인 홈페이지
- VNL 국가별 진입 페이지
- VNL 선수 검색
- 선수 상세 페이지
- VNL/AVC 일정 달력
- GitHub Pages 배포

## Phase 2. Domestic Player Database

상태: 진행 중

- 국내 선수 DB 폴더 분리
- 국내 선수 검색/프로필/타임라인
- 대학·중·고 선수 명단 Seed 검증
- 팜플렛 기반 출처 연결
- 동명이인 및 선수 코드 검수

## Phase 3. Master Data & ID System

상태: 진행 중

- Player Master
- Country Master
- School Master
- Team Master
- Competition Master
- Match Master
- Source Master

ID는 변경하지 않는 내부 고유번호를 사용합니다.

```text
KVL-P-000001
KVL-S-000001
KVL-T-000001
KVL-CTY-000001
KVL-COMP-000001
KVL-M-000001
KVL-SRC-000001
```

## Phase 4. Archive & Tournament Data

상태: 예정

- 팜플렛 아카이브
- 대회별 로스터
- 대회 참가 이력
- 수상 이력
- 국가대표 이력
- 학교/팀별 페이지

## Phase 5. Excel → JSON Automation

상태: 예정

- Excel을 원본 데이터로 사용
- 스키마 검수 자동화
- 중복 선수 후보 탐지
- JSON 자동 생성
- GitHub 반영 전 검증 보고서

## Phase 6. Statistics & Scouting Tools

상태: 예정

- 경기 기록 DB
- 선수/팀 기록 비교
- 로테이션 및 매치업 도구
- 본선 진출 경우의 수 계산기
- 스카우팅 리포트

## Phase 7. Platform Expansion

상태: 장기

- Supabase/PostgreSQL 전환
- API 제공
- 영상/기사 연결
- AI 검색 및 요약
- OCR 기반 팜플렛 입력 보조
- 모바일 환경 고도화

## 운영 원칙

- 기존 운영 기능을 먼저 보호합니다.
- 신규 기능은 작은 Seed 범위에서 검증합니다.
- 데이터는 출처와 함께 저장합니다.
- 큰 변경은 feature 브랜치와 Pull Request를 사용합니다.
- Stable Release를 복구 기준으로 유지합니다.
