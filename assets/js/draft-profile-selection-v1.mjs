// Reviewed draft selections enrich an existing profile without rewriting its current roster.
import {escapeHTML as esc} from './player-workspace-core.mjs';

export function findVerifiedDraftSelection(rows, playerId, profileName) {
  if (!Array.isArray(rows) || !/^KVL-P-\d{6}$/.test(playerId || '') || !profileName) return null;
  const matches = rows.filter(row => {
    const result = row.selection || {};
    return row.player_id === playerId
      && row.name === profileName
      && row.match_status === 'matched'
      && row.match?.profile_verified === true
      && result.status === 'selected'
      && result.record_status === 'VERIFIED'
      && result.access_level === 'PUBLIC'
      && Boolean(result.team && result.team_code)
      && /^https:\/\//.test(result.source_url || '');
  });
  return matches.sort((a, b) => String(b.season).localeCompare(String(a.season)))[0] || null;
}

export function renderVerifiedDraftSelection(area, row, draftUrl) {
  if (!area || !row || area.querySelector('#playerDraftSelection')) return false;
  const hero = area.querySelector('.pd-hero > .pd-card');
  if (!hero) return false;
  const result = row.selection;
  const position = result.kind === 'trainee'
    ? '수련선수 지명'
    : `${result.round}라운드 ${result.pick}순위`;
  const detail = area.ownerDocument.createElement('section');
  detail.id = 'playerDraftSelection';
  detail.className = 'pd-draft-selection';
  detail.setAttribute('aria-label', '신인 드래프트 지명 결과');
  detail.innerHTML = `
    <p class="pd-draft-selection-eyebrow">${esc(row.season)} KOVO 신인 드래프트 · 지명 확인</p>
    <div class="pd-draft-selection-main">
      <strong>${esc(result.team)}</strong><span>${esc(position)}</span>
    </div>
    <p class="pd-draft-selection-origin">드래프트 당시 소속 · ${esc(row.affiliation || '정보 미확인')}</p>
    <div class="pd-draft-selection-links">
      <a href="${esc(draftUrl)}">지명 정보 보기</a>
      <a href="${esc(result.source_url)}" target="_blank" rel="noopener noreferrer">KOVO 공식 지명 결과</a>
    </div>
    <p class="pd-draft-selection-caution">지명 결과는 프로팀 선수 등록과 별개입니다. 현재 소속 변경은 KOVO 등록 공시 확인 후 반영됩니다.</p>`;
  const badges = hero.querySelector('.pd-badges');
  if (badges) badges.insertAdjacentElement('afterend', detail);
  else hero.appendChild(detail);
  return true;
}
