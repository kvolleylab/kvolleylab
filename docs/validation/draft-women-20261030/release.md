# 운영 반영 확인 · 2026-10-30

Status: DEPLOYED. 사용자가 여자부 확장과 실제 홈페이지 반영을 명시 승인한 범위다.

- PR: https://github.com/kvolleylab/kvolleylab/pull/199
- 운영 merge: `7a3f97947dffe738d48081596aa72d52be95e120`
- GitHub Pages: https://github.com/kvolleylab/kvolleylab/actions/runs/41010418597 · build/deploy/report 모두 성공, merge SHA 일치.
- 운영 여자부: https://kvolleylab.com/v-league-draft.html?season=2026-27&gender=W
- 운영 신청자: https://kvolleylab.com/draft-hub.html?season=2026-27&gender=W&layout=table&sort=source#applicants

실제 브라우저에서 사이드바 V-리그 홈→KOVO컵→신인 드래프트 진입, 남녀 전환, 여자57명/16명/28.1%, 남자59명/18명/30.5%, 홍준범 OP/MB, 신청자58행10열/프로필52개/취소1명 표시를 확인했다. 새로 불러온 입력 데이터는 남자 revision60·여자 revision41이며 실제 저장 브랜치 `3a80baab6386c6e45212f119bdd2511874c7a92c`의 파일 해시와 정적 배포 파일이 일치한다.

정규 권리28개·3거래4권리의 원래 열을 유지한다. 여자 구슬 중복과 색상은 미확인이다. 공식 결과로 실제 구슬 로그를 생성하지 않는다. 참가 신청58명 원본은 보존하고 출처가 있는 취소를 별도 반영한다.

최종 원격 draft-board 성공: https://github.com/kvolleylab/kvolleylab/actions/runs/41010370946 . Quality Audit 및 공개 export gate 성공: https://github.com/kvolleylab/kvolleylab/actions/runs/41010370937 . identity-and-routing은 29/30 통과이며 변경 범위 밖의 기존 공통 CSS 고정해시 실패1개만 남아 있다. 전체 CI 성공이라고 표현하지 않는다. 실제 사용자 토큰의 브라우저 입력→저장 전체 경로 및 물리 휴대폰은 미검증이고, 격리 폼/저장 충돌 검사와 실제 API 저장·재조회는 각각 확인했다.

이 증거 브랜치는 문서·스크린샷만 보관하며 운영 앱 코드를 추가로 변경하지 않는다. 아래 production.jpg는 운영 주소에서 캡처한 화면이다.
