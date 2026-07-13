# University Match Master v1

Competition: `KVL-COMP-000002`

Each match record uses the following fields:

- `match_id`: permanent ID such as `KVL-UM-000001`
- `competition_id`: `KVL-COMP-000002`
- `stage`: league, group, tournament, semifinal, final
- `round`: round or day label
- `start_at`: ISO 8601 datetime in Asia/Seoul
- `venue`: venue name
- `home_participant_id`, `away_participant_id`
- `home_school_code`, `away_school_code`
- `status`: scheduled, live, completed, postponed, cancelled
- `result_id`: optional result link
- `source_ids`: official source references

Official schedule data has not yet been entered. The master remains empty until a verified source is connected.
