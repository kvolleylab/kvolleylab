(()=>{
  const path=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  const params=new URLSearchParams(location.search);
  if(document.querySelector('.kvl-global-sidebar'))return;

  const now=new Date();
  const calendarYear=now.getFullYear();
  const calendarMonth=now.getMonth()+1;
  const scheduleHref=matchMedia('(max-width:767px)').matches
    ?`competition-calendar.html?view=month&year=${calendarYear}&month=${calendarMonth}`
    :`competition-calendar.html?view=year&year=${calendarYear}`;

  const competitionPages=new Set(['competition.html','vnl.html','match.html','japan.html','brazil.html','poland.html','iran.html','usa.html','france.html','argentina.html','italy.html','canada.html','belgium.html','cuba.html','slovenia.html','bulgaria.html','germany.html','serbia.html','turkiye.html','china.html','ukraine.html']);
  const nationalPages=new Set(['national-team-history.html','player-cohort.html','la28-volleyball-qualification.html','fivb-world-ranking-events.html','fivb-world-ranking-la28-2028.html']);
  const domesticPages=new Set(['domestic-competitions.html','danyang-university-2026.html','ibk-middle-high-2026.html','school-competition-results-2026.html','university-competitions.html','university-competition.html','university-competition-danyang.html','university-team.html','national-sports-festival-2026.html']);
  const vleaguePages=new Set(['v-league.html']);
  const universityLeaguePages=new Set(['university-league.html']);
  const playerPages=new Set(['players.html','player.html','player-search.html','player-compare.html','draft-hub.html']);
  const schedulePages=new Set(['schedules.html','competition-calendar.html']);
  const teamPages=new Set(['university-teams.html','teams.html']);
  const simulatorPages=new Set(['simulator.html','danyang-qualification-calculator.html']);
  let active='';
  if(path==='index.html'||path==='')active='home';
  else if(schedulePages.has(path))active='schedules';
  else if(nationalPages.has(path))active='national';
  else if(competitionPages.has(path))active='competition';
  else if(domesticPages.has(path))active='domestic';
  else if(vleaguePages.has(path))active='vleague';
  else if(universityLeaguePages.has(path))active='uleague';
  else if(simulatorPages.has(path))active='simulator';
  else if(teamPages.has(path))active='teams';
  else if(playerPages.has(path))active='players';
  else if(path==='pamphlet-archive.html')active='pamphlet';
  else if(path==='records.html')active='records';

  const icon={
    home:'<svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5"></path><path d="M5.5 10.5V20h13v-9.5"></path><path d="M9.5 20v-6h5v6"></path></svg>',
    calendar:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M7 3v4M17 3v4M3 10h18"></path><path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01"></path></svg>',
    globe:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M3.5 9h17M3.5 15h17M12 3c2.2 2.4 3.3 5.4 3.3 9S14.2 18.6 12 21c-2.2-2.4-3.3-5.4-3.3-9S9.8 5.4 12 3Z"></path></svg>',
    flag:'<svg viewBox="0 0 24 24"><path d="M5 21V4"></path><path d="M5 5h11l-2 4 2 4H5"></path></svg>',
    domestic:'<svg viewBox="0 0 24 24"><path d="M4 20h16M6 20V9h12v11M9 20v-5h6v5M5 9l7-5 7 5"></path></svg>',
    league:'<svg viewBox="0 0 24 24"><path d="M5 4h14v5c0 4-3 7-7 7s-7-3-7-7V4Z"></path><path d="M8 20h8M12 16v4M5 7H2c0 4 2 6 5 6M19 7h3c0 4-2 6-5 6"></path></svg>',
    calculator:'<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2"></rect><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"></path></svg>',
    teams:'<svg viewBox="0 0 24 24"><path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"></path><path d="M2.5 20c.4-4 2.3-6 5.5-6s5.1 2 5.5 6M10.5 20c.4-4 2.3-6 5.5-6s5.1 2 5.5 6"></path></svg>',
    player:'<svg viewBox="0 0 24 24"><circle cx="12" cy="7" r="3"></circle><path d="M5 21c.5-5.1 2.8-7.6 7-7.6S18.5 15.9 19 21"></path></svg>',
    file:'<svg viewBox="0 0 24 24"><path d="M5 3h11l3 3v15H5z"></path><path d="M16 3v4h4M8 11h8M8 15h8M8 19h5"></path></svg>',
    request:'<svg viewBox="0 0 24 24"><path d="M4 5h16v14H4z"></path><path d="m8 10 4 3 4-3"></path></svg>',
    chevron:'<svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"></path></svg>',
    collapse:'<svg viewBox="0 0 24 24"><path d="m15 6-6 6 6 6"></path><path d="M20 4v16"></path></svg>'
  };

  const link=(key,href,svg,label,extra='')=>({type:'link',key,href,svg,label,extra});
  const group=(key,svg,label,children)=>({type:'group',key,svg,label,children});
  const items=[
    link('home','index.html',icon.home,'홈'),
    {type:'section',label:'정보'},
    link('schedules',scheduleHref,icon.calendar,'경기일정'),
    group('national',icon.flag,'국가대표팀',[
      link('national-senior','national-team-history.html?scope=senior',null,'성인 대표팀'),
      link('national-age','national-team-history.html?scope=age',null,'연령별 대표팀'),
      link('national-cohort','player-cohort.html',null,'대표팀 세대추적'),
      link('national-olympic','la28-volleyball-qualification.html',null,'올림픽·랭킹')
    ]),
    group('competition',icon.globe,'국제대회',[
      link('competition-national','competition.html?division=national',null,'국가대표'),
      link('competition-university','competition.html?division=university',null,'대학'),
      link('competition-club','competition.html?division=club',null,'클럽')
    ]),
    group('domestic',icon.domestic,'국내대회',[
      link('domestic-pro','domestic-competitions.html?division=pro',null,'프로'),
      link('domestic-university','university-competitions.html',null,'대학'),
      link('domestic-school','domestic-competitions.html?division=school',null,'중·고'),
      link('domestic-comprehensive','national-sports-festival-2026.html',null,'종합대회')
    ]),
    link('vleague','v-league.html',icon.league,'프로 V-리그'),
    link('uleague','university-league.html',icon.league,'대학 U-리그'),
    group('teams',icon.teams,'TEAM',[
      link('teams-pro','teams.html?level=pro',null,'프로'),
      link('teams-university','university-teams.html',null,'대학'),
      link('teams-school','teams.html?level=school',null,'중·고')
    ]),
    link('players','players.html',icon.player,'선수'),
    {type:'section',label:'도구'},
    link('simulator','simulator.html',icon.calculator,'진출 계산기'),
    link('pamphlet','pamphlet-archive.html',icon.file,'팜플렛'),
    link('records','records.html',icon.file,'기록실'),
    {type:'section',label:'지원'},
    link('request','https://forms.gle/MFNYhJX6Bq5zeNmp8',icon.request,'요청하기','external')
  ];

  const isChildActive=(item)=>{
    if(item.key==='national-senior')return active==='national'&&path==='national-team-history.html'&&params.get('scope')==='senior';
    if(item.key==='national-age')return active==='national'&&path==='national-team-history.html'&&params.get('scope')!=='senior';
    if(item.key==='national-cohort')return active==='national'&&path==='player-cohort.html';
    if(item.key==='national-olympic')return active==='national'&&['la28-volleyball-qualification.html','fivb-world-ranking-events.html','fivb-world-ranking-la28-2028.html'].includes(path);
    if(item.key==='competition-national')return active==='competition'&&((path==='competition.html'&&(params.get('division')||'national')==='national')||path==='vnl.html'||path==='match.html'||['japan.html','brazil.html','poland.html','iran.html','usa.html','france.html','argentina.html','italy.html','canada.html','belgium.html','cuba.html','slovenia.html','bulgaria.html','germany.html','serbia.html','turkiye.html','china.html','ukraine.html'].includes(path));
    if(item.key==='competition-university')return active==='competition'&&path==='competition.html'&&params.get('division')==='university';
    if(item.key==='competition-club')return active==='competition'&&path==='competition.html'&&params.get('division')==='club';
    if(item.key==='domestic-pro')return active==='domestic'&&params.get('division')==='pro';
    if(item.key==='domestic-university')return active==='domestic'&&(path==='university-competitions.html'||path==='university-competition.html'||path==='university-competition-danyang.html'||path==='university-team.html'||params.get('division')==='university');
    if(item.key==='domestic-school')return active==='domestic'&&params.get('division')==='school';
    if(item.key==='domestic-comprehensive')return path==='national-sports-festival-2026.html';
    if(item.key==='teams-pro')return active==='teams'&&params.get('level')==='pro';
    if(item.key==='teams-university')return path==='university-teams.html';
    if(item.key==='teams-school')return active==='teams'&&params.get('level')==='school';
    return active===item.key;
  };

  const renderLink=(item,child=false)=>{
    const current=isChildActive(item)||(!child&&active===item.key);
    const external=item.extra==='external';
    const aria=external?`${item.label}, 새 창 열림`:item.label;
    return `<a class="${child?'kvl-global-sub-link ':''}${current?'active':''}" href="${item.href}" aria-label="${aria}" title="${item.label}"${current?' aria-current="page"':''}${external?' target="_blank" rel="noopener"':''}>${item.svg?`<span class="kvl-global-icon">${item.svg}</span>`:''}<span class="kvl-global-label">${item.label}</span>${external?'<span class="kvl-global-external" aria-hidden="true">↗</span>':''}</a>`;
  };

  const nav=items.map(item=>{
    if(item.type==='section')return `<p class="kvl-global-section">${item.label}</p>`;
    if(item.type==='link')return renderLink(item);
    const open=active===item.key||item.children.some(isChildActive);
    return `<div class="kvl-global-group ${open?'open':''}" data-group="${item.key}"><button class="kvl-global-group-toggle ${active===item.key?'active':''}" type="button" aria-expanded="${open}"><span class="kvl-global-icon">${item.svg}</span><span class="kvl-global-label">${item.label}</span><span class="kvl-global-chevron">${icon.chevron}</span></button><div class="kvl-global-submenu">${item.children.map(child=>renderLink(child,true)).join('')}</div></div>`;
  }).join('');

  document.body.classList.add('kvl-sidebar-enabled');
  document.body.insertAdjacentHTML('afterbegin',`<aside class="kvl-global-sidebar" aria-label="K-Volley Lab 메뉴"><div class="kvl-global-sidebar-head"><a class="kvl-global-brand" href="index.html" aria-label="K-Volley Lab 홈"><span class="kvl-global-mark">K</span><strong>K-VOLLEY LAB</strong></a><button class="kvl-global-close" type="button" aria-label="메뉴 닫기">×</button></div><nav class="kvl-global-nav">${nav}</nav><button class="kvl-global-collapse" type="button" aria-expanded="true" title="사이드바 접기"><span class="kvl-global-icon">${icon.collapse}</span><span class="kvl-global-collapse-label">접기</span></button></aside><div class="kvl-global-backdrop"></div><button class="kvl-global-toggle" type="button" aria-expanded="false" aria-controls="kvlGlobalSidebar" aria-label="메뉴 열기">☰ <span>메뉴</span></button>`);
  const sidebar=document.querySelector('.kvl-global-sidebar');
  sidebar.id='kvlGlobalSidebar';
  const toggle=document.querySelector('.kvl-global-toggle');
  const close=document.querySelector('.kvl-global-close');
  const collapse=document.querySelector('.kvl-global-collapse');
  const backdrop=document.querySelector('.kvl-global-backdrop');
  const collapseKey='kvl.sidebarCollapsed.v1';
  let preferredCollapsed=document.documentElement.classList.contains('kvl-sidebar-pref-collapsed');
  try{preferredCollapsed=localStorage.getItem(collapseKey)==='1'}catch{}
  const setCollapsed=(value,persist=true)=>{preferredCollapsed=Boolean(value);const collapsed=preferredCollapsed&&innerWidth>900;document.documentElement.classList.toggle('kvl-sidebar-pref-collapsed',preferredCollapsed);document.body.classList.toggle('kvl-sidebar-collapsed',collapsed);collapse.setAttribute('aria-expanded',String(!collapsed));collapse.setAttribute('title',collapsed?'사이드바 펼치기':'사이드바 접기');collapse.querySelector('.kvl-global-collapse-label').textContent=collapsed?'펼치기':'접기';if(persist){try{localStorage.setItem(collapseKey,preferredCollapsed?'1':'0')}catch{}}};
  setCollapsed(preferredCollapsed,false);
  const open=()=>{sidebar.classList.add('open');backdrop.classList.add('show');document.body.classList.add('kvl-sidebar-open');toggle.setAttribute('aria-expanded','true');close.focus()};
  const shut=()=>{sidebar.classList.remove('open');backdrop.classList.remove('show');document.body.classList.remove('kvl-sidebar-open');toggle.setAttribute('aria-expanded','false')};
  toggle.addEventListener('click',()=>sidebar.classList.contains('open')?shut():open());
  close.addEventListener('click',()=>{shut();toggle.focus()});
  collapse.addEventListener('click',()=>setCollapsed(!preferredCollapsed));
  backdrop.addEventListener('click',shut);
  sidebar.querySelectorAll('.kvl-global-group-toggle').forEach(button=>button.addEventListener('click',()=>{const group=button.closest('.kvl-global-group');const next=!group.classList.contains('open');group.classList.toggle('open',next);button.setAttribute('aria-expanded',String(next))}));
  sidebar.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{if(matchMedia('(max-width:900px)').matches)shut()}));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&sidebar.classList.contains('open')){shut();toggle.focus()}});
  addEventListener('resize',()=>{if(innerWidth>900)shut();setCollapsed(preferredCollapsed,false)});
})();
