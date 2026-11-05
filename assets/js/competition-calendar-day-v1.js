/* Exact calendar-event → existing public match exports. No new schedule facts.
 * Fetch only the selected day's competitions; preserve KST dates and scores. */
(()=>{
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const feeds=new Map(),cache=new Map();
  const add=(event,slug,gender,label='')=>{
    if(!feeds.has(event))feeds.set(event,[]);
    feeds.get(event).push({path:`data/competitions/${slug}/data.json`,gender,label});
  };
  for(const gender of ['men','women']){
    for(const stem of ['v-league','university-league','kovo-cup']){
      const slug=`${stem}-${gender}-${stem==='v-league'?'2026-27':'2026'}`;
      add(slug,slug,gender);
    }
    for(const city of ['goseong','danyang'])add(`${city}-university-2026`,`university-${city}-${gender}-2026`,gender,gender==='men'?'남자부':'여자부');
    add(`vnl-${gender}-2026`,`vnl-${gender}-2026`,gender);
    add(`asian-games-${gender}-volleyball-2026`,`asian-games-${gender}-2026`,gender);
    for(const [event,stem] of Object.entries({
      'spring-middle-high-2026':'school-spring-2026',
      'middle-high-first-2026':'school-samcheok-2026',
      'middle-high-second-2026':'school-iksan-2026',
      'presidents-cup-middle-high-2026':'school-presidents-2026',
      'ibk-middle-high-2026':'school-ibk-2026','cbs-middle-high-2026':'cbs-2026'
    }))for(const level of ['middle','high'])add(event,`${stem}-${level}-${gender}`,gender,`${gender==='men'?'남자':'여자'}${level==='middle'?'중등부':'고등부'}`);
    for(const level of ['u12','u15'])add('national-youth-sports-festival-2026',`national-youth-sports-festival-${gender}-${level}-2026`,gender,`${gender==='men'?'남자':'여자'} ${level==='u12'?'12세':'15세'} 이하부`);
    for(const level of gender==='men'?['general','u18','university']:['general','u18'])add('national-sports-festival-2026',`national-sports-festival-${gender}-${level}-2026`,gender,`${gender==='men'?'남자':'여자'} ${ {general:'일반부',u18:'18세 이하부',university:'대학부'}[level]}`);
    feeds.set(`avc-${gender}-continental-2026`,[{path:`data/competitions/avc-${gender}-continental-2026.json`,gender,format:'avc'}]);
  }
  feeds.set('west-japan-university-men-selection-2026',[{path:'data/competitions/west-japan-university-select-2026.json',gender:'men',format:'west-japan'}]);
  feeds.set('avc-men-cup-2026',[{path:'data/matches/avc-2026-calendar.json',detail:'data/competition/avc-men-cup-2026-results-detail.json',gender:'men',format:'avc-cup'}]);
  function normalize(data,source){
    if(!Array.isArray(data.matches))throw Error('Invalid match export');
    if(!source.format)return data;
    if(source.format==='avc-cup')return {participants:[],venueLabel:typeof data.venue==='string'?data.venue:[data.venue?.city,data.venue?.country].filter(Boolean).join(', '),matches:data.matches.map(m=>({
      id:m.match_id,date:m.date,time:m.time,home:{name:m.home},away:{name:m.away},status:m.status,
      stage:m.official_match_id<=28212?'예선':[28214,28215].includes(m.official_match_id)?'준결승':m.official_match_id===28218?'3·4위 결정전':m.official_match_id===28219?'결승':'순위 결정전',
      score:m.result?{home:m.result.home_sets,away:m.result.away_sets,sets:(data.detail?.set_scores?.[m.official_match_id]||[]).filter(s=>/^\d+-\d+$/.test(s)).map(s=>({home:Number(s.split('-')[0]),away:Number(s.split('-')[1])}))}:null
    }))};
    return {participants:[],venueLabel:data.venue||data.competition?.venue||'',matches:data.matches.map(m=>{
      const draw=source.format==='west-japan',pair=draw&&/^(\d+)-(\d+)$/.exec(m.score||'');
      const home=pair?Number(pair[1]):m.setsA,away=pair?Number(pair[2]):m.setsB;
      const scored=Number.isInteger(home)&&Number.isInteger(away);
      const sets=(m.sets||[]).map(s=>Array.isArray(s)?{home:s[0],away:s[1]}:typeof s==='string'&&/^\d+-\d+$/.test(s)?{home:Number(s.split('-')[0]),away:Number(s.split('-')[1])}:null).filter(Boolean);
      return {...m,home:{name:m.teamA},away:{name:m.teamB},pool:m.group||'',
        status:scored?'final':'scheduled',score:scored?{home,away,sets}:null,
        venueLabel:m.venue||data.venue||data.competition?.venue||'',localTimeLabel:m.localTime?'현지 '+m.localTime:'',
        scoreNote:draw&&home===away&&scored?'예비리그 2세트제 · 무승부':m.scoreNote,
        calendarResultLabel:draw&&scored?`${home} : ${away}`:null};
    })};
  }
  async function load(source){
    const entry=cache.get(source.path);
    if(entry&&Date.now()-entry.at<60000)return entry.value;
    const read=path=>fetch(path,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Match export unavailable');return r.json()});
    const value=Promise.all([read(source.path),source.detail?read(source.detail):null]).then(([d,detail])=>normalize({...d,detail},source)).catch(error=>{cache.delete(source.path);throw error});
    cache.set(source.path,{at:Date.now(),value});return value;
  }
  function inline(event){
    return {participants:[],matches:(event.matches||[]).map((m,i)=>({...m,id:m.id||`${event.id}-${i}`,home:{name:m.teamA},away:{name:m.teamB},venueLabel:m.venue||event.location||''}))};
  }
  let request=0;
  async function open(options){
    const {date,events,gender,href,color,title}=options,ui=window.KVLMatchCalendarV1;
    const dialog=ui.dialog(),body=dialog.querySelector('.dv2-day-matches'),ticket=++request;
    dialog.classList.add('cc-day-dialog');
    dialog.querySelector('.dv2-day-schedule').hidden=true;
    const heading=dialog.querySelector('#dv2-day-title');
    heading.textContent=`${date.replaceAll('-','.')} · ${events.length}개 대회`;
    body.classList.add('cc-day-competitions');body.setAttribute('aria-busy','true');
    body.innerHTML='<p class="cc-day-message" role="status">그날의 경기 일정·결과를 불러오는 중…</p>';
    if(!dialog.open)dialog.showModal();
    const results=await Promise.all(events.map(async event=>{
      const sources=(feeds.get(event.id)||[]).filter(s=>gender==='all'||s.gender===gender);
      const settled=await Promise.allSettled(sources.map(async source=>({source,data:await load(source)})));
      const groups=settled.filter(r=>r.status==='fulfilled').map(r=>r.value);
      if(event.matches?.length)groups.push({source:{label:''},data:inline(event)});
      const seen=new Set(),matches=[];
      for(const {source,data} of groups)for(const m of data.matches){
        const key=`${source.path||event.id}:${m.id}`;
        if(m.date!==date||m.notRequired||m.status==='not_required'||seen.has(key))continue;
        seen.add(key);matches.push({m,data,source});
      }
      matches.sort((a,b)=>(a.m.time||'99:99').localeCompare(b.m.time||'99:99')||String(a.m.id).localeCompare(String(b.m.id)));
      return {event,matches,failed:settled.some(r=>r.status==='rejected'),known:sources.length>0||Boolean(event.matches?.length)};
    }));
    if(ticket!==request||!dialog.open)return;
    const count=results.reduce((n,r)=>n+r.matches.length,0);
    heading.textContent+=` · 등록 경기 ${count}경기`;
    body.setAttribute('aria-busy','false');
    body.innerHTML=results.length?'<p class="cc-day-message">대회 기간과 해당 날짜에 등록된 경기를 함께 표시합니다. 시간은 한국 기준입니다.</p>'+results.map(({event,matches,failed,known})=>{
      const note=failed?'일부 경기 자료를 불러오지 못했습니다. 다시 불러오거나 대회 페이지를 확인해 주세요.':matches.length?'':known?'이 날짜에 등록된 세부 경기가 없습니다.':'대회 기간만 확인되어 있습니다. 세부 경기 일정·결과는 확인 중입니다.';
      return `<section class="cc-day-competition" data-day-event="${esc(event.id)}" style="--event-color:${color(event)}"><header><h3><a href="${esc(href(event,date))}">${esc(title(event))} <span aria-hidden="true">→</span></a></h3><p>${esc(event.start.replaceAll('-','.'))} – ${esc(event.end.replaceAll('-','.'))} · 등록 경기 ${matches.length}경기</p></header>${note?`<p class="cc-day-message" ${failed?'role="status"':''}>${note}${failed?'<button type="button" data-day-retry>다시 불러오기</button>':''}</p>`:''}${matches.length?`<div class="cc-day-games">${matches.map(({m,data,source})=>`<div class="cc-day-game">${source.label?`<p class="cc-day-division">${esc(source.label)}</p>`:''}${ui.matchCard(m,data,{resultLabel:m.calendarResultLabel})}</div>`).join('')}</div>`:''}</section>`;
    }).join(''):'<p class="cc-day-message">이 날짜에 등록된 대회 일정이 없습니다.</p>';
    body.querySelectorAll('[data-day-retry]').forEach(button=>button.onclick=()=>open(options));
  }
  window.KVLCompetitionCalendarDayV1={open};
})();
