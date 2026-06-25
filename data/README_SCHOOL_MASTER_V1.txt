K-Volley Lab School Master Schema v1

목적:
- 학교를 하나의 school_id로 관리한다.
- 선수와 팀은 학교명을 직접 저장하지 않고 school_id를 참조한다.
- 학교와 배구팀은 분리해서 관리한다.

핵심 원칙:
1. school_id는 절대 변경하지 않는다.
2. short_code는 보조 코드이며 기본키가 아니다.
3. 학교명 변경, 통폐합, 영문명 수정이 있어도 school_id는 유지한다.
4. 학교는 School Master, 배구부는 Team Master에서 관리한다.
5. 모든 핵심 데이터는 source_id와 연결한다.

파일 설명:
- school_master_schema_v1.json : 스키마 설명
- school_master_template.json : 빈 학교 입력 템플릿
- school_master_sample.json : 샘플 학교 데이터

업로드 위치:
data/school_master_schema_v1.json
data/school_master_template.json
data/school_master_sample.json
data/README_SCHOOL_MASTER_V1.txt

GitHub Commit:
Add school master schema v1
