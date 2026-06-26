# K-Volley Lab Seed Data

이 폴더는 엑셀, 팜플렛, 공식자료 등에서 추출한 원본 seed 데이터를 보관한다.

## 2026 대학배구 남대부 seed 작업

원본 파일:

```text
대학배구_선수명단_v5.xlsx
```

기준 시트:

```text
전체_통합DB
참가팀_목록
원본_출처메모
```

확인된 데이터:

```text
선수 수: 229명
부문: 남대부
팀 수: 15팀
검수상태: 검수완료
확인필요 이슈: 0
기존 선수 코드: 이니셜-YYMMDD 형식
신규 공용 선수 ID: KVL-P-00001 형식
```

## seed 변환 원칙

기존 엑셀의 `KVL_ID`는 버리지 않고 `legacy_id`로 보존한다.

새로운 공식 선수 ID는 다음 형식을 사용한다.

```text
KVL-P-00001
KVL-P-00002
KVL-P-00003
```

## 다음 생성 대상

```text
player_master_seed_domestic_univ_2026_v1.tsv
team_master_seed_univ_2026_v1.json
competition_master_seed_univ_2026_v1.json
source_master_seed_univ_2026_v1.json
```

대용량 선수 seed 파일은 검수 후 GitHub에 반영한다.
