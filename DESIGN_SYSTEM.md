# K-Volley Lab Design System

이 문서는 K-Volley Lab 홈페이지의 디자인 기준을 정리한다. 새 페이지를 만들거나 기존 페이지를 수정할 때 이 문서를 먼저 확인한다.

## 1. 브랜드 방향

K-Volley Lab은 한국 배구 데이터와 전력분석 정보를 정리하는 신뢰감 있는 플랫폼이다.

디자인 키워드:

- 진한 네이비 기반
- 골드 포인트
- 데이터 플랫폼 느낌
- 전력분석관의 작전판 느낌
- 모바일에서도 보기 쉬운 카드형 구성
- 과한 장식보다 정보 가독성 우선

## 2. 기본 색상

현재 사이트의 핵심 색상은 다음을 기준으로 한다.

```css
:root {
  --bg: #071827;
  --bg-deep: #04111d;
  --panel: rgba(255,255,255,0.08);
  --line: rgba(255,255,255,0.14);
  --gold: #d6b25e;
  --mint: #22d4bf;
  --text: #ffffff;
  --muted: #cbd5e1;
  --soft: #94a3b8;
}
```

### 사용 원칙

- 배경은 `--bg`, `--bg-deep` 계열을 사용한다.
- 주요 제목, 로고, 핵심 버튼은 `--gold`를 사용한다.
- 보조 강조 문구나 eyebrow 텍스트는 `--mint`를 사용할 수 있다.
- 카드와 패널은 `--panel`과 `--line`을 사용한다.
- 본문은 `--text`, 설명문은 `--muted`, 보조 정보는 `--soft`를 사용한다.

## 3. 폰트

기본 폰트는 Arial을 사용한다.

```css
font-family: Arial, sans-serif;
```

Excel, 문서, PPT 등 다른 산출물과도 Arial 중심으로 맞춘다.

## 4. 레이아웃 기준

기본 본문 폭은 다음 범위를 권장한다.

```css
main,
.container {
  max-width: 1120px 또는 1180px;
  margin: 0 auto;
  padding: 56px 20px 80px;
}
```

일정 달력처럼 넓은 화면이 필요한 페이지는 `max-width: 1400px`까지 사용할 수 있다.

## 5. 헤더와 메뉴

모든 주요 페이지는 같은 헤더 구조를 유지한다.

권장 메뉴:

```text
Home
국내 선수 DB
VNL
선수 검색
일정
팜플렛
Simulator
Request
```

영문/한글 혼용은 가능하지만, 같은 레벨의 메뉴는 최대한 일관되게 표시한다.

권장 nav 스타일:

```css
.site-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.site-nav a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 9px 13px;
  border-radius: 999px;
  color: #d7e4ef;
  font-weight: 700;
  text-decoration: none;
  transition: 0.18s ease;
}

.site-nav a:hover {
  background: rgba(214,178,94,0.14);
  color: var(--gold);
}

.site-nav a.active {
  background: var(--gold);
  color: var(--bg);
}
```

## 6. 버튼 스타일

기본 버튼은 둥근 pill 형태를 사용한다.

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 12px 18px;
  border-radius: 999px;
  text-decoration: none;
  font-weight: 800;
  border: 1px solid var(--line);
  color: var(--text);
  background: rgba(255,255,255,0.06);
}

.btn.primary {
  background: var(--gold);
  color: var(--bg);
  border-color: var(--gold);
}
```

## 7. 카드와 패널

선수, 대회, 기능 소개는 카드형 UI를 기본으로 한다.

```css
.card,
.panel {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 22px;
}

.card:hover {
  transform: translateY(-3px);
  border-color: rgba(214,178,94,0.55);
}
```

카드 제목은 골드, 본문은 muted 색상을 사용한다.

## 8. 모바일 반응형 원칙

모바일 화면에서는 다음을 우선한다.

- 헤더는 세로 배치 허용
- 메뉴는 줄바꿈 허용
- 카드 그리드는 1열로 전환
- 일정 달력은 가독성을 위해 글자 크기 축소 또는 별도 리스트형 고려

권장 기준:

```css
@media (max-width: 760px) {
  header {
    align-items: flex-start;
    gap: 14px;
    flex-direction: column;
    padding: 16px;
  }

  .grid,
  .cards {
    grid-template-columns: 1fr;
  }
}
```

## 9. 현재 개선 필요 디자인 이슈

현재 저장소에는 페이지별로 CSS가 흩어져 있다.

확인된 문제:

- `index.html`은 자체 CSS 사용
- `domestic-db.html`은 압축된 자체 CSS 사용
- `vnl.html`은 자체 CSS 사용
- `players.html`은 별도 스타일과 일부 CSS 오류 존재
- `player-search.html`은 `domestic-style.css` 사용
- `schedules.html`은 자체 CSS 사용

향후 권장 방향:

```text
assets/css/style.css
assets/js/main.js
assets/data/
```

공통 스타일은 `assets/css/style.css`로 점진적으로 분리한다.

## 10. 디자인 작업 원칙

새 페이지를 만들 때는 기존 페이지에 임의의 색상과 메뉴 스타일을 추가하지 않는다.

작업 전 반드시 확인할 것:

1. 공통 색상 사용 여부
2. 헤더 메뉴 일관성
3. 모바일 반응형 여부
4. 버튼/카드 스타일 통일
5. 기존 링크 유지 여부

디자인이 흔들리면 K-Volley Lab 전체가 다른 사이트처럼 보일 수 있으므로, 기능 추가보다 통일성을 우선한다.
