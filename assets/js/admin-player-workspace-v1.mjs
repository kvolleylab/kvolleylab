import {createClient} from '../vendor/supabase-js-2.84.0.mjs';
import {searchPlayers,escapeHTML as e} from './player-workspace-core.mjs?v=20261111-pro-1';

const SUPABASE_URL='https://byaukvbwdhextiqycrds.supabase.co';
const SUPABASE_KEY='sb_publishable_DKeCLeLwQ3xEpgsRzbU7qA_oFKjc6HM';
const FUNCTION_NAME='admin-player-workspace';
const MATCH_SOURCES=[
  {key:'v-league-men-2026-27',label:'V-리그 남자부',url:'data/competitions/v-league-men-2026-27/data.json'},
  {key:'v-league-women-2026-27',label:'V-리그 여자부',url:'data/competitions/v-league-women-2026-27/data.json'}
];
const supabase=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
let players=[],byId=new Map(),bookmarks=new Set(),notes=[],analyses=[],matchAnalyses=[],matchCatalog=[],currentView='search',analysisMode='player';

function msg(text='',error=false){const el=$('workspaceMessage');el.textContent=text;el.classList.toggle('error',error)}
function loginMsg(text='',error=false){const el=$('loginMessage');el.textContent=text;el.classList.toggle('error',error)}
function normalize(p){return {...p,id:p.playerId||p.id,name:p.nameKo||p.name||p.nameEn||p.playerId,team:p.team||p.club||'',school:p.school||'',rawPosition:p.rawPosition||p.position||'',gender:p.gender||''}}
function pname(id){return byId.get(id)?.name||id}
function affiliation(p){return p?.school||p?.team||p?.club||'소속 미확인'}
function affiliationGrade(p){
  const base=affiliation(p),grade=p?.gradeLabel||(p?.grade?String(p.grade)+'학년':'');
  return grade&&base!=='소속 미확인'?base+' · '+grade:base;
}
function playerMeta(p){return [affiliationGrade(p),p?.rawPosition||'포지션 미확인',p?.gender?(p.gender==='W'?'여자':'남자'):''].filter(Boolean)}
function levelLabel(p){
  if(p?.currentPro)return '프로';
  const map={university:'대학',high_school:'고교',middle_school:'중학',international:'국제',national:'대표팀',domestic:'국내'};
  return map[p?.level]||'선수';
}
function profileHref(id){return 'player.html?id='+encodeURIComponent(id)+'&admin=1&return='+encodeURIComponent('admin-player-workspace.html')}
function formatDate(value){const d=new Date(value);return Number.isNaN(d.getTime())?String(value||''):d.toLocaleString('ko-KR')}

async function api(action,payload={}){
  const {data,error}=await supabase.functions.invoke(FUNCTION_NAME,{body:{action,...payload}});
  if(error)throw new Error(error.message||'관리자 서버 요청에 실패했습니다.');
  if(!data?.ok)throw new Error(data?.error||'관리자 권한을 확인할 수 없습니다.');
  return data;
}
function updateCounts(){
  const bm=bookmarks.size,nt=notes.length,pt=analyses.length,pc=analyses.filter(x=>x.publication_status==='member_candidate').length;
  const mt=matchAnalyses.length,mc=matchAnalyses.filter(x=>x.publication_status==='member_candidate').length,total=pt+mt;
  $('bookmarkCount').textContent=String(bm);$('noteCount').textContent=String(nt);
  $('bookmarkTabCount').textContent=bm?String(bm):'';$('noteTabCount').textContent=nt?String(nt):'';
  $('analysisCount').textContent=String(total);$('analysisPlayerCount').textContent=String(pt);$('matchAnalysisCount').textContent=String(mt);$('analysisTabCount').textContent=total?String(total):'';
  $('analysisTotalCount').textContent=String(pt);$('analysisPrivateCount').textContent=String(pt-pc);$('analysisCandidatePaneCount').textContent=String(pc);
  $('matchAnalysisTotalCount').textContent=String(mt);$('matchAnalysisPrivateCount').textContent=String(mt-mc);$('matchAnalysisCandidateCount').textContent=String(mc);
}
function updateNoteSeasonOptions(){
  const select=$('noteSeasonFilter'),previous=select.value;
  const seasons=[...new Set(notes.map(n=>n.season).filter(Boolean))].sort((a,b)=>b.localeCompare(a,'ko'));
  select.innerHTML='<option value="">전체 시즌</option>'+seasons.map(s=>`<option value="${e(s)}">${e(s)}</option>`).join('');
  select.value=seasons.includes(previous)?previous:'';
}
function updateAnalysisSeasonOptions(){
  const select=$('analysisSeasonFilter'),previous=select.value;
  const seasons=[...new Set(analyses.map(a=>a.season).filter(Boolean))].sort((a,b)=>b.localeCompare(a,'ko'));
  select.innerHTML='<option value="">전체 시즌</option>'+seasons.map(s=>`<option value="${e(s)}">${e(s)}</option>`).join('');
  select.value=seasons.includes(previous)?previous:'';
}
async function refreshState(){
  const [status,bm,ns,as,ms]=await Promise.all([api('status'),api('list_bookmarks'),api('list_notes'),api('list_analyses'),api('list_match_analyses')]);
  bookmarks=new Set((bm.items||[]).map(x=>x.player_id));notes=ns.items||[];analyses=as.items||[];matchAnalyses=ms.items||[];
  updateCounts();updateNoteSeasonOptions();updateAnalysisSeasonOptions();renderCurrent();
}
function showWorkspace(user){$('accountEmail').textContent=user.email||'관리자';$('loginView').hidden=true;$('workspaceView').hidden=false}
function showLogin(){$('workspaceView').hidden=true;$('loginView').hidden=false;$('password').value=''}

function row(p){
  const saved=bookmarks.has(p.id),aff=affiliationGrade(p),position=p.rawPosition||'포지션 미확인';
  const facts=[
    position,
    p.height?`${p.height}cm`:'',
    p.jersey!==undefined&&p.jersey!==null&&p.jersey!==''?`#${p.jersey}`:'',
    p.gender?(p.gender==='W'?'여자':'남자'):''
  ].filter(Boolean);
  return `<article class="player-row ${p.gender==='W'?'player-row-women':'player-row-men'}">
    <div class="player-avatar" aria-hidden="true">${e((p.name||'K').slice(0,1))}</div>
    <div class="player-main">
      <div class="player-title"><strong>${e(p.name)}</strong><span class="player-level-badge">${e(levelLabel(p))}</span>${p.currentPro?'<span class="current-roster-badge">2026-27 등록</span>':''}</div>
      <div class="player-affiliation">${e(aff)}</div>
      <div class="player-facts">${facts.map(x=>`<span>${e(x)}</span>`).join('')}</div>
    </div>
    <div class="row-actions">
      <button class="bookmark ${saved?'saved':''}" type="button" data-bookmark="${e(p.id)}">${saved?'★ 관심선수':'☆ 관심선수'}</button>
      <button class="note-button" type="button" data-note-player="${e(p.id)}">메모</button>
      <a class="profile-link profile-link-primary" href="${e(profileHref(p.id))}">프로필</a>
    </div>
  </article>`;
}
function renderSearch(){
  if(!players.length)return;
  const level=$('levelFilterAdmin').value,team=$('teamFilterAdmin').value,query=$('playerQuery').value.trim();
  const proKeyword=/^(?:프로|프로배구|v-?리그)$/i.test(query);
  const currentProOnly=level==='professional_current'||(!level&&proKeyword);
  const baseLevel=currentProOnly?'':level;
  let result=searchPlayers(players,{q:proKeyword&&currentProOnly?'':query,gender:$('genderFilter').value,level:baseLevel});
  if(currentProOnly)result=result.filter(p=>p.currentPro===true);
  if(team)result=result.filter(p=>p.currentPro===true&&p.team===team);
  result=result.slice(0,80);
  const scope=currentProOnly?' · 2026-27 V-리그 등록선수':'';
  $('searchCount').textContent=`검색 결과 ${result.length.toLocaleString('ko-KR')}명${scope}${result.length===80?' · 최대 80명 표시':''}`;
  $('searchResults').innerHTML=result.length?result.map(row).join(''):'<div class="empty"><strong>조건에 맞는 선수가 없습니다.</strong><span>분류·팀·성별 조건을 확인해 주세요.</span></div>';
}
function renderBookmarks(){
  const rows=[...bookmarks].map(id=>byId.get(id)).filter(Boolean).sort((a,b)=>a.name.localeCompare(b.name,'ko'));
  $('bookmarkResults').innerHTML=rows.length?rows.map(row).join(''):'<div class="empty"><strong>아직 관심선수가 없습니다.</strong><span>선수 검색에서 ☆ 관심선수를 눌러 추적 목록을 만들어보세요.</span></div>';
}
function filteredNotes(){
  const q=$('noteQuery').value.trim().toLocaleLowerCase(),season=$('noteSeasonFilter').value;
  return notes.filter(n=>{
    const p=byId.get(n.player_id),hay=[n.title,n.body,n.season,p?.name,affiliation(p),n.player_id].join(' ').toLocaleLowerCase();
    return (!q||hay.includes(q))&&(!season||n.season===season);
  });
}
function renderNotes(){
  const list=filteredNotes();$('noteFilterCount').textContent=`${list.length.toLocaleString('ko-KR')}개 표시`;
  $('noteResults').innerHTML=list.length?list.map(n=>{
    const p=byId.get(n.player_id),meta=playerMeta(p),created=formatDate(n.created_at),updated=formatDate(n.updated_at);
    const changed=String(n.created_at||'')!==String(n.updated_at||'');
    return `<article class="note-card">
      <div class="note-card-top">
        <div class="note-owner">
          <div class="note-owner-avatar" aria-hidden="true">${e((pname(n.player_id)||'K').slice(0,1))}</div>
          <div>
            <div class="note-player"><strong>${e(pname(n.player_id))}</strong><span class="season-pill">${e(n.season||'시즌 미지정')}</span></div>
            <div class="note-player-meta">${meta.map(x=>`<span>${e(x)}</span>`).join('')}</div>
          </div>
        </div>
        <div class="note-date-stack"><span>작성 ${e(created)}</span>${changed?`<b>수정 ${e(updated)}</b>`:''}</div>
      </div>
      <div class="note-card-body">
        <h3>${e(n.title)}</h3>
        <p>${e(n.body)}</p>
      </div>
      <footer>
        <a href="${e(profileHref(n.player_id))}">선수 프로필</a>
        <button type="button" data-edit-note="${e(n.id)}">메모 수정</button>
      </footer>
    </article>`;
  }).join(''):'<div class="empty"><strong>조건에 맞는 메모가 없습니다.</strong><span>검색어 또는 시즌 필터를 바꾸거나 선수 검색에서 새 메모를 작성하세요.</span></div>';
}

function filteredAnalyses(){
  const q=$('analysisQuery').value.trim().toLocaleLowerCase(),season=$('analysisSeasonFilter').value,status=$('analysisStatusFilter').value;
  return analyses.filter(a=>{
    const p=byId.get(a.player_id),hay=[a.title,a.summary,a.strengths,a.improvements,a.tactical_notes,a.recent_changes,a.season,p?.name,affiliation(p)].join(' ').toLocaleLowerCase();
    return (!q||hay.includes(q))&&(!season||a.season===season)&&(!status||a.publication_status===status);
  });
}
function analysisSection(label,value){
  if(!value)return'';
  return `<div class="analysis-card-section"><small>${e(label)}</small><p>${e(value)}</p></div>`;
}
function renderPlayerAnalysis(){
  updateCounts();
  const list=filteredAnalyses();$('analysisFilterCount').textContent=`${list.length.toLocaleString('ko-KR')}개 분석 표시`;
  $('analysisResults').innerHTML=list.length?list.map(a=>{
    const p=byId.get(a.player_id),meta=playerMeta(p),candidate=a.publication_status==='member_candidate',linked=(a.related_note_ids||[]).map(id=>notes.find(n=>n.id===id)).filter(Boolean);
    return `<article class="analysis-card">
      <div class="analysis-card-head">
        <div>
          <div class="analysis-card-labels"><span class="season-pill">${e(a.season||'시즌 미지정')}</span><span class="analysis-state ${candidate?'candidate':'private'}">${candidate?'회원 공개 후보':'나만 보기'}</span></div>
          <h3>${e(a.title)}</h3>
          <strong class="analysis-player-name">${e(pname(a.player_id))}</strong>
          <div class="note-player-meta">${meta.map(x=>`<span>${e(x)}</span>`).join('')}</div>
        </div>
        <button type="button" data-edit-analysis="${e(a.id)}">수정</button>
      </div>
      <div class="analysis-summary"><small>핵심 요약</small><p>${e(a.summary)}</p></div>
      <div class="analysis-card-sections">
        ${analysisSection('장점',a.strengths)}
        ${analysisSection('보완점',a.improvements)}
        ${analysisSection('전술적 특징',a.tactical_notes)}
        ${analysisSection('최근 변화',a.recent_changes)}
      </div>
      ${linked.length?`<div class="analysis-linked-notes"><small>연결 메모 ${linked.length}개</small>${linked.map(n=>`<span>${e(n.season)} · ${e(n.title)}</span>`).join('')}</div>`:''}
      <footer><span>최근 수정 ${e(formatDate(a.updated_at))}</span><span>revision ${e(a.revision)}</span></footer>
    </article>`;
  }).join(''):'<div class="empty"><strong>작성된 선수 분석이 없습니다.</strong><span>선수 검색 또는 관심선수에서 ‘선수 분석’을 눌러 첫 분석을 작성하세요.</span></div>';
}
function competitionLabel(key){return MATCH_SOURCES.find(x=>x.key===key)?.label||key}
function matchKey(item){return item.competitionKey+':'+item.id}
function matchByIdentity(competitionKey,matchId){return matchCatalog.find(m=>m.competitionKey===competitionKey&&m.id===matchId)}
function matchScoreText(m){
  if(m?.score&&Number.isFinite(Number(m.score.home))&&Number.isFinite(Number(m.score.away)))return String(m.score.home)+'-'+String(m.score.away);
  return m?.status==='scheduled'?'예정':'';
}
function matchDisplay(m){
  if(!m)return'경기 정보 없음';
  const score=matchScoreText(m),result=score?' · '+score:'';
  return [m.date,m.time,m.stage,m.homeName+' vs '+m.awayName+result,m.venue].filter(Boolean).join(' · ');
}
function filteredMatchAnalyses(){
  const q=$('matchAnalysisQuery').value.trim().toLocaleLowerCase(),competition=$('matchAnalysisCompetitionFilter').value,type=$('matchAnalysisTypeFilter').value,status=$('matchAnalysisStatusFilter').value;
  return matchAnalyses.filter(a=>{
    const current=matchByIdentity(a.competition_key,a.match_id);
    const hay=[a.title,a.summary,a.serve_receive,a.attack_plan,a.block_defense,a.rotation_matchups,a.key_points,a.result_review,a.home_name,a.away_name,current?.homeName,current?.awayName,a.stage,a.venue].join(' ').toLocaleLowerCase();
    return (!q||hay.includes(q))&&(!competition||a.competition_key===competition)&&(!type||a.analysis_type===type)&&(!status||a.publication_status===status);
  });
}
function matchAnalysisSection(label,value){
  if(!value)return'';
  return '<div class="analysis-card-section"><small>'+e(label)+'</small><p>'+e(value)+'</p></div>';
}
function renderMatchAnalysis(){
  updateCounts();
  const list=filteredMatchAnalyses();$('matchAnalysisFilterCount').textContent=list.length.toLocaleString('ko-KR')+'개 경기 분석 표시';
  $('matchAnalysisResults').innerHTML=list.length?list.map(a=>{
    const current=matchByIdentity(a.competition_key,a.match_id);
    const candidate=a.publication_status==='member_candidate',typeLabel=a.analysis_type==='post_match'?'사후리뷰':'사전분석';
    const home=current?.homeName||a.home_name||a.home_code,away=current?.awayName||a.away_name||a.away_code;
    const date=current?.date||a.match_date||'',time=current?.time||a.match_time||'',stage=current?.stage||a.stage||'',venue=current?.venue||a.venue||'',score=matchScoreText(current);
    const linkedPlayers=(a.related_player_analysis_ids||[]).map(id=>analyses.find(x=>x.id===id)).filter(Boolean);
    const linkedNotes=(a.related_note_ids||[]).map(id=>notes.find(x=>x.id===id)).filter(Boolean);
    return '<article class="analysis-card match-analysis-card">'+
      '<div class="analysis-card-head"><div>'+
      '<div class="analysis-card-labels"><span class="season-pill">'+e(a.season||'시즌 미지정')+'</span><span class="match-type-badge '+(a.analysis_type==='post_match'?'post':'pre')+'">'+typeLabel+'</span><span class="analysis-state '+(candidate?'candidate':'private')+'">'+(candidate?'회원 공개 후보':'나만 보기')+'</span></div>'+
      '<h3>'+e(a.title)+'</h3><strong class="match-analysis-teams">'+e(home)+' <span>vs</span> '+e(away)+(score?' <em>'+e(score)+'</em>':'')+'</strong>'+
      '<div class="match-analysis-meta">'+[date,time,stage,venue,competitionLabel(a.competition_key)].filter(Boolean).map(x=>'<span>'+e(x)+'</span>').join('')+'</div>'+
      '</div><button type="button" data-edit-match-analysis="'+e(a.id)+'">수정</button></div>'+
      '<div class="analysis-summary"><small>핵심 요약</small><p>'+e(a.summary)+'</p></div>'+
      '<div class="analysis-card-sections">'+
      matchAnalysisSection('서브·리시브',a.serve_receive)+matchAnalysisSection('공격 계획',a.attack_plan)+matchAnalysisSection('블로킹·수비',a.block_defense)+matchAnalysisSection('로테이션 매치업',a.rotation_matchups)+matchAnalysisSection('핵심 체크포인트',a.key_points)+matchAnalysisSection('결과 리뷰',a.result_review)+
      '</div>'+
      ((linkedPlayers.length||linkedNotes.length)?'<div class="analysis-linked-notes"><small>연결 자료</small>' +
        linkedPlayers.map(x=>'<span>선수분석 · '+e(pname(x.player_id))+' · '+e(x.title)+'</span>').join('')+
        linkedNotes.map(x=>'<span>메모 · '+e(pname(x.player_id))+' · '+e(x.title)+'</span>').join('')+'</div>':'')+
      '<footer><span>최근 수정 '+e(formatDate(a.updated_at))+'</span><span>revision '+e(a.revision)+'</span></footer></article>';
  }).join(''):'<div class="empty"><strong>작성된 경기 분석이 없습니다.</strong><span>‘새 경기 분석’에서 V-리그 경기를 선택해 사전분석 또는 사후리뷰를 작성하세요.</span></div>';
}
function renderAnalysisMode(){
  $('playerAnalysisPanel').hidden=analysisMode!=='player';
  $('matchAnalysisPanel').hidden=analysisMode!=='match';
  document.querySelectorAll('[data-analysis-mode]').forEach(b=>b.classList.toggle('active',b.dataset.analysisMode===analysisMode));
  analysisMode==='player'?renderPlayerAnalysis():renderMatchAnalysis();
}
function setAnalysisMode(next){
  if(!['player','match'].includes(next))return;
  analysisMode=next;renderAnalysisMode();
}
function populateMatchTeamFilter(selected=''){
  const competition=$('matchCompetitionSelect').value;
  const teams=new Map();
  for(const m of matchCatalog.filter(x=>x.competitionKey===competition)){teams.set(m.homeCode,m.homeName);teams.set(m.awayCode,m.awayName)}
  $('matchTeamFilter').innerHTML='<option value="">전체 팀</option>'+[...teams.entries()].sort((a,b)=>a[1].localeCompare(b[1],'ko')).map(([code,name])=>'<option value="'+e(code)+'">'+e(name)+'</option>').join('');
  $('matchTeamFilter').value=teams.has(selected)?selected:'';
}
function populateMatchSelect(selectedId=''){
  const competition=$('matchCompetitionSelect').value,team=$('matchTeamFilter').value;
  const rows=matchCatalog.filter(m=>m.competitionKey===competition&&(!team||m.homeCode===team||m.awayCode===team)).sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time));
  $('matchSelect').innerHTML='<option value="">경기 선택</option>'+rows.map(m=>'<option value="'+e(m.id)+'">'+e([m.date,m.stage,m.homeName+' vs '+m.awayName,matchScoreText(m)].filter(Boolean).join(' · '))+'</option>').join('');
  if(rows.some(m=>m.id===selectedId))$('matchSelect').value=selectedId;
  else if(!selectedId){
    const today=new Date().toISOString().slice(0,10),future=[...rows].filter(m=>m.date>=today).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
    const preferred=future[0]||rows[0];if(preferred)$('matchSelect').value=preferred.id;
  }
  renderSelectedMatch();
}
function selectedMatch(){
  return matchByIdentity($('matchCompetitionSelect').value,$('matchSelect').value);
}
function renderSelectedMatch(){
  const m=selectedMatch();
  $('matchSelectedSummary').innerHTML=m?'<strong>'+e(m.homeName)+' vs '+e(m.awayName)+(matchScoreText(m)?' · '+e(matchScoreText(m)):'')+'</strong><span>'+e([m.date,m.time,m.stage,m.venue,m.status==='final'?'종료':'예정'].filter(Boolean).join(' · '))+'</span>':'경기를 선택하면 날짜·대진·장소·현재 결과를 표시합니다.';
}
function renderMatchLinks(selectedAnalyses=[],selectedNotes=[]){
  const aSet=new Set(selectedAnalyses),nSet=new Set(selectedNotes);
  $('matchRelatedPlayerAnalyses').innerHTML=analyses.length?analyses.map(a=>'<label class="analysis-note-option"><input type="checkbox" name="matchRelatedPlayerAnalysis" value="'+e(a.id)+'" '+(aSet.has(a.id)?'checked':'')+'><span><b>'+e(pname(a.player_id))+' · '+e(a.season)+' · '+e(a.title)+'</b><small>'+e(formatDate(a.updated_at))+'</small><em>'+e(a.summary)+'</em></span></label>').join(''):'<div class="analysis-note-empty">작성된 선수 분석이 없습니다.</div>';
  $('matchRelatedNotes').innerHTML=notes.length?notes.map(n=>'<label class="analysis-note-option"><input type="checkbox" name="matchRelatedNote" value="'+e(n.id)+'" '+(nSet.has(n.id)?'checked':'')+'><span><b>'+e(pname(n.player_id))+' · '+e(n.season)+' · '+e(n.title)+'</b><small>'+e(formatDate(n.updated_at))+'</small><em>'+e(n.body)+'</em></span></label>').join(''):'<div class="analysis-note-empty">작성된 개인 메모가 없습니다.</div>';
}
function resetMatchAnalysisFields(){
  $('matchAnalysisId').value='';$('matchAnalysisRevision').value='';$('matchAnalysisSeason').value='2026-27';$('matchAnalysisType').value='pre_match';$('matchAnalysisStatus').value='private';$('matchAnalysisTitle').value='';$('matchAnalysisSummary').value='';$('matchServeReceive').value='';$('matchAttackPlan').value='';$('matchBlockDefense').value='';$('matchRotationMatchups').value='';$('matchKeyPoints').value='';$('matchResultReview').value='';$('deleteMatchAnalysisButton').hidden=true;
  for(const id of ['matchCompetitionSelect','matchTeamFilter','matchSelect','matchAnalysisType'])$(id).disabled=false;
}
function openNewMatchAnalysis(){
  resetMatchAnalysisFields();$('matchCompetitionSelect').value='v-league-men-2026-27';populateMatchTeamFilter();populateMatchSelect();renderMatchLinks([],[]);$('matchAnalysisDialogTitle').textContent='새 경기 분석';$('matchAnalysisDialogMeta').textContent='V-리그 경기 선택 · 사전분석 또는 사후리뷰';$('matchAnalysisDialog').showModal();
}
function openMatchAnalysis(id){
  const a=matchAnalyses.find(x=>x.id===id);if(!a)return;
  resetMatchAnalysisFields();$('matchAnalysisId').value=a.id;$('matchAnalysisRevision').value=String(a.revision);$('matchCompetitionSelect').value=a.competition_key;populateMatchTeamFilter();populateMatchSelect(a.match_id);$('matchAnalysisType').value=a.analysis_type;$('matchAnalysisStatus').value=a.publication_status;$('matchAnalysisSeason').value=a.season||'2026-27';$('matchAnalysisTitle').value=a.title||'';$('matchAnalysisSummary').value=a.summary||'';$('matchServeReceive').value=a.serve_receive||'';$('matchAttackPlan').value=a.attack_plan||'';$('matchBlockDefense').value=a.block_defense||'';$('matchRotationMatchups').value=a.rotation_matchups||'';$('matchKeyPoints').value=a.key_points||'';$('matchResultReview').value=a.result_review||'';renderMatchLinks(a.related_player_analysis_ids||[],a.related_note_ids||[]);
  for(const id of ['matchCompetitionSelect','matchTeamFilter','matchSelect','matchAnalysisType'])$(id).disabled=true;
  $('deleteMatchAnalysisButton').hidden=false;$('matchAnalysisDialogTitle').textContent='경기 분석 수정';$('matchAnalysisDialogMeta').textContent=competitionLabel(a.competition_key)+' · '+(a.analysis_type==='post_match'?'사후리뷰':'사전분석');renderSelectedMatch();$('matchAnalysisDialog').showModal();
}
function closeMatchAnalysis(){$('matchAnalysisDialog').close()}

function renderCurrent(){
  if(currentView==='search')renderSearch();
  else if(currentView==='bookmarks')renderBookmarks();
  else if(currentView==='notes')renderNotes();
  else if(currentView==='analysis')renderAnalysisMode();
}
function changeView(next){
  if(!['search','bookmarks','notes','memberPreview','analysis'].includes(next))return;
  currentView=next;
  for(const name of ['search','bookmarks','notes','memberPreview','analysis'])$(name+'Pane').hidden=name!==next;
  document.querySelectorAll('.tabs [data-view]').forEach(b=>{const active=b.dataset.view===next;b.classList.toggle('active',active);active?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current')});
  renderCurrent();window.scrollTo({top:Math.max(0,document.querySelector('.tabs').offsetTop-90),behavior:'smooth'});
}

async function toggleBookmark(id){
  msg(bookmarks.has(id)?'관심 선수에서 해제하는 중…':'관심 선수에 등록하는 중…');
  try{
    const d=await api('toggle_bookmark',{player_id:id});
    d.saved?bookmarks.add(id):bookmarks.delete(id);updateCounts();renderCurrent();
    msg(d.saved?'관심 선수에 등록했습니다.':'관심 선수에서 해제했습니다.');
  }catch(err){msg(err.message,true)}
}

function setNoteMeta(id){
  const p=byId.get(id),parts=playerMeta(p);$('notePlayerMeta').textContent=parts.join(' · ')||'선수 개인 기록';
}
function openPlayerNote(id){
  const p=byId.get(id);
  $('noteId').value='';$('noteRevision').value='';$('notePlayer').value=id;$('notePlayerId').textContent='';
  $('notePlayerName').textContent=(p?.name||id)+' · 선수 메모';setNoteMeta(id);
  $('noteSeason').value='2026-27';$('noteTitle').value='';$('noteBody').value='';$('noteAudit').hidden=true;$('noteAudit').textContent='';$('deleteNoteButton').hidden=true;$('noteDialog').showModal();$('noteTitle').focus();
}
function openNote(id){
  const n=notes.find(x=>x.id===id);if(!n)return;
  $('noteId').value=n.id;$('noteRevision').value=String(n.revision);$('notePlayer').value=n.player_id;$('notePlayerId').textContent='';
  $('notePlayerName').textContent=pname(n.player_id)+' · 선수 메모';setNoteMeta(n.player_id);
  $('noteSeason').value=n.season||'2026-27';$('noteTitle').value=n.title;$('noteBody').value=n.body;
  $('noteAudit').hidden=false;$('noteAudit').textContent='작성 '+formatDate(n.created_at)+' · 최근 수정 '+formatDate(n.updated_at);
  $('deleteNoteButton').hidden=false;$('noteDialog').showModal();
}
function closeNote(){$('noteDialog').close()}
function noteReturnPath(){
  const raw=new URLSearchParams(location.search).get('return');if(!raw)return'';
  try{const url=new URL(raw,location.origin);if(url.origin!==location.origin)return'';return url.pathname.split('/').pop()+url.search+url.hash}catch{return''}
}

function renderRelatedNotes(playerId,selected=[]){
  const chosen=new Set(selected),items=notes.filter(n=>n.player_id===playerId).sort((a,b)=>String(b.updated_at).localeCompare(String(a.updated_at)));
  $('analysisRelatedNotes').innerHTML=items.length?items.map(n=>`<label class="analysis-note-option"><input type="checkbox" name="analysisRelatedNote" value="${e(n.id)}" ${chosen.has(n.id)?'checked':''}><span><b>${e(n.season||'시즌 미지정')} · ${e(n.title)}</b><small>${e(formatDate(n.updated_at))}</small><em>${e(n.body)}</em></span></label>`).join(''):'<div class="analysis-note-empty">이 선수에게 작성된 기존 메모가 없습니다.</div>';
}
function setAnalysisPlayerMeta(id){
  const p=byId.get(id),parts=playerMeta(p);$('analysisPlayerMeta').textContent=parts.join(' · ')||'선수 분석 자료';
}
function resetAnalysisFields(){
  $('analysisId').value='';$('analysisRevision').value='';$('analysisSeason').value='2026-27';$('analysisStatus').value='private';$('analysisTitle').value='';$('analysisSummary').value='';$('analysisStrengths').value='';$('analysisImprovements').value='';$('analysisTactical').value='';$('analysisRecentChanges').value='';$('deleteAnalysisButton').hidden=true;
}
function openPlayerAnalysis(id){
  const p=byId.get(id);resetAnalysisFields();$('analysisPlayer').value=id;$('analysisPlayerName').textContent=(p?.name||id)+' · 선수 분석';setAnalysisPlayerMeta(id);renderRelatedNotes(id,[]);$('analysisDialog').showModal();$('analysisTitle').focus();
}
function openAnalysis(id){
  const a=analyses.find(x=>x.id===id);if(!a)return;
  $('analysisId').value=a.id;$('analysisRevision').value=String(a.revision);$('analysisPlayer').value=a.player_id;$('analysisPlayerName').textContent=pname(a.player_id)+' · 선수 분석';setAnalysisPlayerMeta(a.player_id);
  $('analysisSeason').value=a.season||'2026-27';$('analysisStatus').value=a.publication_status||'private';$('analysisTitle').value=a.title||'';$('analysisSummary').value=a.summary||'';$('analysisStrengths').value=a.strengths||'';$('analysisImprovements').value=a.improvements||'';$('analysisTactical').value=a.tactical_notes||'';$('analysisRecentChanges').value=a.recent_changes||'';renderRelatedNotes(a.player_id,a.related_note_ids||[]);$('deleteAnalysisButton').hidden=false;$('analysisDialog').showModal();
}
function closeAnalysis(){$('analysisDialog').close()}

$('loginForm').addEventListener('submit',async ev=>{
  ev.preventDefault();$('loginButton').disabled=true;loginMsg('관리자 계정을 확인하는 중…');
  try{
    const {error}=await supabase.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});if(error)throw error;
    const {data,error:userError}=await supabase.auth.getUser();if(userError||!data.user)throw userError||new Error('로그인 계정을 확인할 수 없습니다.');
    await api('status');showWorkspace(data.user);loginMsg('');await Promise.all([loadCatalog(),loadMatchCatalog()]);await refreshState();msg('관리자 로그인이 확인됐습니다.');
  }catch(err){await supabase.auth.signOut().catch(()=>{});showLogin();loginMsg(err.message||'로그인에 실패했습니다.',true)}
  finally{$('loginButton').disabled=false}
});
$('logoutButton').addEventListener('click',async()=>{msg('로그아웃 중…');await supabase.auth.signOut();bookmarks.clear();notes=[];analyses=[];matchAnalyses=[];location.href='member-login.html?next='+encodeURIComponent('players.html?member-gate-preview=1')});
$('searchForm').addEventListener('submit',ev=>{ev.preventDefault();renderSearch()});
$('genderFilter').addEventListener('change',renderSearch);
$('levelFilterAdmin').addEventListener('change',()=>{
  const pro=$('levelFilterAdmin').value==='professional_current';
  $('teamFilterAdmin').disabled=!pro;if(!pro)$('teamFilterAdmin').value='';
  renderSearch();
});
$('teamFilterAdmin').addEventListener('change',renderSearch);
let debounce;
$('playerQuery').addEventListener('input',()=>{clearTimeout(debounce);debounce=setTimeout(renderSearch,120)});
$('noteQuery').addEventListener('input',()=>{clearTimeout(debounce);debounce=setTimeout(renderNotes,120)});
$('noteSeasonFilter').addEventListener('change',renderNotes);
$('analysisQuery').addEventListener('input',()=>{clearTimeout(debounce);debounce=setTimeout(renderPlayerAnalysis,120)});
$('analysisSeasonFilter').addEventListener('change',renderPlayerAnalysis);
$('analysisStatusFilter').addEventListener('change',renderPlayerAnalysis);
$('matchAnalysisQuery').addEventListener('input',()=>{clearTimeout(debounce);debounce=setTimeout(renderMatchAnalysis,120)});
$('matchAnalysisCompetitionFilter').addEventListener('change',renderMatchAnalysis);
$('matchAnalysisTypeFilter').addEventListener('change',renderMatchAnalysis);
$('matchAnalysisStatusFilter').addEventListener('change',renderMatchAnalysis);
$('newMatchAnalysisButton').addEventListener('click',openNewMatchAnalysis);
document.querySelector('.analysis-mode-tabs').addEventListener('click',ev=>{const b=ev.target.closest('[data-analysis-mode]');if(b)setAnalysisMode(b.dataset.analysisMode)});
$('matchCompetitionSelect').addEventListener('change',()=>{populateMatchTeamFilter();populateMatchSelect()});
$('matchTeamFilter').addEventListener('change',()=>populateMatchSelect());
$('matchSelect').addEventListener('change',renderSelectedMatch);
$('analysisStartFromSearch').addEventListener('click',()=>{changeView('search');setTimeout(()=>$('playerQuery').focus(),250)});
document.querySelector('.tabs').addEventListener('click',ev=>{const b=ev.target.closest('[data-view]');if(b)changeView(b.dataset.view)});
document.addEventListener('click',ev=>{
  const b=ev.target.closest('button');if(!b)return;
  if(b.dataset.bookmark)toggleBookmark(b.dataset.bookmark);
  if(b.dataset.notePlayer)openPlayerNote(b.dataset.notePlayer);
  if(b.dataset.editNote)openNote(b.dataset.editNote);
  if(b.dataset.analysisPlayer)openPlayerAnalysis(b.dataset.analysisPlayer);
  if(b.dataset.editAnalysis)openAnalysis(b.dataset.editAnalysis);
  if(b.dataset.editMatchAnalysis)openMatchAnalysis(b.dataset.editMatchAnalysis);
});
$('noteClose').addEventListener('click',closeNote);$('cancelNoteButton').addEventListener('click',closeNote);
$('analysisClose').addEventListener('click',closeAnalysis);$('cancelAnalysisButton').addEventListener('click',closeAnalysis);
$('matchAnalysisClose').addEventListener('click',closeMatchAnalysis);$('cancelMatchAnalysisButton').addEventListener('click',closeMatchAnalysis);

$('noteForm').addEventListener('submit',async ev=>{
  ev.preventDefault();
  const payload={id:$('noteId').value||null,expected_revision:$('noteRevision').value?Number($('noteRevision').value):null,player_id:$('notePlayer').value,season:$('noteSeason').value.trim(),title:$('noteTitle').value.trim(),body:$('noteBody').value.trim()};
  if(!payload.title||!payload.body)return;
  msg('메모 저장 중…');
  try{await api('save_note',payload);const back=noteReturnPath();closeNote();await refreshState();if(back){location.href=back;return}changeView('notes');msg('메모를 저장했습니다.')}catch(err){msg(err.message,true)}
});
$('deleteNoteButton').addEventListener('click',async()=>{
  const id=$('noteId').value;if(!id||!confirm('이 메모를 삭제할까요?'))return;
  msg('메모 삭제 중…');
  try{await api('delete_note',{id,expected_revision:Number($('noteRevision').value)});const back=noteReturnPath();closeNote();await refreshState();if(back){location.href=back;return}changeView('notes');msg('메모를 삭제했습니다.')}catch(err){msg(err.message,true)}
});

$('analysisForm').addEventListener('submit',async ev=>{
  ev.preventDefault();
  const related=[...document.querySelectorAll('[name="analysisRelatedNote"]:checked')].map(x=>x.value);
  const payload={
    id:$('analysisId').value||null,
    expected_revision:$('analysisRevision').value?Number($('analysisRevision').value):null,
    player_id:$('analysisPlayer').value,
    season:$('analysisSeason').value.trim(),
    publication_status:$('analysisStatus').value,
    title:$('analysisTitle').value.trim(),
    summary:$('analysisSummary').value.trim(),
    strengths:$('analysisStrengths').value.trim(),
    improvements:$('analysisImprovements').value.trim(),
    tactical_notes:$('analysisTactical').value.trim(),
    recent_changes:$('analysisRecentChanges').value.trim(),
    related_note_ids:related
  };
  if(!payload.season||!payload.title||!payload.summary)return;
  msg('선수 분석 저장 중…');
  try{await api('save_analysis',payload);closeAnalysis();await refreshState();changeView('analysis');msg('선수 분석을 저장했습니다.')}catch(err){msg(err.message,true)}
});
$('deleteAnalysisButton').addEventListener('click',async()=>{
  const id=$('analysisId').value;if(!id||!confirm('이 선수 분석을 삭제할까요?'))return;
  msg('선수 분석 삭제 중…');
  try{await api('delete_analysis',{id,expected_revision:Number($('analysisRevision').value)});closeAnalysis();await refreshState();changeView('analysis');msg('선수 분석을 삭제했습니다.')}catch(err){msg(err.message,true)}
});

for(const dialog of [$('noteDialog'),$('analysisDialog'),$('matchAnalysisDialog')]){
  dialog.addEventListener('click',ev=>{if(ev.target!==dialog)return;if(dialog===$('noteDialog'))closeNote();else if(dialog===$('analysisDialog'))closeAnalysis();else closeMatchAnalysis()});
}


$('matchAnalysisForm').addEventListener('submit',async ev=>{
  ev.preventDefault();const m=selectedMatch();
  if(!m)return msg('분석할 경기를 먼저 선택해주세요.',true);
  const relatedPlayerAnalyses=[...document.querySelectorAll('[name="matchRelatedPlayerAnalysis"]:checked')].map(x=>x.value);
  const relatedNotes=[...document.querySelectorAll('[name="matchRelatedNote"]:checked')].map(x=>x.value);
  const payload={
    id:$('matchAnalysisId').value||null,expected_revision:$('matchAnalysisRevision').value?Number($('matchAnalysisRevision').value):null,
    competition_key:m.competitionKey,match_id:m.id,season:$('matchAnalysisSeason').value.trim(),analysis_type:$('matchAnalysisType').value,
    match_date:m.date||'',match_time:m.time||'',stage:m.stage||'',home_code:m.homeCode||'',home_name:m.homeName||'',away_code:m.awayCode||'',away_name:m.awayName||'',venue:m.venue||'',
    publication_status:$('matchAnalysisStatus').value,title:$('matchAnalysisTitle').value.trim(),summary:$('matchAnalysisSummary').value.trim(),
    serve_receive:$('matchServeReceive').value.trim(),attack_plan:$('matchAttackPlan').value.trim(),block_defense:$('matchBlockDefense').value.trim(),rotation_matchups:$('matchRotationMatchups').value.trim(),key_points:$('matchKeyPoints').value.trim(),result_review:$('matchResultReview').value.trim(),
    related_player_analysis_ids:relatedPlayerAnalyses,related_note_ids:relatedNotes
  };
  if(!payload.title||!payload.summary)return;
  msg('경기 분석 저장 중…');
  try{await api('save_match_analysis',payload);closeMatchAnalysis();await refreshState();analysisMode='match';changeView('analysis');setAnalysisMode('match');msg('경기 분석을 저장했습니다.')}catch(err){msg(err.message,true)}
});
$('deleteMatchAnalysisButton').addEventListener('click',async()=>{
  const id=$('matchAnalysisId').value;if(!id||!confirm('이 경기 분석을 삭제할까요?'))return;
  msg('경기 분석 삭제 중…');
  try{await api('delete_match_analysis',{id,expected_revision:Number($('matchAnalysisRevision').value)});closeMatchAnalysis();await refreshState();analysisMode='match';changeView('analysis');setAnalysisMode('match');msg('경기 분석을 삭제했습니다.')}catch(err){msg(err.message,true)}
});

async function loadMatchCatalog(){
  if(matchCatalog.length)return;
  const bundles=await Promise.all(MATCH_SOURCES.map(async source=>{
    const res=await fetch(source.url,{cache:'no-store'});if(!res.ok)throw new Error(source.url+': '+res.status);
    const data=await res.json(),teams=new Map((data.participants||[]).map(t=>[t.code,t.name||t.fullName||t.code]));
    return (data.matches||[]).map(m=>({competitionKey:source.key,competitionLabel:source.label,id:m.id,date:m.date||'',time:m.time||'',stage:m.stage||m.round||'',homeCode:m.home?.code||'',homeName:teams.get(m.home?.code)||m.home?.code||'',awayCode:m.away?.code||'',awayName:teams.get(m.away?.code)||m.away?.code||'',venue:m.venueLabel||'',status:m.status||'',score:m.score||null}));
  }));
  matchCatalog=bundles.flat();
}
async function loadCatalog(){
  if(players.length)return;
  const catalog=await window.KVLPlayerCatalogReady;if(!Array.isArray(catalog))throw new Error('선수 DB를 불러올 수 없습니다.');
  players=catalog.map(normalize).filter(p=>p.id);byId=new Map(players.map(p=>[p.id,p]));
  const proTeams=[...new Set(players.filter(p=>p.currentPro===true).map(p=>p.team).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko'));
  $('teamFilterAdmin').innerHTML='<option value="">전체 프로팀</option>'+proTeams.map(team=>'<option value="'+e(team)+'">'+e(team)+'</option>').join('');
  const currentProCount=players.filter(p=>p.currentPro===true).length;
  $('catalogStatus').textContent=`전체 ${players.length.toLocaleString('ko-KR')}명 · 현재 프로 ${currentProCount.toLocaleString('ko-KR')}명`;renderSearch();
}
async function restoreSession(){
  try{
    const {data,error}=await supabase.auth.getUser();
    if(error||!data.user){showLogin();return}
    await api('status');showWorkspace(data.user);await Promise.all([loadCatalog(),loadMatchCatalog()]);await refreshState();msg('관리자 세션을 복원했습니다.');
    const q=new URLSearchParams(location.search),notePlayer=q.get('notePlayer'),editNote=q.get('editNote');
    if(notePlayer&&byId.has(notePlayer)){openPlayerNote(notePlayer);q.delete('notePlayer')}
    else if(editNote&&notes.some(n=>n.id===editNote)){openNote(editNote);q.delete('editNote')}
    if(notePlayer||editNote){const url=new URL(location.href);url.search=q.toString();history.replaceState(null,'',url.pathname+(q.toString()?'?'+q.toString():'')+url.hash)}
  }catch{await supabase.auth.signOut().catch(()=>{});showLogin()}
}
restoreSession();