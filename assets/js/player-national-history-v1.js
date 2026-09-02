(()=>{
const BASE='data/national/national_team_history_v1.json';
const CONTEXT='data/national/national_team_context_v1.json';
const LINKS='data/national/player_id_links_v1.json';
const LEGACY=['data/national/national_team_history_2018_2019.json','data/national/national_team_history_2016_2017.json','data/national/national_team_history_2014_2015.json','data/national/national_team_roster_2014_u18.json','data/national/national_team_history_2012_2013.json','data/national/national_team_roster_2012_u20.json','data/national/national_team_history_2010_2011.json','data/national/national_team_status_2015_corrections.json','data/national/national_team_world_u23_2015.json','data/national/national_team_roster_2010_u18.json','data/national/national_team_research_2010_u20.json','data/national/national_team_roster_2019_u19.json'];
const id=new URLSearchParams(location.search).get('id')||'';
if(!id)return;
const esc=v=>String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const get=async url=>{try{const r=await fetch(url,{cache:'no-store'});return r.ok?await r.json():null}catch{return null}};
const isAge=level=>/^U\d+$/i.test(String(level||'').trim());
const order=e=>`${String(e?.year||'9999').padStart(4,'0')}-${e?.start_date||'99-99'}`;
const yearOf=d=>String(d||'').slice(0,4);
const waitForGrid=()=>new Promise(resolve=>{const found=()=>document.querySelector('#playerArea .pd-grid');if(found())return resolve(found());const obs=new MutationObserver(()=>{const el=found();if(el){obs.disconnect();resolve(el)}});obs.observe(document.getElementById('playerArea'),{childList:true,subtree:true});setTimeout(()=>{obs.disconnect();resolve(found())},5000)});
function historyHref(e){return `national-team-history.html?scope=${isAge(e.level)?'age':'senior'}&event=${encodeURIComponent(e.event_id)}`}
function dateText(e){if(!e.start_date)return '일정 확인 중';return e.end_date?`${e.start_date} ~ ${e.end_date}`:e.start_date}
async function init(){
  const [base,context,links,...legacy]=await Promise.all([get(BASE),get(CONTEXT),get(LINKS),...LEGACY.map(get)]);
  if(!base)return;
  const db={events:[...(base.events||[])],rosters:[...(base.rosters||[])]};
  const merge=x=>{if(!x)return;db.events=[...(x.events||[]),...db.events];db.rosters=[...(x.rosters||[]),...db.rosters]};
  merge(context);legacy.forEach(merge);
  db.events=db.events.filter((e,i,a)=>e?.event_id&&a.findIndex(x=>x?.event_id===e.event_id)===i);
  const linkMap=new Map((links?.links||[]).map(x=>[`${x.name_ko}|${x.birth_date}`,x.player_id]));
  db.rosters.forEach(r=>{if(!r.player_id){const mapped=linkMap.get(`${r.name_ko}|${r.birth_date}`);if(mapped)r.player_id=mapped}});
  const eventMap=new Map(db.events.map(e=>[e.event_id,e]));
  const seen=new Set(),records=[];
  db.rosters.filter(r=>r.player_id===id).forEach(r=>{const e=eventMap.get(r.event_id);if(!e||seen.has(e.event_id))return;seen.add(e.event_id);records.push({event:e,roster:r})});
  records.sort((a,b)=>order(a.event).localeCompare(order(b.event)));
  if(!records.length)return;
  const grid=await waitForGrid();if(!grid)return;
  if(grid.querySelector('.pd-national-live'))return;
  [...grid.querySelectorAll('.pd-section')].forEach(section=>{if(section.querySelector('h2')?.textContent.trim()==='대표팀 이력')section.remove()});
  const age=records.filter(x=>isAge(x.event.level)),senior=records.filter(x=>!isAge(x.event.level));
  const firstSenior=senior[0]?.event;
  const birthYear=yearOf(records.find(x=>x.roster?.birth_date)?.roster?.birth_date);
  const summary=[`U대표 ${age.length}회`,`성인대표 ${senior.length}회`,firstSenior?`성인 첫 진입 ${firstSenior.year}`:''].filter(Boolean).join(' · ');
  const rows=records.map(({event:e,roster:r})=>`<div class="pd-competition"><div><span class="pd-competition-year">${esc(e.level||'성인')} · ${esc(e.year||'')}</span><strong>${esc(e.competition_name_ko||e.competition_name_en||'대표팀 대회')}</strong><p>${esc([e.organization,dateText(e),r.shirt_no!=null?`#${r.shirt_no}`:'',r.position||'',r.height_cm?`${r.height_cm}cm`:''].filter(Boolean).join(' · '))}</p></div><div class="pd-competition-links"><a href="${historyHref(e)}">히스토리에서 보기</a></div></div>`).join('');
  const cohort=birthYear?`<div class="pd-links" style="margin-bottom:14px"><a href="player-cohort.html?country=KOR&gender=M&birth_year=${encodeURIComponent(birthYear)}">${esc(birthYear)}년생 세대 보기</a></div>`:'';
  const section=document.createElement('article');section.className='pd-card pd-section pd-wide pd-national-live';section.innerHTML=`<h2>국가대표 히스토리</h2><div class="pd-empty" style="margin-bottom:14px">${esc(summary)} · 현재 구축된 공식/검증 대표팀 DB 기준</div>${cohort}<div class="pd-competitions">${rows}</div>`;
  const correction=[...grid.querySelectorAll('.pd-section')].find(x=>x.querySelector('h2')?.textContent.trim()==='정보 정정');
  if(correction)grid.insertBefore(section,correction);else grid.appendChild(section);
}
init();
})();