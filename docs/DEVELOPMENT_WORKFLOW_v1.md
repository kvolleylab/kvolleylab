# K-Volley Lab Development Workflow v1

문서 코드: KVL-STD-001-WORKFLOW  
문서 상태: Active  
최종 갱신: 2026-07-10

이 문서는 K-Volley Lab의 개발 순서, 데이터 검수, GitHub 작업, Release 기준을 정의합니다.

## 1. 핵심 원칙

1. 기존 기능을 보호한 뒤 새 기능을 추가합니다.
2. 한 번에 여러 핵심 파일을 덮어쓰지 않습니다.
3. 신규 기능은 새 폴더와 새 파일에서 검증합니다.
4. 스키마를 먼저 만들고 실제 데이터 일부로 검증합니다.
5. 모든 주요 데이터는 `source_id`로 출처를 추적합니다.
6. 한 Commit은 하나의 목적만 가집니다.
7. 큰 변경은 feature 브랜치와 Pull Request를 사용합니다.
8. Stable Release를 복구 기준으로 유지합니다.

## 2. 표준 개발 순서

### Phase 1. Design

기능을 만들기 전에 구조와 영향 범위를 확정합니다.

산출물:

```text
Schema
Template
Sample
README
Naming Rule
영향받는 파일 목록
```

### Phase 2. Seed Data

정식 Master DB에 바로 넣지 않고 실제 데이터 일부를 검토용 Seed로 만듭니다.

권장 범위:

```text
1개 학교
1개 팀
1개 국가
1개 대회
```

### Phase 3. Validation

검수 항목:

```text
ID 중복
필수값 누락
동명이인
source_id 연결
school_id 연결
team_id 연결
country_id 연결
표기 통일
JSON 문법 오류
```

검수 전에는 정식 Master DB에 편입하지 않습니다.

### Phase 4. Master DB Registration

검수 완료 후 Master DB에 등록합니다.

```text
player_master.json
school_master.json
team_master.json
country_master.json
competition_master.json
match_master.json
source_master.json
```

등록된 Master ID는 삭제하거나 재사용하지 않습니다. 잘못된 데이터는 상태값과 변경 이력으로 관리합니다.

### Phase 5. Homepage Connection

검증된 데이터를 웹페이지와 연결합니다.

```text
domestic/search.html
domestic/profile.html
domestic/timeline.html
international/
```

연결 후 PC와 모바일에서 링크, 검색, 필터, 상세 이동을 확인합니다.

### Phase 6. Stable Release

기능이 안정되면 GitHub Release를 생성합니다.

```text
vnl-stable-2026-06-24
domestic-db-v1
project-structure-v1
```

Release Note에는 변경 기능, 영향받은 파일, 복구 기준, 다음 작업을 기록합니다.

## 3. GitHub 브랜치 및 Pull Request 규칙

`main`은 운영 가능한 안정 상태를 유지합니다.

```text
main
└─ feature/project-standardization-v1
└─ feature/domestic-db
└─ feature/player-search
└─ fix/schedules-link
```

작업 절차:

```text
1. main에서 feature/fix 브랜치 생성
2. 목적별 Commit
3. Pull Request 생성
4. 변경 파일과 영향 범위 확인
5. 테스트
6. Merge
7. 필요 시 Release 생성
```

운영 페이지를 변경하는 PR은 Draft 또는 Review 상태에서 먼저 확인합니다.

## 4. Commit 규칙

Commit 메시지는 영어 동사로 시작합니다.

```text
Add ...
Update ...
Fix ...
Refactor ...
Remove ...
Release ...
```

예시:

```text
Add school master schema v1
Add Inha player seed data v1
Update project README
Fix player search filter
Refactor data folder structure
```

## 5. 파일명 규칙

### Master

```text
player_master.json
school_master.json
team_master.json
country_master.json
competition_master.json
match_master.json
source_master.json
```

### Schema / Template / Sample / Seed

```text
player_master_schema_v3.json
player_master_template.json
player_master_sample.json
player_master_seed_domestic_univ_inha_2026_v1.json
```

파일명만 보고 역할과 범위를 확인할 수 있어야 합니다.

## 6. ID 규칙

Master ID는 절대 변경하거나 다른 객체에 재사용하지 않습니다.

```text
Player      KVL-P-000001
School      KVL-S-000001
Team        KVL-T-000001
Country     KVL-CTY-000001
Competition KVL-COMP-000001
Match       KVL-M-000001
Source      KVL-SRC-000001
```

`display_code`는 사람이 보기 쉬운 보조 코드이며 기본키로 사용하지 않습니다.

## 7. 보호 파일

아래 파일은 현재 운영 중인 핵심 기능입니다.

```text
index.html
vnl.html
players.html
players.json
player.html
schedules.html
```

보호 파일 수정 절차:

```text
1. 최근 Stable Release 확인
2. 변경 이유와 영향 범위 기록
3. feature/fix 브랜치에서 한 파일씩 수정
4. 링크와 데이터 로딩 테스트
5. Pull Request 검토
6. Merge 후 실제 사이트 확인
```

## 8. 데이터 관리 원칙

장기적으로 Excel 마스터를 원본 데이터로 사용합니다.

```text
공식 자료 / 팜플렛 / 기사
↓
Excel Master
↓
검수
↓
JSON 생성
↓
GitHub
↓
Website
```

JSON은 웹 배포용 데이터로 보고, 직접 수작업 수정은 최소화합니다.

## 9. 폴더 구조 원칙

목표 구조:

```text
kvolleylab/
├─ docs/
├─ data/
│  ├─ master/
│  ├─ schema/
│  ├─ template/
│  ├─ sample/
│  ├─ seed/
│  └─ archive/
├─ domestic/
├─ international/
├─ archive/
└─ assets/
   ├─ css/
   ├─ js/
   └─ images/
```

현재 운영 파일의 경로는 링크가 깨지지 않도록 점진적으로 이동합니다.

## 10. 복구 원칙

문제가 생기면 임의로 덮어쓰기 전에 다음 순서로 확인합니다.

```text
1. GitHub History
2. Stable Release
3. 직전 Pull Request
4. Local backup
5. Seed/Sample 파일
```

## 11. 문서 업데이트

큰 변경 후 다음 문서를 함께 확인합니다.

```text
README.md
docs/ROADMAP.md
docs/PROJECT_BOARD.md
docs/CHANGELOG.md
```

## 12. Version History

| Version | Date | Description |
|---|---|---|
| v1.0 | 2026-06-25 | Initial workflow |
| v1.1 | 2026-07-10 | Branch, PR, protection and recovery rules added |
