/* K-Volley Lab team roster standard v1.
 * Team Finder only: preserves existing roster data/renderers and applies the approved
 * quick-scan presentation on top of them.
 */
(function(){
'use strict';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const PLAYER_ID=/^KVL-P-\d{6}$/;

const COUNTRY_ISO2={
 Italy:'it',IT:'it',Japan:'jp',JP:'jp',Poland:'pl',PL:'pl',Türkiye:'tr',Turkey:'tr',TR:'tr',
 Germany:'de',DE:'de',Czechia:'cz',CZ:'cz',France:'fr',FR:'fr',Portugal:'pt',PT:'pt',
 India:'in',IN:'in','South Korea':'kr',Korea:'kr',KR:'kr',Taiwan:'tw',TW:'tw',
 Iran:'ir',IR:'ir',Oman:'om',OM:'om',Greece:'gr',GR:'gr',Brazil:'br',BR:'br',
 Argentina:'ar',AR:'ar',Serbia:'rs',RS:'rs',Slovenia:'si',SI:'si',China:'cn',CN:'cn',
 Canada:'ca',CA:'ca',Belgium:'be',BE:'be',Netherlands:'nl',NL:'nl',Bulgaria:'bg',BG:'bg',
 Cuba:'cu',CU:'cu','United States':'us',USA:'us',US:'us',Bahrain:'bh',BH:'bh',
 Kuwait:'kw',KW:'kw',Qatar:'qa',QA:'qa',Australia:'au',AU:'au',Finland:'fi',FI:'fi',
 Ukraine:'ua',UA:'ua',Romania:'ro',RO:'ro',Spain:'es',ES:'es',Egypt:'eg',EG:'eg',Russia:'ru',RU:'ru',
 Estonia:'ee',EE:'ee',Azerbaijan:'az',AZ:'az','Saudi Arabia':'sa',SA:'sa',
 Indonesia:'id',ID:'id',Philippines:'ph',PH:'ph',Thailand:'th',TH:'th',Vietnam:'vn',VN:'vn','New Zealand':'nz',NZ:'nz'
};
const COUNTRY_KO={
 it:'이탈리아',jp:'일본',pl:'폴란드',tr:'튀르키예',de:'독일',cz:'체코',fr:'프랑스',
 pt:'포르투갈',in:'인도',kr:'대한민국',tw:'대만',ir:'이란',om:'오만',gr:'그리스',
 br:'브라질',ar:'아르헨티나',rs:'세르비아',si:'슬로베니아',cn:'중국',ca:'캐나다',
 be:'벨기에',nl:'네덜란드',bg:'불가리아',cu:'쿠바',us:'미국',bh:'바레인',kw:'쿠웨이트',
 qa:'카타르',au:'호주',fi:'핀란드',ua:'우크라이나',ro:'루마니아',es:'스페인',eg:'이집트',ru:'러시아',
 ee:'에스토니아',az:'아제르바이잔',sa:'사우디아라비아',id:'인도네시아',ph:'필리핀',th:'태국',vn:'베트남',nz:'뉴질랜드'
};
const CLUB_KO={
 'Pallavolo Padova':'파도바',
 'Hiroshima Thunders':'히로시마',
 'Hebei Baoding Wolves':'허베이 바오딩',
 'Cuneo Volley':'쿠네오',
 'MA Acqua S.Bernardo Cuneo':'쿠네오',
 'Panionios GSS':'파니오니오스',
 'ChadorMalu Ardakan':'차도르말루 아르다칸',
 'PGE Projekt Warszawa':'프로젝트 바르샤바',
 'Shahrdari Urmia VC':'샤흐다리 우르미아',
 'Foolad Sirjan Iranian':'풀라드 시르잔',
 'Mes Rafsanjan':'메스 라프산잔',
 'AS Cannes':'AS 칸',
 'VK Lvi Praha':'프라하',
 'Cisterna Volley':'치스테르나',
 'Sporting CP':'스포르팅 CP',
 'Gaziantep Gençlik Spor':'가지안테프',
 'Al Arabi Kuwait':'알 아라비',
 'Al-Seeb':'알 시브',
 'Al-Ahli Bahrain':'알 아흘리',
 'Al-Muharraq':'알 무하라크',
 'Sir Susa Scai Perugia':'페루자',
 'Sir Safety Susa Perugia':'페루자',
 'Sir Sicoma Monini Perugia':'페루자',
 'Paykan Tehran':'파이칸',
 'Mehregan Noor':'메흐레간 누르',
 'Panionios Betsson':'파니오니오스',
 'Panionios VC':'파니오니오스'
};
const LEAGUE_KO={
 'SuperLega':'슈퍼레가','Superlega':'슈퍼레가','Serie A1':'세리에 A1','Serie A2':'세리에 A2',
 'PlusLiga':'플러스리가','TAURON Liga':'타우론 리가','TAURON 1. Liga':'타우론 1.리가','PLS 1. Liga':'PLS 1.리가',
 'Iranian Super League':'이란 슈퍼리그','SMS Grup Efeler Ligi':'에펠레르 리기',
 'SV.LEAGUE':'SV.리그','SV League':'SV.리그','V-League':'V-리그',
 'Ligue A Masculine':'리그 A','Ligue B Masculine':'리그 B','Extraliga mužů':'엑스트랄리가',
 'Prime Volleyball League':'프라임 배구리그','Liga UNA Seguros':'리가 UNA 세구로스',
 'Volley League':'발리리그','Russian Superleague':'러시아 수페르리가','First Division Volleyball League':'1부 배구리그',
 'Chinese Volleyball Super League':'중국 슈퍼리그',
 '1. Bundesliga':'분데스리가','2. Bundesliga':'2. 분데스리가'
};

const iso2=value=>{
 const raw=String(value||'').trim();
 if(/^[A-Za-z]{2}$/.test(raw))return raw.toLowerCase();
 return COUNTRY_ISO2[raw]||'';
};
const countryKo=value=>{
 const code=iso2(value);
 return code&&COUNTRY_KO[code]?COUNTRY_KO[code]:String(value||'').trim();
};
const clubKo=value=>CLUB_KO[String(value||'').trim()]||String(value||'').trim();
const leagueKo=value=>{
 const raw=String(value||'').trim(),exact=LEAGUE_KO[raw],n=raw.toUpperCase();
 if(exact)return exact;
 if(/SUPERLEGA|SUPER LEGA/.test(n))return'슈퍼레가';
 if(/SV\.? ?LEAGUE/.test(n))return'SV.리그';
 if(/PLUSLIGA/.test(n))return'플러스리가';
 if(/EFELER LIGI/.test(n))return'에펠레르 리기';
 if(/IRANIAN SUPER LEAGUE/.test(n))return'이란 슈퍼리그';
 return raw;
};
const leagueTier=(league,country)=>{
 const raw=String(league||'').trim(),n=raw.toUpperCase(),c=String(country||'').toUpperCase();
 if(!raw)return'';
 if(/\b(A1|SERIE A1)\b|SUPERLEGA|SUPER LEGA/.test(n))return'1부';
 if(/\b(A2|SERIE A2)\b/.test(n))return'2부';
 if(/PLUSLIGA|^TAURON LIGA$/.test(n))return'1부';
 if(/TAURON 1\. LIGA|PLS 1\. LIGA/.test(n))return'2부';
 if(/EFELER LIGI/.test(n))return'1부';
 if(/\b1\. LIG\b/.test(n)&&/TURK|TÜRKIYE|TR/.test(c))return'2부';
 if(/SV\. ?LEAGUE|SV LEAGUE/.test(n))return'1부';
 if(/^V-LEAGUE$|^V\.LEAGUE$/.test(n)&&/JAPAN|^JP$/.test(c))return'2부';
 if(/LIGUE A|SPIKELEAGUE/.test(n))return'1부';
 if(/LIGUE B/.test(n))return'2부';
 if(/2\. BUNDESLIGA/.test(n))return'2부';
 if(/BUNDESLIGA/.test(n))return'1부';
 if(/IRANIAN SUPER LEAGUE|RUSSIAN SUPERLEAGUE|PRIME VOLLEYBALL LEAGUE|LIGA UNA SEGUROS|EXTRALIGA|VOLLEY LEAGUE|FIRST DIVISION|CHINESE VOLLEYBALL SUPER LEAGUE/.test(n))return'1부';
 if(/SECOND DIVISION/.test(n))return'2부';
 return'';
};
const fmtDate=value=>{
 const raw=String(value||'').trim();
 return /^\d{4}-\d{2}-\d{2}$/.test(raw)?raw.replaceAll('-','.'):(raw||'—');
};
const average=rows=>{
 const values=(rows||[]).map(p=>Number(p?.heightCm||p?.height||0)).filter(v=>Number.isFinite(v)&&v>0);
 return values.length?(values.reduce((a,b)=>a+b,0)/values.length).toFixed(1)+'cm':'—';
};
const profileId=href=>{
 try{
  const value=String(href||'');
  if(!value)return'';
  const u=new URL(value,location.href),id=u.searchParams.get('id')||'';
  return PLAYER_ID.test(id)?id:'';
 }catch{return''}
};
const privateState=()=>window.KVLTeamRosterPrivateState||null;
function updatePrivateKpis(root){
 if(!root)return;
 const state=privateState(),ids=root._kvlRosterPlayerIds instanceof Set?root._kvlRosterPlayerIds:new Set();
 const interest=root.querySelector('[data-kvl-kpi="interest"]');
 const memo=root.querySelector('[data-kvl-kpi="memo"]');
 const interestHint=root.querySelector('[data-kvl-kpi-hint="interest"]');
 const memoHint=root.querySelector('[data-kvl-kpi-hint="memo"]');
 if(!interest||!memo)return;
 if(state?.ready&&state.authenticated){
  interest.textContent=String([...ids].filter(id=>state.bookmarks?.has(id)).length)+'명';
  memo.textContent=String([...ids].filter(id=>state.notePlayers?.has(id)).length)+'명';
  if(interestHint)interestHint.textContent='내 계정';
  if(memoHint)memoHint.textContent='내 계정';
 }else{
  interest.textContent='—';memo.textContent='—';
  if(interestHint)interestHint.textContent=state?.ready?'로그인 후':'확인 중';
  if(memoHint)memoHint.textContent=state?.ready?'로그인 후':'확인 중';
 }
}
function kpiMarkup(total,avg){
 return '<section class="kvl-roster-kpis" aria-label="선수명단 요약">'+
  '<article><span>선수 인원</span><strong>'+String(total??0)+'명</strong></article>'+
  '<article><span>평균 신장</span><strong>'+esc(avg)+'</strong></article>'+
  '<article class="is-private"><span>관심선수</span><strong data-kvl-kpi="interest">—</strong><small data-kvl-kpi-hint="interest">확인 중</small></article>'+
  '<article class="is-private"><span>메모선수</span><strong data-kvl-kpi="memo">—</strong><small data-kvl-kpi-hint="memo">확인 중</small></article>'+
  '</section>';
}
function setPlayerIds(root,ids){
 root._kvlRosterPlayerIds=new Set((ids||[]).filter(id=>PLAYER_ID.test(String(id||''))));
 updatePrivateKpis(root);
}
function clubMeta(p){
 const country=String(p?.clubCountry||'').trim(),league=String(p?.clubLeague||'').trim();
 const code=iso2(country),tier=leagueTier(league,country);
 const supplemental={
  gr:'assets/images/flags/club/gr.svg',ru:'assets/images/flags/club/ru.svg',
  pt:'assets/images/flags/club/pt.svg',ro:'assets/images/flags/club/ro.svg',es:'assets/images/flags/club/es.svg',
  ee:'assets/images/flags/club/ee.svg',az:'assets/images/flags/club/az.svg',sa:'assets/images/flags/club/sa.svg'
 };
 const flagSrc=code?(supplemental[code]||'assets/images/flags/4x3/'+code+'.svg'):'';
 const flag=flagSrc?'<img class="kvl-roster-league-flag" src="'+esc(flagSrc)+'" alt="" loading="lazy" decoding="async">':'';
 const leagueText=league?leagueKo(league)+(tier?' ('+tier+')':''):'';
 return '<span class="kvl-roster-club-teamline" title="'+esc(p?.club||'')+'">'+
   '<span class="kvl-roster-club-team">'+esc(clubKo(p?.club||'미확인'))+'</span>'+flag+'</span>'+
  '<span class="kvl-roster-club-meta"'+(league?' title="'+esc(country+(league?' · '+league:''))+'"':'')+'>'+
   '<span class="kvl-roster-country">'+esc(countryKo(country))+'</span>'+
   (leagueText?'<span class="kvl-roster-separator" aria-hidden="true">·</span><span class="kvl-roster-league">'+esc(leagueText)+'</span>':'')+
  '</span>';
}

function decoratePro(host,players){
 const root=host?.querySelector?.('[data-vleague-roster-v2]');
 if(!root)return;
 root.classList.add('kvl-roster-standard','is-pro');
 if(!root.querySelector('.kvl-roster-kpis')){
  root.querySelector('.kvlrv2-header')?.insertAdjacentHTML('afterend',kpiMarkup(players.length,average(players)));
 }
 setPlayerIds(root,(players||[]).map(p=>p.playerId));
 const head=root.querySelector('.kvlrv2-head');
 if(head)head.innerHTML='<span>NO.</span><span>선수명</span><span>POS</span><span>생년월일</span><span>신장</span>';
 const map=new Map((players||[]).map(p=>[String(p.number)+'/'+String(p.name),p]));
 const rows=root.querySelector('[data-rows]');
 const paint=()=>{
  rows?.querySelectorAll?.('[data-choice]').forEach(row=>{
   const children=[...row.children];
   if(children[2])children[2].classList.add('kvlrv2-pos');
   const height=children.find(el=>el.classList?.contains('kvlrv2-height'))||children[3];
   if(height)height.classList.add('kvlrv2-height');
   if(row.querySelector('.kvlrv2-dob'))return;
   const p=map.get(row.dataset.choice)||null;
   const dob=document.createElement('span');dob.className='kvlrv2-dob';dob.textContent=fmtDate(p?.dob);
   if(height)row.insertBefore(dob,height);else row.appendChild(dob);
  });
 };
 paint();
 if(rows){
  root._kvlRosterObserver?.disconnect?.();
  root._kvlRosterObserver=new MutationObserver(paint);
  root._kvlRosterObserver.observe(rows,{childList:true});
 }
}
function wrapPro(){
 const api=window.KVLVLeagueRosterV2;
 if(!api||api.__kvlTeamRosterStandardV1)return;
 const original=api.render.bind(api);
 api.render=function(host,d,team,players){
  const result=original(host,d,team,players);
  if(result)decoratePro(host,players||[]);
  return result;
 };
 api.__kvlTeamRosterStandardV1=true;
}

function decorateInternational(host,model){
 const root=host?.querySelector?.('.kvl-unified');
 if(!root)return;
 root.classList.add('kvl-roster-standard','is-international');
 if(!root.querySelector('.kvl-roster-kpis')){
  root.querySelector('.kvl-unified-top')?.insertAdjacentHTML('afterend',kpiMarkup(model?.total??model?.rows?.length??0,average(model?.rows||[])));
 }
 const byKey=new Map((model?.rows||[]).map(p=>[String(p.key),p]));
 setPlayerIds(root,(model?.rows||[]).map(p=>profileId(p.KVLProfile)));
 const rows=root.querySelector('[data-kvl-unified-rows]');
 const paint=()=>{
  rows?.querySelectorAll?.('[data-kvl-unified-athlete]').forEach(row=>{
   const p=byKey.get(String(row.dataset.kvlUnifiedAthlete));if(!p)return;
   const english=row.querySelector('.kvl-unified-name small');if(english)english.hidden=true;
   const club=row.querySelector('.kvl-unified-club');
   if(club&&!club.dataset.kvlRosterStandard){
    club.innerHTML=clubMeta(p);club.dataset.kvlRosterStandard='true';
   }
  });
 };
 paint();
 if(rows){
  root._kvlRosterObserver?.disconnect?.();
  root._kvlRosterObserver=new MutationObserver(paint);
  root._kvlRosterObserver.observe(rows,{childList:true});
 }
}
function wrapInternational(){
 const api=window.KVLInternationalUnifiedRosterV1;
 if(!api||api.__kvlTeamRosterStandardV1)return;
 const original=api.render.bind(api);
 api.render=function(host,model){
  const instance=original(host,model);
  decorateInternational(host,model);
  return instance;
 };
 api.__kvlTeamRosterStandardV1=true;
}

wrapPro();
wrapInternational();
window.addEventListener('kvl:team-roster-private-ready',()=>document.querySelectorAll('.kvl-roster-standard').forEach(updatePrivateKpis));
window.KVLTeamRosterStandardV1={decoratePro,decorateInternational,clubKo,leagueKo,countryKo,leagueTier};
})();