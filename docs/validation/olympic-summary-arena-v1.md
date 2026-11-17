# 출전권 요약 경기장 배경·총수 표시 v1

2026-11-18 KST · Base `aede0c23df1bcff61eaf19b0ca084b68c54d4c82`

## 변경

- 사용자가 지정한 국제대회 메인 HERO의 기존 PC/mobile WebP를 출전권 요약 배경으로 참조한다. 이미지 생성·재인코딩·복제 업로드 없음.
- 요약 제목·4개 배정 카드·한국 현황 영역에만 배경을 적용한다. 상세 규정 펼침과 공식 출처는 흰 바탕이라 긴 내용을 읽어도 배경 이미지가 늘어나지 않는다.
- 페이지 상단의 ‘국가대표팀 › 대표팀 홈 / 올림픽·대표팀 로드맵’ 전용 경로줄을 제거했다. 공통 PC·모바일 메뉴는 유지한다. 2026-11-02 다른 대회에서 경로줄을 제거한 승인 방향과 일치한다.
- 배지의 ‘현재 올림픽’ 대신 `summaryView.totalPerGender`를 읽어 ‘남녀 각각 총 12장’을 표시한다. 미확정 주기는 ‘규정 발표 전’이며 숫자 없음.

## 출처·보존

LA28 공식 Qualification System, 2026-05-12판 D절은 남자 12개·여자 12개 출전국을 각각 배정한다. 확인 URL: https://stillmed.olympics.com/media/Documents/Olympic-Games/LA28/VVO-LA28-Qualification-System.pdf (2026-11-18 확인). 기존 배정 1/5/3/3 및 원본 주기 JSON 값은 변경하지 않았다.

현재 운영 국제대회 CSS 및 `docs/validation/international-hub-hero-v1.md`를 대조했다.

| 재사용 자산 | Git blob SHA | 크기 |
| --- | --- | --- |
| `assets/img/competition-hero/kvl-hero-international-hub-pc-v1.webp` | `21801fa60ae8374958fb8395379a04844232ef62` | 300314 bytes |
| `assets/img/competition-hero/kvl-hero-international-hub-mobile-v1.webp` | `bd57c81d600122f759dd6c917908e9fe8a6d60db` | 145004 bytes |

Google Drive 운영원칙 MASTER v19와 HERO_IMAGE_GUIDE_v1 및 기존 HERO 폴더 구조를 읽었다. 국제대회 원본 하위 폴더 조회 결과는 비어 있어 해당 이미지의 Drive MASTER 원본 보관 여부는 NOT VERIFIED로 둔다. 이번 작업은 검증된 GitHub 운영 자산 재사용이며 Drive에 원본을 새로 보관했다고 주장하지 않는다. 일반 이미지 생성 규격보다 사용자가 지정한 기존 이미지 재사용 및 후속 cover 표시 승인을 적용했다.

원본 역사 JSON Git blob `0c5b562f265b53cf3c3de97cedb4c339f0181e89` 일치. 역사 62개, historical CSS/JS/모델, 전체/핵심/올림픽/실패 필터, 대회 링크 4개, 공식 출처, 주기 전환 모델·규정 데이터 모두 불변.

## 검증

- 기존 Node `national-history-model-v1.test.mjs` + `olympic-cycle-v1.test.mjs`: 18/18.
- PC: 국제대회 동일 경기장 이미지, 총수 배지, 상단 경로줄 없음, 카드 4개 링크 유지.
- 390/360px Chromium CSS 뷰포트: 모바일 WebP 선택, 제목과 배지 겹침 없음, 가로 넘침 없음. 실제 휴대전화 터치 검사는 아님.
- 상세 규정 펼쳐도 이미지 영역 높이 유지, 본문은 배경 밖 흰 영역에 표시.
- 대륙선수권 카드 왕복, 실패 필터17 → 전체62, 2026년 접기·펼치기 확인.
- 2032 보기: 배지 ‘규정 발표 전’, 숫자 카드0개, 기존 역사62개 유지.
- 운영 배포 및 최종 화면은 PR에 merge SHA/Pages run/실화면 근거로 별도 기록한다.

## 변경 파일 및 복구

`olympic-roadmap.html`, `assets/css/olympic-qualification-v1.css`, `assets/css/olympic-roadmap-site-v1.css`, `assets/js/olympic-qualification-summary-v1.js`, 운영 문서·결정 로그·본 검증 문서.

복구는 이 시각 변경 커밋만 revert. 이전 대회 링크 복원, 공통 내비게이션, 원본 역사·경기/선수/자동화 및 국제대회 이미지 바이트는 되돌리지 않는다. 기존 운영 연결 승인과 이번 화면 수정 지시에 따라 독립 PR 검증 후 반영하며, 전역 QA의 기존 오류는 관련 변경 검사 결과와 구분한다.
