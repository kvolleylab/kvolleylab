# VNL 18개국 국가 페이지 감사 v1

문서 상태: Active  
자동 점검일: 2026-07-13  
기준: main 브랜치 파일·데이터·VNL 허브 연결 상태

## 요약

- 국가 페이지 존재: **18/18**
- 공통 메뉴·템플릿 적용: **18/18**
- 실제 선수 데이터 연결: **18/18**
- VNL 허브 연결: **18/18**
- 국가 일정 연결: **18/18**
- 모든 기준 통과: **18/18**

## 국가별 결과

| Country | Page | 존재 | 공통구조 | 선수 데이터 | 감독 | 허브 | 일정 | 상태 |
|---|---|---:|---:|---:|---:|---:|---:|---|
| Japan | japan.html | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 완료 |
| Brazil | brazil.html | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 완료 |
| Poland | poland.html | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 완료 |
| Iran | iran.html | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 완료 |
| USA | usa.html | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 완료 |
| France | france.html | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 완료 |
| Argentina | argentina.html | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 완료 |
| Italy | italy.html | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 완료 |
| Canada | canada.html | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 완료 |
| Belgium | belgium.html | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 완료 |
| Cuba | cuba.html | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 완료 |
| Slovenia | slovenia.html | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 완료 |
| Germany | germany.html | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 완료 |
| Serbia | serbia.html | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 완료 |
| Türkiye | turkiye.html | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 완료 |
| Bulgaria | bulgaria.html | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 완료 |
| China | china.html | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 완료 |
| Ukraine | ukraine.html | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 완료 |

## 보완 항목

- 국가 페이지 구조·데이터 경로 기준 보완 항목 없음
- 다음 단계에서는 선수별 `player_id`와 실제 상세페이지 연결을 검수

## 다음 작업 우선순위

1. 국가 페이지 선수명을 Player Master의 `player_id`와 연결
2. 선수 상세페이지 v2 공통 스키마 확정
3. 감독·Active·Reserve 수와 실제 데이터 건수의 정기 교차 검증
4. Competition Master 최소 스키마 생성
5. 배포 후 실제 사이트에서 모바일·PC 링크 검증

브라질·폴란드는 기존 `players.json` 데이터 경로를 명시했고, 아르헨티나·벨기에는 v25 선수표를 공통 JSON으로 분리해 연결했다.
