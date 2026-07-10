# K-Volley Lab

K-Volley Lab은 한국 배구 데이터를 더 쉽게 찾고, 비교하고, 분석할 수 있도록 만드는 웹 기반 배구 데이터 플랫폼입니다.

현재는 GitHub Pages 기반의 정적 웹사이트로 운영하며, VNL 선수 DB, 국내 선수 성장 추적 DB, 대회 일정 달력, 팜플렛 아카이브, 전력분석 도구를 단계적으로 확장하고 있습니다.

## Project Goal

K-Volley Lab의 목표는 흩어진 배구 자료를 한곳에 모아 선수, 팀, 학교, 국가, 대회, 일정, 기록, 팜플렛, 기사, 영상, 전력분석 자료를 하나의 ID 체계로 연결하는 것입니다.

### 핵심 목표

- 국내 선수 성장 DB 구축
- 초·중·고·대학·실업·프로 선수 이력 연결
- VNL 및 국제대회 선수 로스터 관리
- 대회별 경기 일정 달력 제공
- 팜플렛 아카이브 구축
- 선수 검색 및 프로필 페이지 구축
- 모든 주요 데이터의 출처 저장
- 장기적으로 Excel → JSON → Website 자동화

## Current Status

| 영역 | 상태 |
|---|---|
| 메인 홈페이지 | 운영 중 |
| VNL 선수 검색 | 운영 중 |
| 선수 상세 페이지 | 운영 중 |
| VNL/AVC 일정 달력 | 운영 중 |
| 국내 선수 DB | 인하대 최신 명단 Seed 연결 완료 |
| Player Master | 공통 ID/국내·국제 분리 구조 확정 |
| School Master | 설계 완료 |
| Country Master | 설계 완료 |
| Team Master | 예정 |
| Competition Master | 예정 |
| Excel → JSON 자동화 | 예정 |

## Current Main Pages

| Page | Role |
|---|---|
| `index.html` | 메인 페이지 |
| `vnl.html` | VNL 국가별 선수 DB 진입 페이지 |
| `players.html` | VNL 선수 검색 페이지 |
| `player.html` | VNL 선수 상세 페이지 |
| `schedules.html` | VNL/AVC 일정 달력 |
| `domestic/` | 국내 선수 DB 영역 |
| `international/` | 국제 선수 DB 확장 영역 |

## Player Architecture

K-Volley Lab의 선수 구조는 다음 원칙을 사용합니다.

```text
선수 ID는 하나
화면과 활용 데이터는 국내/국제로 분리
```

```text
data/master/player_master.json
        │
        ├─ domestic/ + data/domestic/
        ├─ international/ + data/international/
        └─ competition / roster / history data
```

같은 한국 선수가 학교 명단과 국제대회 대표팀 로스터에 모두 등장해도 동일한 `player_id`를 사용합니다.

```text
국내 선수 검색 ─┐
학교·대학 명단   ├─ KVL-P-000001
국가대표 로스터 ┤
국제대회 로스터 ┘
```

초기에는 최신 명단의 이름, 생년, 소속, 포지션, 키, 출처를 먼저 등록하고, 성장 타임라인·대표팀 경력·대회 이력은 확인되는 순서대로 누적합니다.

## Project Structure

```text
kvolleylab/
├─ index.html
├─ vnl.html
├─ players.html
├─ player.html
├─ schedules.html
├─ domestic/
├─ international/
├─ archive/
├─ assets/
│  ├─ css/
│  ├─ js/
│  └─ images/
├─ data/
│  ├─ master/
│  ├─ domestic/
│  ├─ international/
│  ├─ schema/
│  ├─ template/
│  ├─ sample/
│  ├─ seed/
│  └─ archive/
├─ docs/
├─ PROJECT_RULES.md
├─ DESIGN_SYSTEM.md
├─ STRUCTURE.md
└─ TODO.md
```

현재 운영 중인 페이지 링크가 깨지지 않도록, 폴더 및 데이터 구조는 점진적으로 정리합니다.

## Documentation

작업 전 아래 문서를 먼저 확인합니다.

1. [`PROJECT_RULES.md`](PROJECT_RULES.md) — 핵심 개발 및 보호 규칙
2. [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) — 색상, 글꼴, 카드, 메뉴 디자인 기준
3. [`STRUCTURE.md`](STRUCTURE.md) — 현재 및 목표 폴더 구조
4. [`TODO.md`](TODO.md) — 단기 작업 목록
5. [`docs/DEVELOPMENT_WORKFLOW_v1.md`](docs/DEVELOPMENT_WORKFLOW_v1.md) — 설계부터 Release까지의 공식 개발 절차
6. [`docs/DATABASE_STANDARD_v1.md`](docs/DATABASE_STANDARD_v1.md) — 공통 마스터와 국내·국제 데이터 구조
7. [`docs/PLAYER_STANDARD.md`](docs/PLAYER_STANDARD.md) — 선수 ID, 표시, 입력 기준
8. [`docs/PLAYER_DATA_MAPPING_RULE_v1.md`](docs/PLAYER_DATA_MAPPING_RULE_v1.md) — Seed·명단을 Master DB로 편입하는 규칙
9. [`docs/ROADMAP.md`](docs/ROADMAP.md) — 단계별 개발 로드맵
10. [`docs/PROJECT_BOARD.md`](docs/PROJECT_BOARD.md) — Backlog / Doing / Review / Done 현황
11. [`docs/CHANGELOG.md`](docs/CHANGELOG.md) — 주요 변경 이력

## Development Workflow

모든 신규 기능은 다음 순서로 진행합니다.

```text
1. Design
2. Seed Data
3. Validation
4. Master DB Registration
5. Homepage Connection
6. Stable Release
```

기존 기능을 보호하기 위해 `main` 브랜치에 바로 대규모 변경을 적용하지 않습니다.

```text
main
└─ feature/*
   └─ Pull Request
      └─ Review
         └─ Merge
```

## Core Data Principles

- 동일한 선수는 하나의 `player_id`만 사용합니다.
- 국내 선수 화면과 국제 선수 화면은 분리합니다.
- 공통 신원은 `player_master`, 국내 활동은 `data/domestic`, 국제 활동은 `data/international`에서 관리합니다.
- 내부 고유 ID는 이름, 소속, 생년월일 변경과 관계없이 유지합니다.
- 국내 선수와 국제대회 로스터는 동일한 선수 ID를 참조합니다.
- 최신 명단부터 등록하고 과거 이력은 점진적으로 누적합니다.
- Excel 마스터를 장기 원본 데이터로 사용하고 JSON은 웹 배포용으로 생성합니다.
- 모든 핵심 데이터는 `source_id`를 통해 출처를 추적합니다.
- 공개 자료만 사용하며 연락처, 주소, 주민등록번호 등 민감 개인정보는 수집하지 않습니다.

### ID 예시

```text
Player      KVL-P-000001
School      KVL-S-000001
Team        KVL-T-000001
Country     KVL-CTY-000001
Competition KVL-COMP-000001
Match       KVL-M-000001
Source      KVL-SRC-000001
```

## Protected Files

아래 파일은 현재 운영 중인 핵심 기능이므로 변경 전 영향 범위를 확인합니다.

```text
index.html
vnl.html
players.html
players.json
player.html
schedules.html
```

보호 파일은 한 번에 하나씩 수정하고, Pull Request에서 변경 내용을 검토합니다.

## Design Direction

- 진한 네이비 배경
- 골드 포인트 컬러
- 민트 보조 강조색
- Arial 기반 타이포그래피
- 카드형 정보 구조
- 모바일 대응
- 전력분석관의 작전판처럼 정리된 정보 화면

## Roadmap Summary

```text
Phase 1  Website & VNL Foundation
Phase 2  Domestic Player Database
Phase 3  Master Data & ID System
Phase 4  Pamphlet / Tournament Archive
Phase 5  Excel → JSON Automation
Phase 6  Statistics / Scouting Tools
Phase 7  API / Database / AI Expansion
```

자세한 내용은 [`docs/ROADMAP.md`](docs/ROADMAP.md)를 확인합니다.

## Project Identity

K-Volley Lab은 단순 팬 페이지가 아니라, 공개 자료 기반의 배구 데이터 정리와 전력분석 인프라 확장을 목표로 하는 장기 프로젝트입니다.

빠른 임시 수정만큼이나 기존 기능 보존, 출처 관리, 확장 가능한 데이터 구조와 복구 가능한 개발 절차를 중요하게 봅니다.
