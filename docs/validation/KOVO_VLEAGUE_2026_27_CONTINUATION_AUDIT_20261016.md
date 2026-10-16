# K-Volley Lab 2026-27 V-League MASTER 연속 검수 — 2026-10-16

## 범위 및 기준
- 대상: Google Drive 남자부 `1WD2odv51xNDx9BqRfAjkkLVu0p_DX2EX_GEbqR-G4og`, 여자부 `18-SkyyCeCXBKSUbCCevhAFDmyjSOPrQubreSXIG2PBU`.
- GitHub `main` 이전 기준 커밋: `c3021be9254e56f6a1e503f1a5232a93ea2eadd9` (5명 추가 공시, 두 명 신장 정정, 공식 코치 2개 구단 처리 완료).
- **운영 홈페이지, 프로덕션 HTML/CSS/JS, 선수 연봉 자료는 변경하지 않았다.**
- KOVO 공식 공시 아카이브 `data/kovo/official-notices/2026-27/index.json`: 75건, 최신 반영 공시 #157638 (2026-10-16); `roster_projection.json` 248명. 이것은 **공개 공시 기반의 추정 현등록**이지 KOVO 실시간 등록확인서가 아니다. 이번 검수 중 KOVO 실시간 페이지는 독립 직접 접속이 불가하여 *이 스냅샷 이후 공시 없음*으로 단언하지 않는다.
- 기준: 구단/등번호/공시 등록명 교차 대조, 선수 `Player_ID`는 `data/national/player_id_links_v1.json`의 **성명+생년월일 완전 일치**인 경우만 유지/연결한다. KOVO 공시상의 풀네임과 구단에서 사용하는 등록명(예: 페이즈)은 동치 자료이되 문자열이 같을 필요가 없다.

## 14개 구단 현재등록 수 (GitHub 투영과 Drive 재대조 일치)

| 성별 | 구단 | 현등록 후보 | 감독 | 코치 검수 |
|---|---|---:|---|---|
| 남 | 대한항공 | 19 | 헤난 달 조토 | 2026-27 공식 코치 전체 미확인 |
| 남 | 현대캐피탈 | 18 | 필립 블랑 | 2026-27 공식 코치 전체 미확인 |
| 남 | 우리카드 | 18 | 박철우 | 2026-27 공식 코치 전체 미확인 |
| 남 | KB손해보험 | 17 | 이사나예 라미레스 | 하현용·김진만·카카로토·김광국(직책은 구단 공식 페이지 확인) |
| 남 | 한국전력 | 15 | 석진욱 | 남광구 수석코치·강민웅·신희섭: https://www.kepco.co.kr/sports/volley/team/staff.do |
| 남 | OK저축은행 | 17 | 신영철 | 김재헌 수석코치·임동규·전병선: https://www.okfinancialsports.com/volleyball/player/coaching_staff.asp |
| 남 | 삼성화재 | 23 | 토미 틸리카이넨 | 2026-27 공식 코치 전체 미확인 |
| 여 | GS칼텍스 | 17 | 이영택 | 가와무라 신지·이시이 스구루 확인, 전체 구성 추가 검수 |
| 여 | 한국도로공사 | 15 | 김영래 | 2026-27 공식 코치 전체 미확인 |
| 여 | 현대건설 | 18 | 강성형 | 장영기·이선규·아보키요시: https://hillstate.hdec.kr/Contents_Player/Staff |
| 여 | 흥국생명 | 20 | 요시하라 토모코 | 탄야마 요시아키·김대경·타이스케 기무라·임승규: https://m.pinkspiders.co.kr/team/coach_list.php |
| 여 | IBK기업은행 | 18 | 마나베 마사요시 | 2026-27 공식 코치 전체 미확인 |
| 여 | SOOP | 17 | 김세진 | 진순기 수석코치·김재훈·함형진: 2026-07-01 구단 발표 인용 https://www.yna.co.kr/view/AKR20260701152400007 |
| 여 | 정관장 | 16 | 권순찬 | 2026-27 공식 코치 전체 미확인 |

남자 127 + 여자 121 = **248명**, 모두 `현재등록_공시기반` 영문명(라틴 문자), 생년월일, 신장 칸의 값 존재. 이는 모든 신장이 2026-27 최신 실측 공식 검증 완료라는 뜻이 아니다. `현재등록_공시기반`에서 (구단, 등번호, 등록명) 중복 0건, GitHub 구단별 투영 인원과 차이 0명. KOVO 공시상의 외국인 풀네임과 MASTER 등록명은 별도 변환 확인 필요. 이다현 등 별도 임대/보류 신분은 임의 포함하지 않는다.

## 이번 회차의 **실제 Drive 수정** (기존 완료 작업 중복 제외)

### 남자부 MASTER
1. `현재등록_공시기반!A2`: 10월 15일로 오래된 기준일을 2026-10-16으로 변경.
2. `KOVO_선수별변동이력!A4:S8`: 기존 이력 위에 KOVO 공시 5건 누락분 추가. #157638 페이즈, #157637 러셀, #157636 왕빈, #157635 호키 (10월16일), #157586 우스만 (10월15일). 원문·등록 구단·포지션·등번호·고신뢰 수준 저장. 원화 연봉과 옵션은 공시 미확인이므로 공란. 기존 이력은 아래로 보존. `latest_changes.json` 및 `roster_projection.json`의 다섯 건은 **이미 이전 회차 구단 탭·현재등록에 반영돼 있어 중복 등록하지 않았다**.
3. `현재등록_공시기반`·`남_현대캐피탈`: 레오의 영문 풀네임을 기존 KOVO 2025-26 미디어가이드북에 이미 기재된 `LEONARDO LEYVA MARTINEZ`로 통일.
4. `선수ID_신원검수`: 현등록과 구단/등번호/성명이 모두 일치하는 기존 행에 한해 생년월일 **21칸** 누락 해소(새 DOB 생성하지 않음).
5. 기존 `player_id_links_v1.json`의 (성명, 생년월일) 완전 일치를 재확인해 이전 미연결 6명에 기존 ID를 연결: 대한항공 이상욱 `KVL-P-001551`, 우리카드 정성규 `KVL-P-001566`, OK저축은행 김대환 `KVL-P-000025`, 삼성화재 황두연 `KVL-P-001570`, 박찬웅 `KVL-P-001565`, 양희준 `KVL-P-001531`. 기록 위치: 구단 탭, 현등록, 선수ID 신원검수. 데이터베이스에 없는 ID를 새로 만들지 않았다.
6. **현대캐피탈 최민호 신원 불일치 발견**: 현등록 및 구단 MASTER는 `1988.04.19 / 195cm`, 기존 ID 연결 `KVL-P-001608`의 신원 DB는 `1988-04-28`. 2026 VolleyballWorld의 현대캐피탈 소속 #11 최민호 프로필도 `1988-04-28 / 198cm`: https://en.volleyballworld.com/volleyball/competitions/avc-champions-league-men/players/138710 . 공식 자료 간 상충이므로 기존 MASTER 생년월일·신장을 임의 변경하지 않고, `현재등록_공시기반`·`남_현대캐피탈`의 **확정 Player_ID 연결만 해제**. `선수ID_신원검수`의 이전 ID(`G35`)는 보존하고 확정 ID(`H35`)는 공란, 불일치 사유·국제 공식 프로필 기록. `선수기본정보_출처검수`에 출처 행, `미확인항목_추적`에 최우선 검수행 추가. 2026-27 KOVO 공식 신원·실측 자료 확인 전 재연결 금지.
7. 최종 검산: 남자부 KVL Player_ID 기재 **54건**, `player_id_links_v1.json`과 이름·DOB 불일치 **0건**. 나머지 남자 73명과 여자 121명은 유효 연결 불확실하므로 미연결 상태. 본 수치는 *ID 연결 일치*이지 모든 선수 현재 시즌 공식 신원 실측 인증 수가 아니다.

### 여자부 MASTER
1. `현재등록_공시기반`과 각 팀 `여_*` 탭에서 한글이 남아 있던 라틴 영문명 **10명** 동기화. GS 실바 `GYSELLE SILVA`, 타나차 `THANACHA SOOKSOD`; 도로공사 모마 `Laetitia Moma Bassoko`, 마미 `Mami Uchiseto`; 현대건설 메가 `Megawati Hangestri Pertiwi`; 흥국생명 자스티스 `Jahstice Yauchi`; IBK 빅토리아 `Viktoriia Danchak`; SOOP 오드리아나 `Audriana Fitzmorris`, 이즈쉬에 `Yizhi Xue`; 정관장 부키리치 `Vanja Bukilic`. 소속·공시등록명·생년월일·신장·연봉은 변경하지 않음.
2. 기존 KOVO 미디어가이드북 라틴명 우선. 필요한 추가 확인 출처: 일본 SV 공식 마미 https://www.svleague.jp/en/v_women/player/detail/1246 ; VolleyballWorld 타나차 https://en.volleyballworld.com/volleyball/competitions/volleyball-nations-league/players/152205 ; VolleyballWorld 부키리치 https://en.volleyballworld.com/volleyball/competitions/volleyball-nations-league/players/152176 ; SOOP 구단 발표 인용 https://www.sportschosun.com/volleyball/2026-07-02/202607020100013510000590 ; 자스티스 보조 https://women.volleybox.net/jahstice-hickman-p11349 . 출처별 이름 순서/철자 표기는 완전히 같지 않을 수 있으므로 선수 고유 신원·한국 등록명은 별도 보존.
3. `선수ID_신원검수`: 현등록 구단/번호/이름과 정확 일치하는 행에서 생년월일 누락 **10칸** 동기화, 추정 Player_ID 부여하지 않음.
4. `선수기본정보_출처검수`: 마미·오드리아나·이즈쉬에의 후속 출처 행에 라틴 영문명 동기화.
5. `미확인항목_추적`: 확인된 신장 정보 불일치 3건 신규 보류 기록, **현재 MASTER 신장 값 유지**:
   - 부키리치: 구 KOVO 참고 198cm / VolleyballWorld VNL 2026 196cm (국제 원문 위 링크).
   - 자스티스: 기존 KOVO 참고 177cm / Volleybox 178cm (원문 https://women.volleybox.net/jahstice-hickman-p11349).
   - 메가: KOVO 과거 자료 185cm / 2026 외신 186cm (원문 https://sports.okezone.com/read/2026/09/14/43/3241971/megawati-hangestri-jadi-pemain-tertinggi-di-skuad-hyundai-hillstate-untuk-v-league-2026-2027).
6. 검산: 여자부 121명 등록 유지, 7구단별 인원 동일, 라틴명 공란/한글만 남은 현등록 `풀네임` 0명, 121건의 신원검수 생년월일과 현등록 생년월일 일치, KVL Player_ID 기재 0명(기존 상태 보존).

## 미완료·주의 항목과 다음 검수 조건
- **공식 코칭스태프 미완료/부분확인 8개 팀**: 남 대한항공·현대캐피탈·우리카드·삼성화재 / 여 GS칼텍스(일부만)·한국도로공사·IBK기업은행·정관장. 팬 편집 위키, 전 시즌 코치 페이지, 현 시즌 재임 증명이 없는 과거 임명 발표로 확정하지 말 것. `지도자_2026-27_검수`의 기존 확정값 유지.
- 선수 ID의 잔여 194명(남73/여121), 최민호 공식 생년월일/키 충돌, 여자 3명 신장 충돌, 그 외 2026-27 공식 실측 미검증 항목은 `선수ID_신원검수`·`미확인항목_추적`에서 조건부로 다룬다.
- 기본 정보의 셀 값 **존재 여부**와 출처의 2026-27 시즌 **최종 인증 여부**를 혼동하지 말 것.
- 공식 수집기 아카이브 스냅샷 이후 KOVO 신규 공시는 다음 실행에서 추가 확인해야 한다. 실시간 KOVO API 직접 접속 부재로 **이 시점에 추가 공시가 절대 없다고 판단하지 않는다**.
- 2026-27 KOVO 구단 공식 스태프 발표 및 현시즌 실측표 확보 후 출처 URL 기록 → 개별 검수 → MASTER 수정. `KOVO_선수별변동이력`은 공시 등록뿐 아니라 자유신분·임의해지·이적·임대까지 이벤트 단위 보존하고, 월별/연도별 집계로 현재 등록을 근거 없이 확정하지 않는다.

## 실제 검산 및 배포 원칙
- 남녀 공시 기반 현등록: 127 + 121 = 248. 남자 7/여자 7구단 집계 GitHub `roster_projection.json`과 동일.
- 남자 `KOVO_선수별변동이력` 누락 5건 실제 추가 및 readback 확인; 이력 기존 처음 #157539를 하위 행에 보존.
- 남/여 라틴명 및 검수용 생년월일 수정 후 재조회: 라틴명 미기재 0, 신원검수 DOB 불일치 0, (구단,등번호,등록명) 중복 0.
- Player_ID 54건 이름+DOB 완전 일치 검증; 공식 프로필 충돌 1건 연결 보류.
- **홈페이지와 운영 Production 파일 변경 없음.**
