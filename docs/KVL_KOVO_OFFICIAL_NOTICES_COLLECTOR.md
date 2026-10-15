# KVL KOVO Official Notices Collector v1

## Purpose
Reusable, conservative public KOVO official-notice data collection for K-Volley Lab. It archives independently verifiable announcement facts; **not** the authoritative current-season roster, and it does not publish to the site or Google Drive.

## Verified APIs
- Board: https://kovo.co.kr/news/official-notices
- List: GET https://user-api.kovo.co.kr/contents/news/official-notices?page=0&size=10&sort=order%2Cdesc&pinned=false
- Detail: GET https://user-api.kovo.co.kr/contents/news/official-notices/155583
- Headers: Origin=https://kovo.co.kr; Referer=https://kovo.co.kr/news/official-notices; Accept=application/json; Accept-Language=ko-KR.
- These are public unauthenticated GET requests. Do **not** send cookies, session IDs, API keys or Authorization.
- Check JSON envelope result.status==200 and nonempty payload, not merely HTTP 200.
- Initial connection was demonstrated on GitHub Actions run 38682560093, commit a44dd1c5.

## Code & use
- Program: scripts/kovo_official_notices.py (Python standard library)
- Workflow: .github/workflows/kovo-official-notices-collector.yml
- Offline tests: tests/test_kovo_official_notices.py
- Run manually: GitHub → Actions → KOVO Official Notices Collector → Run workflow.
- Default recent scope: 6 pages; up to 90 relevant individual posts.
- Single notice: workflow input notice_id=155583.
- Historical backfill: increase max_pages (e.g., 20) and max_details (e.g., 300) in separate limited batches.
- Automatic daily refresh: 08:13 KST (23:13 UTC).
- Local CLI: python scripts/kovo_official_notices.py --max-pages 6 --max-details 90
- Offline test: python -m unittest discover -s tests -p test_kovo_official_notices.py -v

## Persistent outputs and semantics
- data/kovo/official-notices/2026-27/index.json: notice ID, published time, title, source URL, classification, club, sex, HTML SHA-256, and normalized table facts.
- data/kovo/official-notices/2026-27/registration_rows.csv: player name, position, number, salary, options, total, notes, source, posting date and notice type.
- data/kovo/official-notices/2026-27/latest_changes.json: additions and amendments relative to prior archive.
- run_report.json: diagnostic artifact only, not committed.
- Money is converted to KRW **only** when the table explicitly states (천원). Original salary, option and total columns are separate. No guessed FX conversion.
- Each record reflects the **date of a notice**, not necessarily a current roster, final match roster, or current salary. Missing notices in a partial scan do **not** imply player absence.
- Notice titles may lack the season; the scanner includes relevant registrations, FA, transfers and contract titles since 2026-04-01. Not all older history is covered by a routine daily scan.
- The program uses conservative request pacing, timeouts and retries.
- It does not archive full HTML, images, logos, private cookies or user credentials.
- Updating Google Drive MASTER, calculating player identity, and publishing the live homepage remain **separate explicit review steps**.
- Respect KOVO terms, source attribution, and any required permission for commercial use or redistribution. This workflow does not grant republication rights.

## New chat handoff
"Check kvolleylab/kvolleylab docs/KVL_KOVO_OFFICIAL_NOTICES_COLLECTOR.md and read data/kovo/official-notices/2026-27/index.json or registration_rows.csv. If stale, run KOVO Official Notices Collector via GitHub Actions (when an execution tool is available) and verify logs. Use actual notice URL, publication date and verification status. Do not treat a posted registration list as current game roster."

## 공시 유형별 분류 (확장)
- 선수등록, 추가등록, 이적, FA, 자유신분, 임의해지/임의탈퇴, 계약해지, 방출/퇴단, 해외임대/임대, 은퇴, 포지션·등번호 변경, 외국인/아시아쿼터 등 제목을 유형화한다.
- **분류 및 링크 수집은 해당 선수의 현재 등록·이동 여부를 확인한 것과 다르다.** 표가 아닌 서술형 공시는 본문에서 해당 선수와 효력일을 개별 대조해야 한다.
- KOVO 공시에 게시되지 않은 계약 변동은 공시 수집만으로 전수 확인할 수 없다. 해외임대와 국내 선수 임대 규정 역시 혼동하지 않는다.
- 2026-10-15 Drive MASTER 갱신: 구단 탭에는 2026-06-30 1차 등록 확인을 표시, 공식 KRW 금액은 `KOVO_공시연봉` 시트, 추후 변동 공시는 `변동공시_검수대기` 시트로 분리해 검수 대기.
