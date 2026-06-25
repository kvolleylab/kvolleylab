K-Volley Lab Domestic Folder Structure v1

목표:
- 기존 VNL 파일(players.json, players.html, vnl.html, schedules.html)을 건드리지 않는다.
- 국내 선수 DB는 /domestic 폴더와 /data 폴더로 분리한다.
- 선수는 player_master.json의 player_id로 통합 관리한다.

새 폴더/파일:
domestic/index.html
domestic/search.html
domestic/profile.html
domestic/timeline.html
data/player_master.json
data/domestic_players.json
data/domestic_growth_history.json
data/domestic_sources.json
assets/css/domestic.css

선수 코드:
- player_id: KVL-P-000001 형태, 내부 고유 ID
- display_code: KMJ-051029 형태, 사람이 보기 쉬운 보조 코드 후보

업로드:
압축을 풀고 폴더째 기존 홈페이지 루트에 넣는다.
GitHub Desktop에서 위 파일만 체크한다.
Commit: Add domestic folder structure v1
