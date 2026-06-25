K-Volley Lab Country Master Schema v1

목적:
- 국가를 하나의 country_id로 관리한다.
- 선수, 학교, 팀, 대회, 경기는 국가명을 직접 저장하지 않고 country_id를 참조한다.
- ISO, IOC, FIVB 코드를 함께 저장해 국제대회 데이터와 연결한다.

핵심 원칙:
1. country_id는 절대 변경하지 않는다.
2. short_code는 보조 코드이며 기본키가 아니다.
3. 국가명, 표기법, 국기 코드가 변경되어도 country_id는 유지한다.
4. Player, School, Team, Competition, Match는 country_id를 참조한다.
5. 모든 핵심 데이터는 source_id와 연결한다.

파일 설명:
- country_master_schema_v1.json : 스키마 설명
- country_master_template.json : 빈 국가 입력 템플릿
- country_master_sample.json : 샘플 국가 데이터

업로드 위치:
data/country_master_schema_v1.json
data/country_master_template.json
data/country_master_sample.json
data/README_COUNTRY_MASTER_V1.txt

GitHub Commit:
Add country master schema v1
