/* K-Volley Lab · AVC women 2026 confirmed information parity layer
   Source: Drive tournament MASTER + avc-women-continental-2026.json. */
(()=>{
'use strict';
const DATA='data/competitions/avc-women-continental-2026.json?v=20260915-info-4';
const TEAM_CODE={중국:'CHN',이란:'IRI',대만:'TPE',이라크:'IRQ',태국:'THA',인도네시아:'INA',카자흐스탄:'KAZ',호주:'AUS',일본:'JPN',대한민국:'KOR',베트남:'VIE',홍콩:'HKG'};
const FINAL_NOTE={
  1:'우승 · LA28 올림픽 직행',
  2:'준우승',
  3:'3위',
  4:'4위'
};
let data=null,applyTimer=0;
const text=el=>el?.textContent?.trim()||'';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const completed=m=>Boolean(m)&&Number.isFinite(m.setsA)&&Number.isFinite(m.setsB);
function qfMap(){
  const seedByTeam=new Map((data?.combinedSeeds||[]).map(x=>[x.team,Number(x.seed)||null]));
  const out=new Map();
  (data?.matches||[]).filter(m=>m.stage==='8강').forEach(m=>{
    const a=Number(m.seedA)||seedByTeam.get(m.teamA)||null,b=Number(m.seedB)||seedByTeam.get(m.teamB)||null;
    out.set(m.teamA,{seed:a,opponentSeed:b,id:m.id});
    out.set(m.teamB,{seed:b,opponentSeed:a,id:m.id});
  });
  return out;
}
function enrichTournamentMeta(){
  const title=document.getElementById('pageTitle');
  const sub=document.querySelector('.kvl1180-hero-sub');
  if(title&&data.displayName)title.textContent=data.displayName;
  if(sub&&data.officialName)sub.textContent=data.officialName;

  const status=document.querySelector('.kvl1180-hero-status');
  if(status){
    const badges=status.querySelectorAll('span');
    if(badges[0])badges[0].textContent=data.status==='completed'?'대회 종료':data.status==='active'?'대회 진행 중':'대회 예정';
    if(badges[1])badges[1].textContent=`${data.teamCount||12}개국`;
    const accent=status.querySelector('.is-accent');
    if(accent&&data.champion)accent.textContent=`우승 ${data.champion}${data.la28Qualifier===data.champion?' · LA28 직행':''}`;
  }

  const teamCount=document.getElementById('teamCount'),groupCount=document.getElementById('groupCount'),matchCount=document.getElementById('matchCount');
  if(teamCount)teamCount.textContent=String(data.teamCount??12);
  if(groupCount)groupCount.textContent=String(data.groupCount??3);
  if(matchCount)matchCount.textContent=String(data.matchCount??26);

  const venue=document.querySelector('.kvl1180-kpi.is-venue .kvl1180-kpi-copy');
  if(venue){
    const strong=venue.querySelector('strong'),small=venue.querySelector('small');
    const region=[data.hostCountry,data.hostRegion].filter(Boolean).join(' ');
    if(strong&&region)strong.textContent=region;
    if(small&&(data.venueKo||data.venue))small.textContent=data.venueKo||data.venue;
  }
}
function enrichOverview(){
  const result=document.querySelector('.kvl1180-view[data-view="overview"] .kvl1180-overview-result');
  if(result){
    const strong=result.querySelector('strong'),sub=result.querySelector('span');
    if(strong)strong.textContent=`우승 ${data.champion||'태국'}`;
    if(sub)sub.textContent='LA28 올림픽 직행';
  }
  const note=document.querySelector('.kvl1180-overview-note');
  if(note)note.innerHTML='<strong>2026 여자부 대회는 종료되었습니다.</strong><br>태국이 중국을 결승에서 3-2로 꺾고 우승했으며 2028 LA 올림픽 아시아 직행 출전권을 획득했습니다.';
  const wc=document.querySelector('.kvl1180-stake.is-wc');
  if(wc&&!wc.querySelector('.kvl1180-stake-confirmed')){
    const teams=(data.podium||[]).slice(0,3).map(x=>x.team).filter(Boolean);
    if(teams.length===3){const d=document.createElement('div');d.className='kvl1180-stake-confirmed';d.innerHTML=`<strong>대회 결과</strong><span>${teams.map(esc).join(' · ')}</span>`;wc.appendChild(d)}
  }
}
function enrichSchedule(){
  const matches=data?.matches||[];
  const section=document.querySelector('#schedule')||document.querySelector('.kvl1180-view[data-view="schedule"]');
  if(!section)return;
  if(!section.id)section.id='schedule';

  const headNote=section.querySelector('.kvl1180-section-head>p');
  if(headNote&&data.timezoneNote)headNote.textContent='한국시간(KST)을 기준으로 중국 현지시간(UTC+8)을 함께 표시합니다.';

  const done=matches.filter(completed).length;
  const stageOrder=['조별리그','8강','준결승','3위결정전','결승'];
  const stageCounts=stageOrder.map(stage=>[stage,matches.filter(m=>m.stage===stage).length]).filter(([,count])=>count>0);
  let statusLine=section.querySelector('.kvl1180-schedule-statusline');
  if(!statusLine){statusLine=document.createElement('div');statusLine.className='kvl1180-schedule-statusline';section.querySelector('.kvl1180-section-head')?.after(statusLine)}
  if(statusLine)statusLine.innerHTML=`<strong>${done===matches.length?'전체 일정 종료':'일정 진행 중'} · ${done}/${matches.length} 경기 결과 반영</strong><span>${stageCounts.map(([stage,count])=>`${esc(stage)} ${count}`).join(' · ')}</span>`;

  section.querySelectorAll('.kvl1180-match-row').forEach(row=>{
    const timeEl=row.querySelector('.kvl1180-match-meta time');
    if(!timeEl)return;
    const t=text(timeEl).replace(/\s*KST\s*$/,'');
    const rowText=text(row);
    const m=matches.find(x=>String(x.time)===t&&rowText.includes(x.teamA)&&rowText.includes(x.teamB));
    if(!m)return;
    row.dataset.matchId=m.id||'';
    row.setAttribute('aria-label',`${m.date} ${m.time} KST ${m.teamA} ${m.setsA}-${m.setsB} ${m.teamB}`);
    if(!row.querySelector('.kvl1180-match-official-no')){const no=document.createElement('span');no.className='kvl1180-match-official-no';no.textContent=`Match #${m.officialNo}`;timeEl.after(no)}
    const detail=row.querySelector('.kvl1180-match-detail');
    if(detail){const venue=data.venueKo||data.venue||'';detail.textContent=`${m.stage}${m.group?` · ${m.group}조`:''} · ${venue} · 중국 현지 ${m.localTime||'—'} (UTC+8)`}
  });

  const target=new URLSearchParams(location.search).get('date');
  section.querySelectorAll('.kvl1180-date-group').forEach(group=>group.classList.toggle('is-target-date',Boolean(target)&&group.id===`date-${target}`));
}
function enrichGroups(){
  const seedByTeam=new Map((data?.combinedSeeds||[]).map(x=>[x.team,Number(x.seed)||null]));
  const qf=qfMap();
  document.querySelectorAll('#groups .kvl1180-pool-row').forEach(row=>{
    const team=text(row.querySelector('.kvl1180-pool-team-copy strong'));
    const small=row.querySelector('.kvl1180-pool-team-copy small');
    if(!team||!small)return;
    const seed=seedByTeam.get(team),code=TEAM_CODE[team]||'';
    small.innerHTML=seed?`${esc(code)} <b class="kvl1180-pool-seed">${seed}번 시드</b>`:`${esc(code)} <b class="kvl1180-pool-seed is-out">탈락</b>`;
  });
  document.querySelectorAll('#groups .kvl1180-combined-row').forEach(row=>{
    const team=text(row.querySelector('.kvl1180-combined-team-copy strong'));
    const slot=row.lastElementChild;
    const q=qf.get(team);
    if(!slot||!q||slot.querySelector('.kvl1180-qf-pairing'))return;
    const s=document.createElement('small');s.className='kvl1180-qf-pairing';s.textContent=`${q.seed}-${q.opponentSeed}`;slot.appendChild(s);
  });
  const section=document.querySelector('#groups');
  if(section&&!section.querySelector('.kvl1180-ranking-rule-card')){
    const block=section.querySelector('.kvl1180-combined-block')||section.lastElementChild;
    const rule=document.createElement('div');rule.className='kvl1180-ranking-rule-card';
    rule.innerHTML='<strong>순위 계산 기준</strong><p>조별 순위는 승리 경기 수 → 승점 → 세트 득실률 → 득점 득실률 순으로 계산합니다. 예선 종합순위는 조 순위를 우선한 뒤 같은 조 순위끼리 세부 성적을 비교하며, 최종 8강 시드는 공식 확정 대진과 교차검수합니다.</p>';
    block?.after(rule);
  }
}
function enrichFinal(){
  document.querySelectorAll('#knockout .kvl1180-final-card').forEach(card=>{
    const rank=Number(text(card.querySelector('.kvl1180-final-rank')).replace(/[^0-9]/g,''));
    const small=card.querySelector('.kvl1180-final-copy small');
    if(rank&&small&&FINAL_NOTE[rank])small.textContent=FINAL_NOTE[rank];
  });
}
function enrichParticipants(){
  const pending=document.querySelector('#rosters .kvl1180-roster-pending');
  if(pending)pending.innerHTML='<strong>참가국 정보 반영 완료 · 선수명단은 별도 구축</strong><br>2026 여자부 실제 참가 12개국과 조 편성은 대회 MASTER 기준으로 반영했습니다. 국가별 등록 선수명단 MASTER가 확정되면 Player ID 기준으로 이 화면에 추가 연결합니다.';
}
function enrichSources(){
  const section=document.querySelector('#resources');
  const count=section?.querySelectorAll('.kvl1180-source').length||0;
  if(section&&count)section.dataset.sourceCount=String(count);
}
function apply(){
  if(!data)return;
  enrichTournamentMeta();enrichOverview();enrichSchedule();enrichGroups();enrichFinal();enrichParticipants();enrichSources();
}
function queue(){clearTimeout(applyTimer);applyTimer=setTimeout(apply,30)}
fetch(DATA,{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject(r.status)).then(json=>{
  data=json;apply();
  const main=document.querySelector('.kvl1180-main');
  if(main){const ob=new MutationObserver(queue);ob.observe(main,{subtree:true,childList:true});setTimeout(()=>ob.disconnect(),5000)}
}).catch(()=>{});
})();
