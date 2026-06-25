K-Volley Lab Player Master Schema v3

목적:
- 국내 선수 DB와 국제대회 선수 로스터를 하나의 선수 코드(player_id)로 연결한다.
- 선수는 player_master에 한 번만 등록한다.
- 국내 이력, 국제대회 로스터, 대회 출전, 기록, 기사, 영상은 모두 player_id를 참조한다.

핵심 원칙:
1. player_id는 절대 변경하지 않는다.
2. display_code는 보기 쉬운 보조 코드이며 기본키가 아니다.
3. players.json은 기존 VNL 전용 파일이므로 수정하지 않는다.
4. player_master.json은 장기적으로 모든 선수의 통합 마스터가 된다.
5. 모든 핵심 데이터는 source_id와 연결한다.

파일 설명:
- player_master_schema_v3.json : 스키마 설명
- player_master_template.json : 빈 선수 입력 템플릿
- player_master_sample.json : 샘플 선수 데이터

업로드 위치:
data/player_master_schema_v3.json
data/player_master_template.json
data/player_master_sample.json
data/README_PLAYER_MASTER_V3.txt

GitHub Commit:
Add player master schema v3
