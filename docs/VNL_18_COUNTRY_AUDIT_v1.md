# VNL 18개국 국가 페이지 감사 v1

문서 상태: Active  
자동 점검일: 2026-07-13  
기준: main 브랜치 파일·데이터·VNL 허브 연결 상태

## 요약

- 국가 페이지 존재: **18/18**
- 공통 메뉴·템플릿 적용: **18/18**
- 실제 선수 데이터 연결: **14/18**
- VNL 허브 연결: **18/18**
- 국가 일정 연결: **18/18**
- 모든 기준 통과: **14/18**

## 국가별 결과

| Country | Page | 존재 | 공통구조 | 선수 데이터 | 감독 | 허브 | 일정 | 상태 |
|---|---|---:|---:|---:|---:|---:|---:|---|
| Japan | japan.html | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 완료 |
| Brazil | brazil.html | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | 보완 필요 |
| Poland | poland.html | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | 보완 필요 |
| Iran | iran.html | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 완료 |
| USA | usa.html | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 완료 |
| France | france.html | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 완료 |
| Argentina | argentina.html | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | 보완 필요 |
| Italy | italy.html | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 완료 |
| Canada | canada.html | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 완료 |
| Belgium | belgium.html | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | 보완 필요 |
| Cuba | cuba.html | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 완료 |
| Slovenia | slovenia.html | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 완료 |
| Germany | germany.html | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 완료 |
| Serbia | serbia.html | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 완료 |
| Türkiye | turkiye.html | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 완료 |
| Bulgaria | bulgaria.html | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 완료 |
| China | china.html | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 완료 |
| Ukraine | ukraine.html | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 완료 |

## 보완 항목

- **Brazil**: 실제 선수 데이터 미연결
- **Poland**: 실제 선수 데이터 미연결
- **Argentina**: 실제 선수 데이터 미연결
- **Belgium**: 실제 선수 데이터 미연결

## 다음 작업 우선순위

1. 실제 선수 데이터가 없는 국가부터 v25 JSON 연결
2. 기존 정적 국가 페이지를 공통 `national-team` 템플릿으로 이전
3. 감독·Active·Reserve 수와 데이터 실제 건수 교차 검증
4. 국가 페이지 선수명을 Player Master의 `player_id`와 연결
5. 배포 후 실제 사이트에서 모바일·PC 링크 검증

이 문서는 저장소 상태를 자동 점검해 생성되며, 대규모 국가 페이지 수정 후 다시 실행한다.
