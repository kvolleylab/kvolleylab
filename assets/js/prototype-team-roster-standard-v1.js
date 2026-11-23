/* K-Volley Lab roster standard prototype v1.
 * Branch-only visual prototype. Does not write member data or alter production sources.
 */
(function(){
 'use strict';
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const COUNTRY_ISO2={
  Italy:'it',IT:'it',Japan:'jp',JP:'jp',Poland:'pl',PL:'pl',Türkiye:'tr',Turkey:'tr',TR:'tr',
  Germany:'de',DE:'de',Czechia:'cz',CZ:'cz',France:'fr',FR:'fr',Portugal:'pt',PT:'pt',
  India:'in',IN:'in','South Korea':'kr',Korea:'kr',KR:'kr',Taiwan:'tw',TW:'tw',
  Iran:'ir',IR:'ir',Oman:'om',OM:'om',Greece:'gr',GR:'gr',Brazil:'br',BR:'br',
  Argentina:'ar',AR:'ar',Serbia:'rs',RS:'rs',Slovenia:'si',SI:'si',China:'cn',CN:'cn',
  Canada:'ca',CA:'ca',Belgium:'be',BE:'be',Netherlands:'nl',NL:'nl',Bulgaria:'bg',BG:'bg',
  Cuba:'cu',CU:'cu','United States':'us',USA:'us',US:'us'
 };
 const COUNTRY_NAMES={it:'이탈리아',jp:'일본',pl:'폴란드',tr:'튀르키예',de:'독일',cz:'체코',fr:'프랑스',pt:'포르투갈',in:'인도',kr:'대한민국',tw:'대만',ir:'이란',om:'오만',gr:'그리스',br:'브라질',ar:'아르헨티나',rs:'세르비아',si:'슬로베니아',cn:'중국',ca:'캐나다',be:'벨기에',nl:'네덜란드',bg:'불가리아',cu:'쿠바',us:'미국'};
 const CLUB_KO={
  'Pallavolo Padova':'파도바',
  'Cuneo Volley':'쿠네오',
  'MA Acqua S.Bernardo Cuneo':'쿠네오',
  'Panionios GSS':'파니오니오스',
  'ChadorMalu Ardakan':'차도르말루 아르다칸',
  'PGE Projekt Warszawa':'프로젝트 바르샤바',
  'Shahrdari Urmia VC':'샤흐다리 우르미아',
  'Foolad Sirjan Iranian':'풀라드 시르잔',
  'Mes Rafsanjan':'메스 라프산잔'
 };
 const LEAGUE_KO={
  'SuperLega':'슈퍼레가',
  'Superlega':'슈퍼레가',
  'Serie A1':'세리에 A1',
  'Serie A2':'세리에 A2',
  'PlusLiga':'플러스리가',
  'Iranian Super League':'이란 슈퍼리그',
  'SMS Grup Efeler Ligi':'에펠레르 리기',
  'SV.LEAGUE':'SV.리그',
  'SV League':'SV.리그',
  'V-League':'V-리그',
  'Ligue A Masculine':'리그 A',
  'Ligue B Masculine':'리그 B',
  'Extraliga mužů':'엑스트랄리가',
  'Prime Volleyball League':'프라임 배구리그',
  'Liga UNA Seguros':'리가 UNA 세구로스',
  'Volley League':'발리리그',
  'First Division Volleyball League':'1부 배구리그'
 };
 const clubNameKo=value=>CLUB_KO[String(value||'').trim()]||String(value||'').trim();
 const leagueNameKo=value=>LEAGUE_KO[String(value||'').trim()]||String(value||'').trim();
 const iso2=value=>{
  const raw=String(value||'').trim();
  if(/^[A-Za-z]{2}$/.test(raw))return raw.toLowerCase();
  return COUNTRY_ISO2[raw]||'';
 };
 const countryName=value=>{
  const code=iso2(value);
  if(code&&COUNTRY_NAMES[code])return COUNTRY_NAMES[code];
  return String(value||'').trim();
 };
 const leagueTier=(league,country)=>{
  const raw=String(league||'').trim(),n=raw.toUpperCase();
  if(!raw)return'';
  if(/\b(A1|SERIE A1)\b|SUPERLEGA|SUPER LEGA/.test(n))return'1부';
  if(/\b(A2|SERIE A2)\b/.test(n))return'2부';
  if(/PLUSLIGA/.test(n))return'1부';
  if(/TAURON 1\. LIGA|PLS 1\. LIGA/.test(n))return'2부';
  if(/EFELER LIGI/.test(n))return'1부';
  if(/\b1\. LIG\b/.test(n)&&/TURK|TÜRKIYE/i.test(String(country||'')))return'2부';
  if(/SV\. ?LEAGUE|SV LEAGUE/.test(n))return'1부';
  if(/^V-LEAGUE$|^V\.LEAGUE$/.test(n)&&/JAPAN|^JP$/i.test(String(country||'')))return'2부';
  if(/LIGUE A|SPIKELEAGUE/.test(n))return'1부';
  if(/LIGUE B/.test(n))return'2부';
  if(/2\. BUNDESLIGA/.test(n))return'2부';
  if(/BUNDESLIGA/.test(n))return'1부';
  if(/IRANIAN SUPER LEAGUE|PRIME VOLLEYBALL LEAGUE|LIGA UNA SEGUROS|EXTRALIGA|VOLLEY LEAGUE|FIRST DIVISION/.test(n))return'1부';
  if(/SECOND DIVISION/.test(n))return'2부';
  return'';
 };
 const clubMeta=p=>{
  const country=String(p?.clubCountry||'').trim(),league=String(p?.clubLeague||'').trim();
  const code=iso2(country),countryText=countryName(country),tier=leagueTier(league,country);
  const flag=code?'<img class="kvl-proto-league-flag" src="assets/images/flags/4x3/'+esc(code)+'.svg" alt="" loading="lazy">':'';
  const leagueText=league?leagueNameKo(league)+(tier?' ('+tier+')':''):'';
  return '<span class="kvl-proto-club-teamline"><span class="kvl-proto-club-team">'+esc(clubNameKo(p?.club||'미확인'))+'</span>'+flag+'</span>'+
    '<span class="kvl-proto-club-meta">'+
      '<span class="kvl-proto-country">'+esc(countryText)+'</span>'+
      (leagueText?'<span class="kvl-proto-separator" aria-hidden="true">·</span><span class="kvl-proto-league">'+esc(leagueText)+'</span>':'')+
    '</span>';
 };
 const fmtDate=value=>{
  const raw=String(value||'').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(raw)?raw.replaceAll('-','.'):(raw||'—');
 };
 const average=rows=>{
  const values=(rows||[]).map(p=>Number(p?.heightCm||p?.height||0)).filter(v=>Number.isFinite(v)&&v>0);
  return values.length?(values.reduce((a,b)=>a+b,0)/values.length).toFixed(1)+'cm':'—';
 };
 function kpiMarkup(total,avg){
  return '<section class="kvl-roster-kpis" aria-label="선수명단 요약">'+
   '<article><span>선수 인원</span><strong>'+String(total??0)+'명</strong></article>'+
   '<article><span>평균 신장</span><strong>'+avg+'</strong></article>'+
   '<article class="is-private"><span>관심선수</span><strong>—</strong><small>회원 연동</small></article>'+
   '<article class="is-private"><span>메모선수</span><strong>—</strong><small>회원 연동</small></article>'+
   '</section>';
 }
 function decoratePro(host,players){
  const root=host?.querySelector?.('[data-vleague-roster-v2]');
  if(!root)return;
  root.classList.add('kvl-roster-standard-prototype','is-pro');
  if(!root.querySelector('.kvl-roster-kpis')){
   const header=root.querySelector('.kvlrv2-header');
   header?.insertAdjacentHTML('afterend',kpiMarkup(players.length,average(players)));
  }
  const head=root.querySelector('.kvlrv2-head');
  if(head){
   head.innerHTML='<span>NO.</span><span>선수명</span><span>POS</span><span>생년월일</span><span>신장</span>';
  }
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
    const dob=document.createElement('span');
    dob.className='kvlrv2-dob';
    dob.textContent=fmtDate(p?.dob);
    if(height)row.insertBefore(dob,height);else row.appendChild(dob);
   });
  };
  paint();
  if(rows){
   const observer=new MutationObserver(paint);
   observer.observe(rows,{childList:true});
   root._kvlRosterPrototypeObserver?.disconnect?.();
   root._kvlRosterPrototypeObserver=observer;
  }
 }
 function wrapPro(){
  const api=window.KVLVLeagueRosterV2;
  if(!api||api.__kvlRosterPrototypeWrapped)return;
  const original=api.render.bind(api);
  api.render=function(host,d,team,players){
   const result=original(host,d,team,players);
   if(result)decoratePro(host,players||[]);
   return result;
  };
  api.__kvlRosterPrototypeWrapped=true;
 }
 function decorateInternational(host,model){
  const root=host?.querySelector?.('.kvl-unified');
  if(!root)return;
  root.classList.add('kvl-roster-standard-prototype','is-international');
  if(!root.querySelector('.kvl-roster-kpis')){
   const top=root.querySelector('.kvl-unified-top');
   top?.insertAdjacentHTML('afterend',kpiMarkup(model?.total??model?.rows?.length??0,average(model?.rows||[])));
  }
  const byKey=new Map((model?.rows||[]).map(p=>[String(p.key),p]));
  const rows=root.querySelector('[data-kvl-unified-rows]');
  const paint=()=>{
   rows?.querySelectorAll?.('[data-kvl-unified-athlete]').forEach(row=>{
    const p=byKey.get(String(row.dataset.kvlUnifiedAthlete));
    const club=row.querySelector('.kvl-unified-club');
    const english=row.querySelector('.kvl-unified-name small');
    if(english)english.hidden=true;
    if(p&&club&&!club.dataset.prototypeClubV2){
     club.innerHTML=clubMeta(p);
     club.dataset.prototypeClubV2='true';
    }
   });
  };
  paint();
  if(rows){
   const observer=new MutationObserver(paint);
   observer.observe(rows,{childList:true});
   root._kvlIntlRosterPrototypeObserver?.disconnect?.();
   root._kvlIntlRosterPrototypeObserver=observer;
  }
 }
 function wrapInternational(){
  const api=window.KVLInternationalUnifiedRosterV1;
  if(!api||api.__kvlRosterPrototypeWrapped)return;
  const original=api.render.bind(api);
  api.render=function(host,model){
   const instance=original(host,model);
   decorateInternational(host,model);
   return instance;
  };
  api.__kvlRosterPrototypeWrapped=true;
 }
 function start(){
  wrapPro();
  wrapInternational();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
})();