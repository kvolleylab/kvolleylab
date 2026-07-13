# Competition Rules Engine v1

문서 상태: Active  
작성일: 2026-07-13

## 목적

대회마다 다른 운영요강과 순위 계산방식을 `competition_id`별 규칙 파일로 분리한다.

```text
Competition Master
  └─ ranking_rules
      ├─ 승점 규칙
      ├─ 순위 판정 순서
      ├─ 세트·득점 비율
      ├─ 맞대결
      ├─ 몰수·기권·실격
      ├─ 진출 조건
      └─ 수동 예외 처리
```

## 핵심 원칙

1. 계산기는 하나지만 규칙은 대회마다 별도 관리한다.
2. 규칙이 공식 운영요강으로 확인되지 않았으면 `verified`로 표시하지 않는다.
3. `pending_verification` 규칙은 임시 순위표에만 사용한다.
4. 몰수·기권·실격은 공식 규정 확인 전 자동 계산하지 않는다.
5. 진출팀 수와 시드 배정은 대회별 `advancement`에 저장한다.
6. 자동 계산 결과를 수정할 경우 이유와 출처 ID를 남긴다.

## 상태값

- `verified`: 공식 운영요강 확인 완료
- `provisional`: 일부 규칙만 확인된 임시 상태
- `pending_verification`: 공식 자료 확인 전

## 규칙 파일 경로

```text
data/rules/<competition-slug>-ranking-rules-v1.json
```

## VNL 2026 현재 상태

- Rule ID: `KVL-RULE-000001`
- Competition ID: `KVL-COMP-000001`
- 상태: `pending_verification`
- 현재 순위표: 25경기 결과 기반 임시 계산
- 득점득실률: 세트별 득점 데이터 확보 후 계산
- 맞대결·진출 기준·몰수 처리: 공식 운영요강 확인 후 확정

## 다음 대회 추가 절차

1. Competition Master에 대회 등록
2. 공식 운영요강 확보
3. 규칙 JSON 생성
4. 출처 ID 연결
5. 검증 상태를 `verified`로 변경
6. 경기 결과로 순위 계산
7. 자동 감사 수행
