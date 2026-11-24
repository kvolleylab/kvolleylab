/* KVL international national-team unified historical roster v1.
 * Read-only; only merges matching identities backed by the existing tournament sources.
 * This augments, never replaces, the country per-event roster and candidate history. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.KVLInternationalUnifiedRosterV1=api;
})(typeof window==='object'?window:globalThis,function(){
'use strict';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=x=>String(x||'').normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
const fullDOB=x=>/^\d{4}-\d{2}-\d{2}$/.test(String(x||''))?String(x):'';
const pos=x=>['O','OPP'].includes(String(x||'').toUpperCase())?'OP':String(x||'').toUpperCase();
const knownClub=x=>x&&typeof x==='string'&&!['미확인','unknown','-'].includes(norm(x))?x.trim():'';
const leagueText=x=>typeof x==='string'?x.trim():'';
const LEAGUE_FLAGS={Bahrain:'🇧🇭',Belgium:'🇧🇪',Brazil:'🇧🇷',Canada:'🇨🇦',China:'🇨🇳',Czechia:'🇨🇿',Estonia:'🇪🇪',France:'🇫🇷',Germany:'🇩🇪',Greece:'🇬🇷',India:'🇮🇳',Indonesia:'🇮🇩',Iran:'🇮🇷',Italy:'🇮🇹',Japan:'🇯🇵',Kazakhstan:'🇰🇿',Oman:'🇴🇲',Poland:'🇵🇱',Portugal:'🇵🇹',Qatar:'🇶🇦',Romania:'🇷🇴',Russia:'🇷🇺',Serbia:'🇷🇸',Slovenia:'🇸🇮','South Korea':'🇰🇷',Spain:'🇪🇸',Taiwan:'🇹🇼',Thailand:'🇹🇭',Türkiye:'🇹🇷',USA:'🇺🇸',Ukraine:'🇺🇦',Uzbekistan:'🇺🇿',Vietnam:'🇻🇳'};
/* A roster's league country is consistent regardless of whether a league name is verified.
    Preserve the exact verified league name in the model and player detail. */
 const countryLabel=country=>{
   const name=leagueText(country);
   return name?((LEAGUE_FLAGS[name]||'')+(LEAGUE_FLAGS[name]?' ':'')+name.toUpperCase()):'';
 };
 const leagueLabel=p=>countryLabel(p.clubCountry);
const eventOrder=s=>{
  const slug=String(s.competition_slug||'');
  if(slug.startsWith('vnl-'))return 10;
  if(slug.startsWith('asian-games-'))return 20;
  if(slug.includes('continental'))return 30;
  if(slug.includes('cup'))return 40;
  return 50;
};
const important=s=>/^(vnl|asian-games)-/.test(String(s.competition_slug||''));
function volleybox(url){
  try{
    const u=new URL(String(url||''));
    if(u.protocol!=='https:'||!['volleybox.net','www.volleybox.net'].includes(u.hostname))return {id:'',direct:'',search:''};
    const match=u.pathname.match(/^\/(?:ko\/)?[a-z0-9-]+-p([0-9]+)\/?$/i);
    if(match)return{id:match[1],direct:'https://volleybox.net/'+u.pathname.replace(/^\/(?:ko\/)?/,'').replace(/\/$/,''),search:''};
    if(/^\/(?:ko\/)?search\/?$/.test(u.pathname)&&u.searchParams.has('q'))return{id:'',direct:'',search:u.href};
  }catch{}
  return{id:'',direct:'',search:''};
}
const officialLink=url=>{
 try{
  const u=new URL(String(url||''));
  return u.protocol==='https:'&&['en.volleyballworld.com','www.volleyballworld.com','volleyballworld.com'].includes(u.hostname)?u.href:'';
 }catch{return''}
};
function identify(raw){
  const en=String(raw?.en||raw?.name_en||((raw?.nameKo||raw?.name_ko)&&raw?.name)||'').trim();
  const ko=String(raw?.nameKo||raw?.name_ko||raw?.name||raw?.en||raw?.name_en||'').trim();
  const dob=fullDOB(raw?.dob||raw?.birth_date);
  const vb=volleybox(raw?.volleybox||raw?.volleybox_url||'');
  const number=raw?.number!==''&&raw?.number!=null&&Number.isInteger(Number(raw.number))?Number(raw.number):null;
  return {
    en,ko,dob,number,vb,
    position:pos(Array.isArray(raw?.positions)?raw.positions[0]:raw?.position),
    height:Number(raw?.heightCm||raw?.height_cm||raw?.height)||0,
    sourcePlayerId:String(raw?.playerId||raw?.player_id||''),
    entryStatus:String(raw?.entryStatus||''),
    official:officialLink(raw?.officialProfileUrl||raw?.vnlProfile||''),
    club:raw?.club?.confirmed===true?knownClub(raw.club.name):'',
    clubCountry:raw?.club?.confirmed===true?leagueText(raw.club.country||raw.club.leagueCountry):'',
    clubLeague:raw?.club?.confirmed===true?leagueText(raw.club.leagueName):'',
    clubConfirmed:raw?.club?.confirmed===true
  };
}
/* If both sources supply different verified Volleybox IDs, never conflate even
   when names and birthdays match. No DOB => no across-event merging. */
function compatible(group,item){
  if(!group.dob||!item.dob||group.dob!==item.dob)return false;
  if(group.vbIds.size&&item.vb.id&&!group.vbIds.has(item.vb.id))return false;
  if(group.vbIds.size&&item.vb.id&&group.vbIds.has(item.vb.id))return true;
  return !!item.en&&group.names.has(norm(item.en));
}
function build(sourceSets,{country,gender,year,clubRegistry=null,playerClubRegistry=null,volleyboxRegistry=null,profileResolver=null}={}){
  if(!country||!/^[A-Z]{3}$/.test(country.code||'')||!['men','women'].includes(gender)
      ||!Number.isInteger(year)||!Array.isArray(sourceSets))throw Error('Invalid KVL unified roster identity scope');
  const groups=[],events=[];
  const refs=sourceSets.slice().sort((a,b)=>eventOrder(a.snapshot)-eventOrder(b.snapshot)||String(a.snapshot.snapshot_id).localeCompare(String(b.snapshot.snapshot_id)));
  const seenSnapshots=new Set();
  for(const {snapshot,team} of refs){
    if(!snapshot||snapshot.country_code!==country.code||snapshot.gender!==gender||snapshot.year!==year
        ||!Array.isArray(team?.players)||seenSnapshots.has(snapshot.snapshot_id))
      throw Error('Inconsistent tournament roster source scope');
    if(team.players.length!==snapshot.player_count)
      throw Error('Tournament roster count changed; review before unifying: '+snapshot.snapshot_id);
    seenSnapshots.add(snapshot.snapshot_id);
    events.push({id:snapshot.snapshot_id,slug:snapshot.competition_slug,title:snapshot.competition_title,
      count:team.players.length,major:important(snapshot),sourceStatus:snapshot.source_status_label,
      rank:eventOrder(snapshot)});
    const within=new Set();
    for(let idx=0;idx<team.players.length;idx++){
      const raw=team.players[idx];
      const registryBox=snapshot.competition_slug==='avc-men-continental-2026'&&gender==='men'
        ?volleyboxRegistry?.teams?.[country.code]?.[String(raw?.number)]:'';
      const directRegistryBox=volleybox(registryBox).direct;
      const p=identify(directRegistryBox?{...raw,volleybox:directRegistryBox,volleybox_url:directRegistryBox}:raw);
      if(!(p.ko||p.en))throw Error('Missing athlete identity: '+snapshot.snapshot_id+'/'+idx);
      const same=groups.filter(g=>compatible(g,p)&&!g.matches.some(m=>m.id===snapshot.snapshot_id));
      // A source may have two similarly named players: do not select a random match.
      let g=same.length===1?same[0]:null;
      if(!g){
        g={key:'p'+groups.length,en:p.en,ko:p.ko,dob:p.dob,position:p.position,height:p.height,
          number:null,club:'',clubCountry:'',clubLeague:'',clubProof:'',clubAsOf:'',clubVariants:[],names:new Set(p.en?[norm(p.en)]:[]),
          vbIds:new Set(p.vb.id?[p.vb.id]:[]),directBox:p.vb.direct,searchBox:p.vb.search,
          official:p.official,KVLProfile:'',matches:[],evidence:'',ambiguity:same.length>1};
        groups.push(g);
      }
      if(g.matches.some(m=>m.id===snapshot.snapshot_id))throw Error('Duplicate within one tournament source: '+snapshot.snapshot_id);
      if(p.en&&!g.en)g.en=p.en;
      if(p.en)g.names.add(norm(p.en));
      if(p.vb.id)g.vbIds.add(p.vb.id);
      if(p.vb.direct)g.directBox=p.vb.direct;
      if(p.vb.search&&!g.searchBox)g.searchBox=p.vb.search;
      if(p.official)g.official=p.official;
      if(p.ko&&(snapshot.source_format==='team-array'||(!g.ko||g.ko===g.en)))g.ko=p.ko;
      if(p.position&&(snapshot.source_format==='team-array'||!g.position))g.position=p.position;
      if(p.height&&(snapshot.source_format==='team-array'||!g.height))g.height=p.height;
      let club=p.club,clubCountry=p.clubCountry,clubLeague=p.clubLeague,proof=club?'2026 대회 명단 (확인된 소속)':'',asOf='';
      const registered=gender==='men'&&snapshot.competition_slug==='avc-men-continental-2026'
          &&clubRegistry?.teams?.[country.code]?.[String(p.number)];
      if(registered?.status==='CONFIRMED'&&knownClub(registered.club)&&/^https:\/\//.test(registered.source||'')){
        club=registered.club;clubCountry=leagueText(registered.leagueCountry);clubLeague=leagueText(registered.leagueName);proof=registered.source;asOf=registered.checkedAt||'2026-09';
      }
      const current=p.vb.id&&playerClubRegistry?.players?.[p.vb.id];
      if(current&&['CONFIRMED','REVIEWED'].includes(current.status)&&knownClub(current.club)&&/^https:\/\//.test(current.source||'')){
        if(current.dob&&p.dob&&current.dob!==p.dob)throw Error('Current club registry DOB mismatch: '+p.vb.id);
        club=current.club;clubCountry=leagueText(current.leagueCountry);clubLeague=leagueText(current.leagueName);
        proof=current.source;asOf=current.as_of||'';
      }
      if(club){
        if(g.club&&norm(g.club)!==norm(club))g.clubVariants.push({club:g.club,source:g.clubProof||'기존 대회 자료'});
        if(asOf||!g.club){g.club=club;g.clubCountry=clubCountry;g.clubLeague=clubLeague;g.clubProof=proof;g.clubAsOf=asOf}
        else if(g.club!==club)g.clubVariants.push({club,source:proof});
      }
      const profile=typeof profileResolver==='function'?profileResolver(raw,snapshot,p):'';
      if(/^player\.html\?id=KVL-P-\d{6}(?:&scope=national)?$/.test(profile||''))g.KVLProfile=profile;
      g.matches.push({id:snapshot.snapshot_id,slug:snapshot.competition_slug,title:snapshot.competition_title,
        number:p.number,position:p.position,height:p.height,status:p.entryStatus||snapshot.source_status_label,
        sourceUrl:snapshot.source_url||'',club:p.club});
      within.add(idx);
    }
  }
  for(const g of groups){
    const nums=[...new Set(g.matches.filter(m=>m.number!=null).map(m=>m.number))];
    g.number=nums.length===1?'#'+nums[0]:nums.length>1?'대회별':'—';
    g.sortNumber=nums.length?Math.min(...nums):Number.POSITIVE_INFINITY;
    g.count=g.matches.length;
    g.evidence=g.count>1?(g.vbIds.size?'생년월일+동일 Volleybox 선수 ID':'동일 영문 성명+생년월일'):'대회별 원본';
    g.names=undefined;g.vbIds=undefined;
    g.clubVariants=[...new Map(g.clubVariants.map(x=>[x.club,x])).values()];
  }
  groups.sort((a,b)=>a.sortNumber-b.sortNumber||(a.en||a.ko).localeCompare(b.en||b.ko,'en'));
  return {country,gender,year,events,rows:groups,total:groups.length,
    sourceTotal:events.reduce((n,e)=>n+e.count,0),
    note:'대회 공개 명단 포함 이력이며 경기 출전 기록은 아닙니다. 생년월일·직접 선수 페이지 등 동일인 근거가 부족하면 서로 다른 행으로 유지합니다.'};
}
function dots(person,events){
  return events.map(e=>{
    const matched=person.matches.some(m=>m.id===e.id);
    const label=esc(e.title+' · '+(matched?'명단 포함':'이력 미확인'));
    return '<span class="kvl-unified-dot-slot" title="'+label+'" aria-label="'+label+'">'+
      (matched?'<i class="kvl-unified-dot '+(e.major?'is-major':'is-regular')+'" aria-hidden="true"></i>':'<span class="kvl-unified-dot-empty" aria-hidden="true">–</span>')+'</span>';
  }).join('');
}
function render(host,model){
  if(!host||!model||!Array.isArray(model.events)||!Array.isArray(model.rows))throw Error('Invalid unified roster mount');
  let filter='all',query='',selected='';
  const events=model.events;
  const filterLabel=id=>events.find(e=>e.id===id)?.title||'';
  const hasData=events.some(e=>e.count>0);
  host.innerHTML='<div class="kvl-unified"><div class="kvl-unified-top"><div>'+
    '<p class="ktd-section-eyebrow">KVL · ROSTER HISTORY</p>'+
    '<h3>'+esc(model.year)+' 통합 선수명단</h3><p>출처 검증 대회 '+esc(events.length)+'개 · '+esc(model.total)+'명</p>'+
    '</div><div class="kvl-unified-legend">'+events.map(e=>'<span><i class="kvl-unified-dot '+(e.major?'is-major':'is-regular')+'"></i>'+esc(e.title.replace(String(e.year||model.year),'').replace(/^\d{4}\s*/,'').replace(/(?:남자부|여자부)$/,'').trim())+'</span>').join('')+'</div></div>'+
    '<div class="kvl-unified-controls"><div class="kvl-unified-filters" role="group" aria-label="통합 명단 대회 선택">'+
    '<button type="button" data-kvl-unified-filter="all" aria-pressed="true">전체</button>'+
    (events.length>1?'<button type="button" data-kvl-unified-filter="multi" aria-pressed="false">2대회 이상</button>':'')+
    events.map(e=>'<button type="button" data-kvl-unified-filter="'+esc(e.id)+'" aria-pressed="false">'+esc(e.title.replace(/^\d{4}\s*/,'').replace(/(?:남자부|여자부)$/,'').trim())+'</button>').join('')+'</div>'+
    '<label class="kvl-unified-search"><span class="sr-only">통합 선수명단 검색</span><input type="search" placeholder="선수명 검색" data-kvl-unified-search autocomplete="off"></label></div>'+
    '<p class="kvl-unified-count" data-kvl-unified-count role="status"></p>'+
    '<div class="kvl-unified-table"><div class="kvl-unified-head" aria-hidden="true"><span>NO.</span><span>선수명</span><span>생년월일</span><span>POS</span><span>신장</span><span>소속팀</span><span>Volleybox</span><span>참가 이력</span></div>'+
    '<div data-kvl-unified-rows></div></div>'+
    '<div class="kvl-unified-detail" data-kvl-unified-detail aria-live="polite" hidden></div>'+
    '<p class="kvl-unified-note">'+esc(model.note)+' 소속팀은 검증된 2026 대회/시즌 자료 기준이며 현재 실시간 소속으로 단정하지 않습니다.</p></div>';
  const list=host.querySelector('[data-kvl-unified-rows]'),count=host.querySelector('[data-kvl-unified-count]'),
    detail=host.querySelector('[data-kvl-unified-detail]');
  const title=x=>x.ko||x.en||'선수';
  const matches=e=>filter==='all'||filter==='multi'&&e.count>1||e.matches.some(m=>m.id===filter);
  const filtered=()=>model.rows.filter(p=>matches(p)&&(!query||[p.ko,p.en,p.club,p.clubCountry,p.clubLeague].some(v=>norm(v).includes(query))));
  function row(p){
    const name=p.KVLProfile?'<a class="kvl-unified-name-link" href="'+esc(p.KVLProfile)+'"><strong>'+esc(title(p))+'</strong></a>':
      '<strong>'+esc(title(p))+'</strong>';
    const reserve=p.matches.some(m=>/^vnl-/.test(String(m.slug||''))&&/\breserve\b/i.test(String(m.status||'')))
      ?'<span class="kvl-unified-reserve" title="'+esc(model.year+' VNL 예비명단')+'">VNL 예비</span>':'';
    const vb=p.directBox?'<a href="'+esc(p.directBox)+'" class="kvl-unified-volleybox" target="_blank" rel="noopener noreferrer" aria-label="Volleybox 선수 프로필 열기">VB-&gt;</a>':
      p.searchBox?'<a href="'+esc(p.searchBox)+'" class="kvl-unified-volleybox" target="_blank" rel="noopener noreferrer" aria-label="Volleybox 검색 결과 열기">VB 검색</a>':'<span class="kvl-unified-notknown">—</span>';
    const league=leagueLabel(p);
    const club=p.club?'<span class="kvl-unified-club-name">'+esc(p.club)+'</span>'+(league?'<span class="kvl-unified-club-league"'+(p.clubLeague?' title="'+esc('확인된 리그: '+p.clubLeague)+'"':'')+'> · '+esc(league)+'</span>':''):'<em>미확인</em>';
    const facts='<span class="kvl-unified-mobile-facts">'+esc(p.dob||'생년월일 미확인')+' · '+esc(p.position||'—')+' · '+(p.height?esc(p.height)+'cm':'신장 미확인')+'</span>';
    return '<div class="kvl-unified-row'+(selected===p.key?' is-selected':'')+'" data-kvl-unified-athlete="'+esc(p.key)+'" tabindex="0" role="option" aria-selected="'+(selected===p.key)+'">'+
      '<span class="kvl-unified-number">'+esc(p.number)+'</span>'+
      '<span class="kvl-unified-name">'+name+reserve+(p.en&&norm(p.en)!==norm(title(p))?'<small>'+esc(p.en)+'</small>':'')+'</span>'+
      '<span class="kvl-unified-dob">'+esc(p.dob||'—')+'</span><span class="kvl-unified-pos">'+esc(p.position||'—')+'</span>'+
      '<span class="kvl-unified-height">'+(p.height?esc(p.height)+'cm':'—')+'</span>'+facts+
      '<span class="kvl-unified-club" title="'+esc(p.clubProof||'소속팀 미확인')+'">'+club+'</span>'+ 
      '<span class="kvl-unified-vb">'+vb+'</span>'+
      '<span class="kvl-unified-dots" role="group" aria-label="'+esc(title(p))+' 대회별 명단 이력">'+dots(p,events)+'</span></div>';
  }
  function paint(){
    const visible=filtered();
    list.innerHTML=visible.length?visible.map(row).join(''):'<p class="ktd-empty">해당 조건의 등록 명단이 없습니다.</p>';
    count.textContent=visible.length+'명 표시 · '+model.total+'명 통합 · 대회 등록 기록 '+model.sourceTotal+'건';
    host.querySelectorAll('[data-kvl-unified-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.kvlUnifiedFilter===filter)));
    if(!visible.some(p=>p.key===selected)){detail.hidden=true;detail.innerHTML='';selected=''}
  }
  function show(key){
    const p=model.rows.find(x=>x.key===key);if(!p)return;
    selected=p.key;
    detail.hidden=false;
    detail.innerHTML='<div class="kvl-unified-detail-head"><h4>'+esc(title(p))+' <small>'+esc(p.en)+'</small></h4>'+
      '<button type="button" data-kvl-unified-close>닫기 ×</button></div>'+
      '<p>'+esc(p.dob||'생년월일 미확인')+' · '+esc(p.position||'POS 미확인')+' · '+esc(p.evidence)+'</p>'+
      '<div class="kvl-unified-detail-events">'+p.matches.map(x=>{
        const e=events.find(e=>e.id===x.id);
        return '<div class="kvl-unified-detail-event"><strong><i class="kvl-unified-dot '+(e?.major?'is-major':'is-regular')+'"></i>'+esc(x.title)+'</strong>'+
          '<span>'+(x.number!=null?'#'+esc(x.number):'등번호 미확인')+' · '+esc(x.status)+'</span>'+
          '<span>등록 신장: '+(x.height?esc(x.height)+'cm':'미확인')+'</span></div>';
      }).join('')+'</div>'+
      (p.club?'<p>소속 확인: '+esc(p.club)+(leagueLabel(p)?' · '+esc(leagueLabel(p)):'')+(p.clubLeague?' · 리그 '+esc(p.clubLeague):'')+' · '+esc(p.clubAsOf||'대회명단 당시')+'</p>':'')+
      (p.clubVariants.length?'<p>다른 출처의 소속팀 표기: '+esc(p.clubVariants.map(x=>x.club).join(', '))+'</p>':'')+
      '<div class="kvl-unified-detail-links">'+(p.KVLProfile?'<a href="'+esc(p.KVLProfile)+'">KVL 프로필</a>':'')+
      (p.directBox?'<a href="'+esc(p.directBox)+'" target="_blank" rel="noopener noreferrer" aria-label="Volleybox 선수 프로필 열기">VB-&gt;</a>':'')+
      (p.official?'<a href="'+esc(p.official)+'" target="_blank" rel="noopener noreferrer">공식 프로필</a>':'')+'</div>';
    paint();
    detail.hidden=false;
    detail.scrollIntoView({block:'nearest',behavior:'smooth'});
  }
  host.onclick=e=>{
    const button=e.target.closest('[data-kvl-unified-filter]');
    if(button&&host.contains(button)){filter=button.dataset.kvlUnifiedFilter;selected='';detail.hidden=true;paint();return}
    if(e.target.closest('[data-kvl-unified-close]')){selected='';detail.hidden=true;detail.innerHTML='';paint();return}
    if(e.target.closest('a'))return;
    const row=e.target.closest('[data-kvl-unified-athlete]');
    if(row&&host.contains(row))show(row.dataset.kvlUnifiedAthlete);
  };
  host.onkeydown=e=>{
    const row=e.target.closest('[data-kvl-unified-athlete]');
    if(row&&e.target===row&&(e.key==='Enter'||e.key===' ')){e.preventDefault();show(row.dataset.kvlUnifiedAthlete)}
  };
  host.oninput=e=>{if(e.target.matches('[data-kvl-unified-search]')){query=norm(e.target.value);paint()}};
  if(!hasData)list.innerHTML='<p class="ktd-empty">현재 연도에 확인된 대회명단이 없습니다.</p>';
  paint();return {destroy:()=>{host.onclick=null;host.oninput=null;host.onkeydown=null}};
}
return {identify,volleybox,important,compatible,build,dots,render,countryLabel};
});
