// Season-specific, read-only lottery allocations. No player or selection data is changed.
import {escapeHTML as e} from './player-workspace-core.mjs';

export function validateLottery(data, season) {
  if (data?.schema_version !== 1 || data.season !== season) throw new Error('Lottery season mismatch');
  for (const [gender, division] of Object.entries(data.divisions || {})) {
    if (!['M', 'W'].includes(gender) || division.record_status !== 'VERIFIED' ||
        !Number.isInteger(division.total_balls) || division.total_balls <= 0 ||
        !/^https:\/\/kovo\.co\.kr\//.test(division.source_url || '') || !division.verified_at ||
        !Array.isArray(division.teams) || !division.teams.length) throw new Error('Unverified lottery allocation');
    const codes = new Set();
    let total = 0;
    for (const team of division.teams) {
      const directory = gender === 'M' ? 'men' : 'women';
      if (!/^[A-Z0-9]+$/.test(team.team_code) || codes.has(team.team_code) || !team.name ||
          !Number.isInteger(team.balls) || team.balls < 0 ||
          team.logo !== `assets/img/team-logos/v-league/${season}/${directory}/${team.team_code}.svg`) {
        throw new Error('Invalid lottery team');
      }
      codes.add(team.team_code);
      total += team.balls;
    }
    if (total !== division.total_balls) throw new Error('Lottery allocation total mismatch');
  }
  return data;
}

export async function loadDraftLottery(season, fetcher = fetch) {
  if (!/^\d{4}-\d{2}$/.test(season)) return null;
  try {
    const response = await fetcher(`data/draft-applicants/${season}/lottery.json`, {cache: 'no-store'});
    if (!response.ok) return null;
    return validateLottery(await response.json(), season);
  } catch {
    // Optional information must never block the official applicant list.
    return null;
  }
}

export function renderLottery(host, data, season, gender) {
  if (!host) return;
  const division = data?.season === season ? data.divisions?.[gender] : null;
  host.hidden = !division;
  if (!division) { host.replaceChildren(); return; }
  host.innerHTML = `<div class="da-lottery-head"><div><h2 id="daLotteryTitle">1순위 추첨 확률</h2><span class="da-lottery-division">${gender === 'M' ? '남자부' : '여자부'}</span></div><span class="da-lottery-total">총 <b>${division.total_balls}개</b>의 구슬</span></div>
    <ul class="da-lottery-grid">${division.teams.map(team => {
      const probability = Number((team.balls / division.total_balls * 100).toFixed(2));
      return `<li class="da-lottery-team" data-team="${e(team.team_code)}"><img src="${e(team.logo)}" alt="" width="64" height="64"><h3>${e(team.name)}</h3><p><strong>${team.balls}<small>개</small></strong> <span>(${probability}%)</span></p></li>`;
    }).join('')}</ul>
    <div class="da-lottery-foot"><p>추첨 전 구슬 배분 기준이며, 최종 지명 순서와는 다릅니다.</p><a href="${e(division.source_url)}" target="_blank" rel="noopener">KOVO 공식 발표 <span aria-hidden="true">↗</span></a></div>`;
}
