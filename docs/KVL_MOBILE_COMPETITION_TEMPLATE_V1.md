# K-Volley Lab 모바일 대회 페이지 기본 템플릿 v1

> **상태: SUPERSEDED**
>
> 현재 기준은 `docs/KVL_MOBILE_COMPETITION_TEMPLATE_V2.md`이다.

v1은 모바일 390px 기준 구조를 처음 정리한 역사 버전이다. 당시 문서에는 특정 실제 대회 페이지가 최초 기준 페이지로 적혀 있었으나, 현재 운영 원칙에서는 **어느 실제 대회도 기본 템플릿의 Source of Truth로 지정하지 않는다.**

현재 모바일 대회 기본 템플릿은 다음의 독립 파일 구조로 관리한다.

- 규격 문서: `docs/KVL_MOBILE_COMPETITION_TEMPLATE_V2.md`
- 신규 대회 HTML 시작점: `templates/competition-page-v1.html`
- 공통 대회 CSS: `assets/css/kvl-competition-template-v1.css`
- 공통 대회 renderer: `assets/js/kvl-competition-template-v1.js`
- 공통 데이터 예시: `data/competitions/_template/competition-v1.template.json`

실제 대회 페이지에서 확인된 개선사항은 공통성이 확인된 경우에만 위 독립 템플릿으로 승격한다.
