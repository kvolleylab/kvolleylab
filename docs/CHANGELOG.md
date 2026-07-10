# K-Volley Lab Changelog

이 문서는 프로젝트의 주요 구조 변경, 기능 추가, 복구 작업을 기록합니다.

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
