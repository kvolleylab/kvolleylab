# 대학·중고 공식 첨부자료 처리 가능성 — 2026-11-01

상태: **실제 표본 다운로드·파싱 검증 완료 / 대회별 무인 운영 미검증**.
원문 PDF·XLSX 전체는 GitHub에 복제하지 않았다. 측정값은
[`academic-source-feasibility-20261101.json`](academic-source-feasibility-20261101.json)에 보관한다.

## 실제 확인 결과

| 표본 | 실제 검사 | 결과와 적용 범위 |
|---|---|---|
| 기존 KVL 보관 대학연맹 단양대회 요강 PDF | HTTP200, 153,431bytes, 4쪽 문자층; 2쪽 6×5표 추출·원문 이미지 대조 | 병합 셀 정규화 후 남15+여7=22팀 고유 항목; 이 요강에 없는 선수/경기 결과는 추출하지 않음 |
| KUSF 대학 동아리배구 규정 PDF | HTTP200, 159,408bytes, 7쪽; 각 쪽 문자층·이미지 합계0 | 텍스트형 PDF 추출 가능; 실제 엘리트 경기 결과표가 아님 |
| 같은 공식 공지의 남자 참가신청 XLSX | HTTP200, 18,889bytes; ZIP/XML·Artifact Tool 읽기 | 신청서1시트 A1:K46, 병합44개, 수식0, VBA/외부링크 없음; 이름 입력20행은 전부 빈칸 |
| KUVF 공식 U-리그 플레이오프 HTML 일정 | 공식 공지의 일정·팀·시간·장소 표 확인 | HTML도 별도 어댑터로 처리 가능; 정기 게시 동작은 미검증 |
| CBS배 공식 중고배구 대진표 공지 | 실제 이미지 첨부4개 확인 | OCR/검수 경로가 필요; 중고연맹 PDF/XLSX를 파싱한 증거가 아님 |

단양 표의 세로 병합으로 추출된 null 값은 해당 표 안에서만 이어받고
성별·학교명 기준 고유 팀 수를 검증했다. 원문 장소 문장에 남대부 B조가 두 경기장에
반복되고 C조는 누락된다. 렌더링한 PDF에서도 확인되어 추출 오류가 아닌 원문 충돌이다.
이 문장으로 장소를 자동 배정하지 않는다.

KUSF의 PDF와 XLSX는 모두 서버가 `application/octet-stream`으로 응답했다.
파일 헤더와 실제 파서로 형식을 확인해야 한다. 엑셀 신청서에는 연락처·계정정보 등의
항목도 있으므로 공개용으로 필요한 항목만 선택한다. 이번 표본에는 입력 선수명이 없다.

## 출처

- [단양대회 공식 요강의 기존 Drive 원본](https://drive.google.com/file/d/1qkV-B6YAJsG4Rn8GOEmODF3Ro2XlIhDj/view)
- [KUSF 공식 첨부 공지](https://www.kusf.or.kr/news/news_view.html?board=notice&seq=1384)
- [KUSF 규정 PDF](https://www.kusf.or.kr/include/download.php?FILE_SEQ=1&FILE_TASK_TYPE=2026050008)
- [KUSF 남자 참가신청 XLSX](https://www.kusf.or.kr/include/download.php?FILE_SEQ=2&FILE_TASK_TYPE=2026050008)
- [KUVF 공식 U-리그 일정](https://kuvf.co.kr/31/?bmode=view&idx=173194129)
- [CBS배 공식 대진표](https://volleyball.cbs.co.kr/board/notice?num=83&v=view)

## 남은 확인

실제 중고연맹 PDF/XLSX, 엘리트 대학·중고 선수명단 및 경기결과 엑셀, 스캔 PDF OCR의
정확도는 별도 표본이 필요하다. KUVF 과거 2024 U-리그 PDF 직접 다운로드는 HTTP503으로
실패했으며 이를 무인 수집 가능 근거로 사용하지 않는다.

이번 검증은 파일 파싱 가능성의 실측이다. 파일 변경 자동 발견, 정기 다운로드,
Player_ID/MatchID 매칭, MASTER 쓰기, 공개 게시, 종료 보관의 운영 성공을 뜻하지 않는다.
각 대회는 해당 실물 자료와 실제 연결을 검증한 후에만 운영 준비 gate를 통과시킨다.

## 재현

`scripts/validate_academic_source_samples.py`는 기록된 SHA-256과 일치하는 위 세 표본만
읽는 검증 도구다. PDF는 `pdfplumber`, XLSX는 표준 ZIP/XML 파서로 검사한다.
수집·외부 쓰기·MASTER 반영은 하지 않으며 다른 버전의 파일은 먼저 중단한다.
측정 기록에 대응하는 이름으로 별도 원본 보관 폴더에 준비한 뒤 실행한다.

```sh
python scripts/validate_academic_source_samples.py /path/to/verified/samples
```

예상 파일명: `danyang_2026_guidelines.pdf`, `kusf_volleyball_2026_regional_rules.pdf`,
`kusf_volleyball_2026_application_men.xlsx`. 원본은 저장소에 추가하지 않는다.
