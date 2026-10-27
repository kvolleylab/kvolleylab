# 종합대회 운영 반영 · 지역 표시

- 기준 main: `b61b1a4af41a87dbe2d0271a69180ec7af4452fd`
- 사용자 승인: 2026-10-27, 종합대회 시안의 지역 강조 및 실제 홈페이지 반영.
- 상태: 구현·자동 검증 완료. 실제 배포 완료 여부는 release PR의 merge, Pages 실행, 운영 화면 검증 기록으로 확인한다.

## 변경 범위

- `comprehensive-competitions.html`: 대학 허브 디자인을 재사용한 전국체전·소년체전 목록, 9부문 입상팀, 연도별 기록.
- `national-sports-festival-2026.html` / `national-youth-sports-festival-2026.html`: 공통 국내대회 엔진과 기존 메뉴·선수·경기 경로. 정식 페이지는 production 검증 사용.
- 지역은 참가팀 code로 공식 `region`을 연결한다. 팀명에서 추정하지 않는다. 목록 36개 입상팀, overview 우승/순위, 최종 입상 카드에 남녀 색상의 16px 배지.
- 전국체전 60팀/55경기/671명/154개 프로필과 소년체전 59팀/55경기/122세트/16개 입상팀. 기존 공동 3위와 원문 점수 충돌 2건 유지.
- 공식자료의 URL·Source ID·무결성 해시는 공개한다. 원본 파일과 내부 보관 위치는 비공개 원본 보관소에 유지한다. 배포 커밋은 기존 main에서 새로 구성하여 비공개 시안 이력이 공개되지 않는다.
- 홈·선수 MASTER·국제대회·대학·중고 순위 데이터는 변경하지 않는다. 기존 공통 모듈과 대학 카드 스킨을 유지한다.

## 검증

- 기존 원본 보관소에서 읽은 MASTER와 보관 중 스냅샷의 바이트 일치 및 전국체전 60팀 공식 지역 대조.
- `comprehensive-hub`, `national-festival-2026`, `domestic-home-v2`, `school-domestic-home-v2`, `competition-v2-team-ux`: 80/80 PASS.
- 모든 9개 부문의 HTTPS canonical 기반 production 데이터 검증, 메뉴/부문 이동, 전체 대진, 공동 3위, 명단 검색·펼침·경기결과 왕복 회귀 포함.
- PC 및 360px 모바일: 지역 배지/팀명 줄바꿈, 목록→부문 상세 연결, 가로 넘침 없음. 실제 화면 상세 검수 결과는 release PR에 기록.
- 내부 HTTP 검수 서버는 canonical HTTPS 조건 때문에 검수 복사본만 production=false로 사용한다. 정식 소스는 production=true이며 운영 HTTPS에서 최종 확인한다.

## 알려진 데이터 제한

- 전국체전 남대부 결승의 공식 요약 3–0/세트별 3–1 불일치, 남18세 준결승 원문의 24–25 세트 오류는 화면에 설명을 유지한다.
- 소년체전 개인 선수명단은 이번 범위에 없으며 참가팀은 팀 경기결과로 연결한다. 과거 연도 미등록 기록은 임의 생성하지 않는다.

## 복구

Release PR의 merge commit을 revert하면 이전 main의 전국체전 landing과 종합대회 메뉴로 복구된다. 다른 이후 작업은 보존한다. 원본 자료와 선수 MASTER는 이 변경에서 수정하지 않았다.
