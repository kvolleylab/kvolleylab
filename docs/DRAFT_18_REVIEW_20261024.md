# 드래프트 미연결 18명 후속 검수

검수일: 2026-10-24. 기준 main: `8237ba5ae5d2f901fdb69c6ca6723d3828ec2d90`.

기존 공식 신청자 117명/연결 99명과 Drive MASTER 검증 자료를 재사용하고 미연결 18명만 조사했다. Drive MASTER와 운영원칙 문서의 수정일은 이전 검수와 동일했다. 기존 MASTER, 공개 이름, Player ID, 신청자 연결 데이터는 변경하지 않았다.

현재 잘못 표기된 프로필을 그대로 둔 채 안전하게 추가 연결할 수 있는 건은 **0명**이다. 검수 완료와 연결 완료는 별개다. 원래 요청의 “기존 MASTER 변경이 필요하거나 선수 연결에 불확실성이 있다면 자동 병합하지 말고 검수 대상으로 남겨”를 유지한다.

## 공식 근거가 확보된 정정안 6명 — 미적용

| 유지할 기존 ID | 현재 공개 이름 | 정정 제안 | 소속 | 공식 근거 |
|---|---|---|---|---|
| KVL-P-000083 | 문민혁 | 옹민혁 | 경일대 | [KUSF](https://kusf.or.kr/league/league_player_detail.html?l_code=M&l_year=2026&p_code=46743) |
| KVL-P-000050 | 엄시원 | 염시원 | 경희대 | [KUSF](https://kusf.or.kr/league/league_player_detail.html?l_code=M&l_year=2026&p_code=46904) |
| KVL-P-000107 | 전우석 | 전유석 | 중부대 | [KUSF](https://www.kusf.or.kr/league/league_player_detail.html?l_code=260&p_code=46885) |
| KVL-P-000192 | 장승훈 | 장승호 | 충남대 | [KUSF](https://kusf.or.kr/league/league_player_detail.html?l_code=M&l_year=2026&p_code=46879) |
| KVL-P-000034 | 송기화 | 송건환 | 홍익대 | [KUSF](https://kusf.or.kr/league/league_player_detail.html?p_code=25051) |
| KVL-P-001462 | 이수민 | 이소민 | 광주여대 | [KUSF](https://kusf.or.kr/league/league_player_detail.html?l_code=261&p_code=46698) |

KOVO 공식 신청 원본과 KUSF의 이름·정확 생년월일·학교를 대조했다. 기존 ID의 DOB/학교 및 등번호·포지션 맥락을 함께 확인했다. 송건환의 KUSF 링크는 과거 시즌 정보가 섞여 있으므로 이름·DOB·신원 확인에만 사용하고 현재 학년을 덮어쓰지 않는다. 장승호는 현재 MASTER의 포지션 표기도 다르므로 이름 정정 후 이력을 유지한 상태에서 프로필·학교명단·신청 연결을 함께 검증해야 한다.

승인 후 작업 범위는 기존 ID 유지, 원본 값과 정정 이력 보존, 근거 연결, 검수된 표시값 반영 및 신청자 링크 재검증이다. 신청 기록만 먼저 연결하여 잘못된 이름의 프로필을 열어서는 안 된다.

## 추가 확인 12명

| 구분 | 선수 | 다음 확인 |
|---|---|---|
| 과거 원본 재대조 4명 | 김예서·오해솔·김아란·김아중 | DOB·학교·학년·포지션 일치 후보는 있으나 과거 팸플릿 이미지 재대조 미완료 |
| 공식 DOB 충돌 1명 | 김도현 | KOVO와 KUSF/KUVF의 월일이 다름. 어느 한쪽을 임의로 채택하지 않음 |
| 기존 ID 근거 없음 7명 | 변혜민·안창호·이율리·홍지원·박규환·Audrey Pak·Ju Eun Anabel Park | 기존 공통 MASTER 내 신원 확인 또는 별도 검수된 신규 등록 절차 필요. 이번에 ID 발급하지 않음 |

중요한 오연결 방지: 장승호의 과거 seed가 제안한 `KVL-P-000188`은 현재 목포대 김관응의 ID이므로 재사용하면 안 된다. 이소민의 동명이인 `KVL-P-000753`은 다른 연령·학교의 선수이므로 제외했다.

기계 판독용 검수 결과: [draft-18-review.json](validation/player-membership-v1/draft-18-review.json). 전체 DOB를 중복 공개하지 않도록 필요한 후보·판정·공식 출처 URL만 수록했다.
