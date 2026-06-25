# K-Volley Lab

K-Volley Lab은 한국 배구 데이터를 더 쉽게 찾고, 비교하고, 분석할 수 있게 만드는 웹 기반 배구 데이터 플랫폼입니다.

현재는 정적 HTML 기반의 초기 홈페이지이며, 국내 선수 성장 DB, VNL 선수 DB, 대회 일정 달력, 팜플렛 아카이브, 본선 진출 계산기 등으로 확장하는 단계입니다.

## Project Goal

K-Volley Lab의 목표는 흩어진 배구 자료를 한곳에 모아 선수, 팀, 대회, 일정, 기록, 팜플렛, 전력분석 자료를 연결하는 것입니다.

초기 목표:

- 국내 선수 성장 DB 구축
- VNL 및 국제대회 선수 DB 정리
- 대회별 경기 일정 달력 제공
- 팜플렛 아카이브 구축
- 본선 진출 경우의 수 계산기 제작
- 선수 검색 및 프로필 페이지 구축
- 사용자 제보 및 수정 요청 접수

장기 목표:

- 한국형 Volleybox + 전력분석 자료 허브
- 초·중·고·대학·실업·프로 선수 성장 이력 연결
- 공개 자료 기반 선수/대회 데이터베이스
- 현장 관계자, 선수, 팬이 모두 사용할 수 있는 배구 정보 인프라

## Current Main Files

```text
kvolleylab/
├─ index.html
├─ domestic-db.html
├─ domestic-style.css
├─ vnl.html
├─ players.html
├─ player.html
├─ player-search.html
├─ players.json
├─ schedules.html
├─ PROJECT_RULES.md
├─ DESIGN_SYSTEM.md
├─ STRUCTURE.md
└─ TODO.md
```

## Current Pages

| Page | Role |
|---|---|
| `index.html` | K-Volley Lab 메인 페이지 |
| `domestic-db.html` | 국내 선수 성장 DB 소개 페이지 |
| `vnl.html` | VNL 남자부 국가별 선수 DB 진입 페이지 |
| `players.html` | VNL 선수 검색 페이지 |
| `player.html` | VNL 선수 상세 페이지 |
| `player-search.html` | 국내 선수 DB 검색 페이지로 설계된 페이지 |
| `schedules.html` | VNL/AVC 등 대회 일정 달력 페이지 |
| `players.json` | 현재 VNL 선수 데이터 |

## Working Rules

이 저장소에서 작업할 때는 아래 문서를 먼저 확인합니다.

1. [`PROJECT_RULES.md`](PROJECT_RULES.md)
2. [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md)
3. [`STRUCTURE.md`](STRUCTURE.md)
4. [`TODO.md`](TODO.md)

이 문서들은 다른 채팅방이나 다른 작업자가 작업하더라도 K-Volley Lab의 방향이 흔들리지 않도록 하는 기준 문서입니다.

## Data Principles

K-Volley Lab은 공개적으로 확인 가능한 자료를 기반으로 데이터를 구축합니다.

사용 가능한 출처 예시:

- 공식 대회 팜플렛
- 대한배구협회, KOVO, AVC, Volleyball World 등 공식 자료
- 공개 기사
- 공식 경기 기록지
- 학교, 팀, 협회, 연맹의 공개 게시물
- Volleybox 등 공개 배구 데이터베이스

개인 연락처, 주소, 주민등록번호 등 민감 개인정보는 수집하거나 공개하지 않습니다.

## Design Direction

기본 디자인 방향:

- 진한 네이비 배경
- 골드 포인트 컬러
- 민트 보조 강조색
- Arial 폰트
- 카드형 정보 구조
- 모바일 대응
- 전력분석관의 작전판처럼 정리된 정보 화면

공통 디자인 기준은 [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md)에 정리되어 있습니다.

## Immediate Priorities

현재 우선 작업은 다음 순서입니다.

```text
1. 공통 CSS 파일 생성
2. 헤더/메뉴 구조 통일
3. players.html CSS 오류 수정
4. players.html과 player-search.html 역할 분리
5. VNL 선수 데이터와 국내 선수 데이터 분리
6. 일정 데이터를 JSON 파일로 분리
7. 팜플렛 아카이브 구조 정리
8. Simulator 구조 정리
```

자세한 작업 목록은 [`TODO.md`](TODO.md)를 확인합니다.

## Recommended Future Structure

장기적으로는 다음 구조를 목표로 합니다.

```text
kvolleylab/
├─ index.html
├─ pages/
├─ assets/
│  ├─ css/
│  ├─ js/
│  └─ images/
├─ data/
│  ├─ vnl/
│  ├─ domestic/
│  └─ schedules/
├─ docs/
├─ PROJECT_RULES.md
├─ DESIGN_SYSTEM.md
├─ STRUCTURE.md
└─ TODO.md
```

단, 현재는 GitHub Pages 정적 사이트로 운영 중이므로 링크가 깨지지 않도록 점진적으로 이동합니다.

## Project Identity

K-Volley Lab은 단순 팬 페이지가 아니라, 공개 자료 기반의 배구 데이터 정리와 전력분석 인프라 확장을 목표로 하는 장기 프로젝트입니다.

작업 시에는 빠른 임시 수정만큼이나 유지보수 가능한 구조를 중요하게 봅니다.
