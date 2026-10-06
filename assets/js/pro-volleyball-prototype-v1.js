(()=>{
'use strict';
const body=document.body;
const root=document.querySelector('[data-pvp-root]');
const slug=body.dataset.pvpSlug||'';
if(!root||!slug)return;

const params=new URLSearchParams(location.search);
const state={
  view:params.get('view')||'overview',
  gender:params.get('gender')||'men',
  filter:null
};

const esc=value=>String(value==null?'':value).replace(/[&<>"']/g,ch=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[ch]));
const genderLabel=gender=>gender==='women'?'여자부':'남자부';
const dateLabel=value=>{
  if(!value)return '';
  const p=value.split('-');
  return Number(p[1])+'.'+Number(p[2]);
};

fetch('/data/pro-volleyball/'+slug+'.json?v=20261007-prototype-1')
  .then(response=>{
    if(!response.ok)throw new Error('prototype data');
    return response.json();
  })
  .then(init)
  .catch(()=>{
    root.innerHTML='<section class="pvp-section pvp-empty">프로토타입 데이터를 불러오지 못했습니다.</section>';
  });

function init(data){
  if(!data.tabs.some(tab=>tab.id===state.view))state.view='overview';
  if(state.gender!=='men'&&state.gender!=='women')state.gender='men';
  state.filter=data.kind==='league'?'1':'all';
  document.title=data.shortTitle+' 프로토타입 | K-Volley Lab';
  renderShell(data);
  bind(data);
  renderView(data);
}

function renderShell(data){
  let tabs='';
  data.tabs.forEach(tab=>{
    tabs+='<button class="pvp-tab" type="button" data-view="'+esc(tab.id)+'">'+esc(tab.label)+'</button>';
  });
  root.innerHTML=
    '<section class="pvp-hero">'+
      '<div class="pvp-hero-grid">'+
        '<div>'+
          '<p class="pvp-eyebrow">'+esc(data.eyebrow)+'</p>'+
          '<h1 class="pvp-title">'+esc(data.title)+'</h1>'+
          '<p class="pvp-desc">'+esc(data.description)+'</p>'+
          '<div class="pvp-hero-links">'+
            '<span class="pvp-hero-link is-prototype">PROTOTYPE</span>'+
            '<a class="pvp-hero-link" href="'+esc(data.crossLink.href)+'">'+esc(data.crossLink.label)+' →</a>'+
          '</div>'+
        '</div>'+
        '<div class="pvp-hero-side">'+
          '<div class="pvp-season-mark"><small>상태</small><strong>'+esc(data.status)+'</strong></div>'+
          '<div class="pvp-season-mark"><small>기간</small><strong>'+esc(data.dateLabel)+'</strong></div>'+
        '</div>'+
      '</div>'+
    '</section>'+
    '<section class="pvp-control" aria-label="대회 메뉴">'+
      '<div class="pvp-tabs">'+tabs+'</div>'+
      '<div class="pvp-gender">'+
        '<button type="button" data-gender="men">MEN · 남자부</button>'+
        '<button type="button" data-gender="women">WOMEN · 여자부</button>'+
      '</div>'+
    '</section>'+
    '<div class="pvp-view" data-pvp-view></div>';
  syncControls();
}

function bind(data){
  root.addEventListener('click',event=>{
    const viewButton=event.target.closest('[data-view]');
    if(viewButton){
      state.view=viewButton.dataset.view;
      writeURL();
      syncControls();
      renderView(data);
      return;
    }
    const genderButton=event.target.closest('[data-gender]');
    if(genderButton){
      state.gender=genderButton.dataset.gender;
      state.filter=data.kind==='league'?'1':'all';
      writeURL();
      syncControls();
      renderView(data);
      return;
    }
    const filterButton=event.target.closest('[data-filter]');
    if(filterButton){
      state.filter=filterButton.dataset.filter;
      renderView(data);
    }
  });
}

function writeURL(){
  const next=new URLSearchParams(location.search);
  next.set('view',state.view);
  next.set('gender',state.gender);
  history.replaceState(null,'',location.pathname+'?'+next.toString());
}

function syncControls(){
  root.querySelectorAll('[data-view]').forEach(button=>{
    button.classList.toggle('is-active',button.dataset.view===state.view);
  });
  root.querySelectorAll('[data-gender]').forEach(button=>{
    button.classList.toggle('is-active',button.dataset.gender===state.gender);
  });
}

function renderView(data){
  const view=root.querySelector('[data-pvp-view]');
  const renderer={
    overview:renderOverview,
    schedule:renderSchedule,
    standings:renderStandings,
    postseason:renderPostseason,
    teams:renderTeams,
    resources:renderResources
  }[state.view]||renderOverview;
  view.innerHTML=renderer(data);
}

function sectionHead(title,note,badge){
  return '<div class="pvp-section-head">'+
    '<div><h2>'+esc(title)+'</h2><p>'+esc(note)+'</p></div>'+
    (badge?'<span class="pvp-status-badge">'+esc(badge)+'</span>':'')+
  '</div>';
}

function genderMatches(data){
  return data.matches.filter(match=>match.gender===state.gender).sort((a,b)=>{
    return a.date.localeCompare(b.date)||a.time.localeCompare(b.time);
  });
}

function genderTeams(data){
  return data.teams.filter(team=>team.gender===state.gender);
}

function flowItems(data){
  if(data.kind==='league'){
    return [
      ['1~6라운드 정규리그','팀당 36경기 · 홈 18 / 원정 18'],
      ['정규리그 최종 순위','포스트시즌 진출팀 확정'],
      ['준PO · PO','조건부 준플레이오프 후 플레이오프'],
      ['챔피언결정전','5전 3선승제로 시즌 우승 결정']
    ];
  }
  return [
    ['A·B조 조별리그','A조 4팀 / B조 3팀'],
    ['조 상위 2팀 진출','각 조 1·2위가 준결승 진출'],
    ['교차 준결승','A1-B2 / B1-A2'],
    ['단판 결승','준결승 승자끼리 우승 결정']
  ];
}

function renderOverview(data){
  const matches=genderMatches(data);
  const teams=genderTeams(data);
  let next='';
  matches.slice(0,5).forEach(match=>{
    next+='<div class="pvp-next">'+
      '<time>'+dateLabel(match.date)+'('+esc(match.weekday)+')</time>'+
      '<strong>'+esc(match.home)+' vs '+esc(match.away)+'</strong>'+
      '<b>'+esc(match.time)+'</b>'+
    '</div>';
  });
  let flow='';
  flowItems(data).forEach((item,index)=>{
    flow+='<div class="pvp-flow-row">'+
      '<span class="pvp-flow-no">'+(index+1)+'</span>'+
      '<div><strong>'+esc(item[0])+'</strong><span>'+esc(item[1])+'</span></div>'+
    '</div>';
  });
  return '<section class="pvp-section">'+
    sectionHead('대회 한눈에 보기',genderLabel(state.gender)+' 기준 핵심 정보',data.statusNote)+
    '<div class="pvp-overview-grid">'+
      '<div class="pvp-metric"><span>대회 기간</span><strong>'+esc(data.dateLabel)+'</strong></div>'+
      '<div class="pvp-metric"><span>경기장</span><strong>'+esc(data.venueLabel)+'</strong></div>'+
      '<div class="pvp-metric"><span>'+genderLabel(state.gender)+' 참가팀</span><strong>'+teams.length+'팀</strong></div>'+
      '<div class="pvp-metric"><span>'+genderLabel(state.gender)+' 경기</span><strong>'+matches.length+'경기</strong></div>'+
    '</div>'+
    '<div class="pvp-split">'+
      '<div class="pvp-subcard"><h3>첫 경기 일정</h3><div class="pvp-next-list">'+next+'</div></div>'+
      '<div class="pvp-subcard"><h3>'+(data.kind==='league'?'시즌 흐름':'대회 방식')+'</h3><div class="pvp-flow">'+flow+'</div></div>'+
    '</div>'+
  '</section>';
}

function renderSchedule(data){
  const all=genderMatches(data);
  let filters=[];
  if(data.kind==='league'){
    [1,2,3,4,5,6].forEach(n=>filters.push({id:String(n),label:n+'라운드'}));
  }else{
    filters=[
      {id:'all',label:'전체'},
      {id:'group',label:'조별리그'},
      {id:'semi',label:'준결승'},
      {id:'final',label:'결승'}
    ];
  }

  let list=all;
  if(data.kind==='league'){
    list=all.filter(match=>String(match.round)===state.filter);
  }else if(state.filter==='group'){
    list=all.filter(match=>match.stage==='조별리그');
  }else if(state.filter==='semi'){
    list=all.filter(match=>match.stage==='준결승');
  }else if(state.filter==='final'){
    list=all.filter(match=>match.stage==='결승');
  }

  let filterHTML='';
  filters.forEach(filter=>{
    filterHTML+='<button type="button" class="pvp-filter '+(state.filter===filter.id?'is-active':'')+'" data-filter="'+esc(filter.id)+'">'+esc(filter.label)+'</button>';
  });

  const groups={};
  list.forEach(match=>{
    if(!groups[match.date])groups[match.date]=[];
    groups[match.date].push(match);
  });

  let scheduleHTML='';
  Object.keys(groups).sort().forEach(date=>{
    const day=groups[date];
    let games='';
    day.forEach(match=>{
      const groupText=data.kind==='cup'&&match.group?match.group+'조 · ':'';
      games+='<div class="pvp-match">'+
        '<span class="pvp-match-time">'+esc(match.time)+'</span>'+
        '<strong class="pvp-team-name">'+esc(match.home)+'</strong>'+
        '<span class="pvp-vs">vs</span>'+
        '<strong class="pvp-team-name">'+esc(match.away)+'</strong>'+
        '<span class="pvp-match-meta">'+esc(groupText+match.stage)+'<br>'+esc(match.venue)+'</span>'+
      '</div>';
    });
    scheduleHTML+='<div class="pvp-date-block">'+
      '<div class="pvp-date-head"><strong>'+esc(date)+' ('+esc(day[0].weekday||'')+')</strong><span>'+day.length+'경기</span></div>'+
      games+
    '</div>';
  });

  if(!scheduleHTML)scheduleHTML='<div class="pvp-empty">표시할 일정이 없습니다.</div>';

  return '<section class="pvp-section">'+
    sectionHead('경기일정',genderLabel(state.gender)+' · 한국시간(KST)',data.kind==='league'?state.filter+'라운드':'여수 진남체육관')+
    '<div class="pvp-filterbar">'+filterHTML+'</div>'+
    scheduleHTML+
  '</section>';
}

function standingsTable(teams,title,group){
  let rows='';
  teams.forEach((team,index)=>{
    rows+='<tr>'+
      '<td>'+(index+1)+'</td>'+
      '<td class="pvp-team-cell">'+esc(team.name)+'</td>'+
      '<td>0</td><td>0</td><td>0</td><td>0</td><td>-</td>'+
    '</tr>';
  });
  return (title?'<div class="pvp-group-title" data-group="'+esc(group)+'"><span class="pvp-group-dot"></span><strong>'+esc(title)+'</strong></div>':'')+
    '<div class="pvp-table-wrap"><table>'+
      '<thead><tr><th>순위</th><th>팀</th><th>경기</th><th>승</th><th>패</th><th>승점</th><th>세트득실</th></tr></thead>'+
      '<tbody>'+rows+'</tbody>'+
    '</table></div>';
}

function renderStandings(data){
  const teams=genderTeams(data);
  if(data.kind==='league'){
    return '<section class="pvp-section">'+
      sectionHead('정규리그 순위',genderLabel(state.gender)+' · 개막 전 순위표','시즌 시작 전')+
      standingsTable(teams,'','')+
    '</section>';
  }
  const groupA=teams.filter(team=>team.group==='A');
  const groupB=teams.filter(team=>team.group==='B');
  return '<section class="pvp-section">'+
    sectionHead('조별순위',genderLabel(state.gender)+' · 각 조 상위 2팀 준결승 진출','개막 전')+
    standingsTable(groupA,'A조','A')+
    standingsTable(groupB,'B조','B')+
  '</section>';
}

function renderPostseason(data){
  let cards='';
  data.postseason.forEach((item,index)=>{
    cards+='<article class="pvp-playoff-card">'+
      '<small>STEP '+(index+1)+'</small>'+
      '<strong>'+esc(item.title)+'</strong>'+
      '<p><b>'+esc(item.date)+'</b></p>'+
      '<p>'+esc(item.note)+'</p>'+
    '</article>';
  });
  return '<section class="pvp-section">'+
    sectionHead(
      data.kind==='league'?'포스트시즌':'결선토너먼트',
      data.kind==='league'?'정규리그 종료 후 순위에 따라 대진 확정':'A·B조 상위 2팀이 교차 준결승 진행',
      ''
    )+
    '<div class="pvp-playoff-grid">'+cards+'</div>'+
  '</section>';
}

function renderTeams(data){
  const teams=genderTeams(data);
  let cards='';
  teams.forEach(team=>{
    cards+='<article class="pvp-team-card">'+
      '<div class="pvp-team-card-top">'+
        '<span class="pvp-team-monogram">'+esc(team.code||team.name.slice(0,2))+'</span>'+
        '<strong>'+esc(team.name)+'</strong>'+
      '</div>'+
      '<p>'+(data.kind==='league'?esc((team.city||'')+' · '+(team.venue||'홈경기장')):'2026 KOVO컵 참가')+'</p>'+
      (team.group?'<span class="pvp-team-group">'+esc(team.group)+'조</span>':'')+
    '</article>';
  });
  return '<section class="pvp-section">'+
    sectionHead(data.kind==='league'?'팀':'참가팀',genderLabel(state.gender)+' '+teams.length+'팀','')+
    '<div class="pvp-team-grid">'+cards+'</div>'+
  '</section>';
}

function renderResources(data){
  let links='';
  data.resources.forEach(resource=>{
    links+='<a class="pvp-resource" href="'+esc(resource.url)+'" target="_blank" rel="noopener">'+
      '<div><strong>'+esc(resource.title)+'</strong><span>'+esc(resource.note)+'</span></div>'+
      '<b>열기 ↗</b>'+
    '</a>';
  });
  return '<section class="pvp-section">'+
    sectionHead('공식자료','프로토타입 검수용 출처와 원본 데이터','')+
    '<div class="pvp-resource-list">'+links+'</div>'+
  '</section>';
}
})();