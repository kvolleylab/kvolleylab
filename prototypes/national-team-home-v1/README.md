# 국가대표팀 홈 프로토타입 v1

상태: 디자인 검수용 독립 프로토타입. 운영 반영 승인 전이며 main 병합/운영 배포 대상이 아니다.

검수 링크: https://kvl-national-team-home-v1.daewook1029.chatgpt.site/

본인 ChatGPT 계정 로그인이 필요한 비공개 Site다. 브라우저 검수는 같은 빌드의 관리형 로컬 미리보기에서 수행했다. 외부 검수 링크는 로그인 게이트까지 확인했으며 게시 상태는 succeeded다.

## 구성

- 기존 공통 메뉴·모바일 헤더·HERO CSS·홈 HERO 원본을 재사용한다. 최대 콘텐츠 폭 1180px, 현재 운영 Pretendard 글꼴과 카드 테두리·골드 hover를 유지한다.
- 네이비 HERO에 태극 포인트를 더하고, 남자 블루/여자 로즈핑크 전환을 제공한다.
- 최근 경기/다음 일정, 출전대회, 대회별 명단/포지션 필터, 히스토리/세대추적, 올림픽/랭킹 순서다.
- 새 국가대표팀 전용 사진은 제작하지 않았다. HERO는 기존 KVL 이미지 원본을 사용한다.
- 성인/연령별 히스토리, 세대추적, LA28, 국제대회 링크는 기존 운영 주소로 연결한다. 공통 메뉴 링크도 운영 주소로 연결하며 대표팀 홈만 이 미리보기에 남는다.

## 데이터 범위와 보호

기준 main: `fc0df22a57b90078cb3d7ba76e6a8cdbdf770ed2` (2026-11-08 확인). `build.py`는 읽기 전용으로 공개 JSON을 투영하며 원본 data/assets/자동화는 쓰지 않는다.

| 영역 | 사용 원본/처리 |
| --- | --- |
| 아시안게임 남녀 | `data/competitions/asian-games-{men,women}-2026/{data,rosters}.json`, KOR 경기 및 명단 |
| AVC 대륙선수권 | 기존 남녀 대회 JSON, 남자 최종 14명 명단과 확인된 소속 자료 |
| AVC Men's Cup | competition_master, avc-2026-calendar, 공식 엔트리 JSON, 대한민국 참가/2위/14명 |
| 선수 프로필 | `data/national/player_id_links_v1.json`에서 이름+생년월일이 정확하게 일치하는 고유 ID만 연결 |
| 소속 | 해당 자료의 confirmed/CONFIRMED 값만 표시; 다른 대회의 소속을 추정해서 넣지 않음 |
| VNL | 현재 참가 자료에 대한민국이 없으므로 출전대회에 추가하지 않음 |

남자 아시안게임 12명/AVC 14명/컵 14명, 여자 아시안게임 12명이다. 여자 AVC 홈 명단 연결은 준비 상태로 표시한다. 여자 히스토리/세대추적이 아직 남자 자료임을 명시한다. 자료 미구축을 미선발로 처리하지 않는다. 감독은 컵 자료에 등록된 값만 표시하고 나머지 감독/코칭스태프는 미확인이다.

현재 경기 목록은 아시안게임과 AVC 대륙선수권 KOR 경기를 대상으로 한다. 컵은 더 이른 종료 대회여서 최근 경기 계산에 영향을 주지 않는다. 다음 등록 경기 없음은 '다음 일정 미정', 최신 세계랭킹/출전권 현황은 '미확인'으로 표시한다. 2026-11-08 고정 snapshot으로 자동 갱신되지 않는다.

## 검토한 운영 문서

- Drive 운영원칙 v18: https://docs.google.com/document/d/1iu1aWoTdSf2L7VCco5X7pCPxs9qVlM9rskZ8_hI76FY/edit
- HERO 가이드: https://docs.google.com/document/d/1xQS01BmCU-jpFm2DODnPPkEj3znujV-IT3kvVvY8--k/edit
- 올림픽 MASTER: https://docs.google.com/document/d/16TgHUtXhKyjyi-cuToL1_A_hIzbZfo0KYRYdC4AXxK8/edit (오래된 기준 자료이므로 현재 순위/확정 출전권으로 사용하지 않음)
- 아시안게임 남녀 명단 MASTER의 대한민국 구간을 읽어 등록 명단과 대조했다. 대표팀 명단_MASTER 폴더는 자료가 비어 있었다.
- 저장소 AGENTS/PROJECT_RULES/DESIGN_SYSTEM/DEVELOPMENT_WORKFLOW/DECISION_LOG 및 현재 국가대표·국제대회·대학대회 화면을 검토했다. 과거 Arial 문서보다 현재 공통 스타일과 최신 HERO 결정을 우선했다.

## 재현

저장소 루트에서:

```sh
python prototypes/national-team-home-v1/build.py /tmp/kvl-national-preview
python -m http.server 4173 --directory /tmp/kvl-national-preview
```

`http://localhost:4173/national-team.html`을 연다. `qa.html?width=390`은 동일 문서를 iframe으로 표시하는 반응형 검수 화면이다. `snapshot.json`만 확인하려면 빌드 명령에서 출력 경로를 생략한다.

## 검증 결과

- JS 문법 검사 통과. 남녀 최근 점수/세트 방향 및 모든 profileId의 기존 ID 매핑 검사 통과.
- 남자 최신 경기 대한민국 3–0 카타르, 세트 25–20/25–23/25–16. 여자 대한민국 0–3 태국. KOR 기준으로 홈/원정 방향을 변환해 표시했다.
- PC 1348px 문서폭과 360/390px iframe에서 scrollWidth=clientWidth, 가로 넘침 없음. 360px 여자 빈 명단, 390px 긴 컵 감독명도 넘침 없음.
- 남녀 전환, 대회별 명단 선택, S 포지션 필터, 모바일 메뉴 열기/닫기와 하위 메뉴, 선수명단 앵커/Top 버튼 작동 확인. PC·모바일 이미지 누락 0.
- 필수 5개 기존 경로 및 랭킹·선수 프로필·대회 표본 4개 HTTP 200 확인. 총 27개 고유 내부 대상 경로의 파일 존재 확인. 모든 외부 상세 페이지 내부 기능을 다시 테스트한 것은 아니다.
- PC 전체 화면과 모바일 390px 첫 화면을 촬영했다. 모바일은 반응형 iframe 검수이며 실제 Android/iOS 기기 테스트는 아니다.

## 다음 단계 / 복구

사용자 디자인 검수 후 운영 반영을 별도 승인받는다. 운영 반영 시 최신 main으로 공통 자산/데이터를 다시 확인하고 프로토타입 wrapper와 고정 snapshot을 운영 구조에 맞게 연결한다. 여자 명단/프로필 연결과 최신 랭킹은 출처 확인 후 확장한다.

이번 변경은 `prototypes/national-team-home-v1/` 및 이 작업의 결정 기록에 한정한다. 운영 파일, ID/MASTER, DB, 기존 명단, 자동화 변경은 없다. 취소는 이 브랜치/독립 검토 Site를 사용하지 않는 것으로 충분하며 운영 롤백은 필요하지 않다.
