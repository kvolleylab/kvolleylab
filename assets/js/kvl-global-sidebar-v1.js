(()=>{
  const path=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  if(document.querySelector('.kvl-global-sidebar'))return;

  const competitionPages=new Set(['competition.html','vnl.html','match.html','japan.html','brazil.html','poland.html','iran.html','usa.html','france.html','argentina.html','italy.html','canada.html','belgium.html','cuba.html','slovenia.html','bulgaria.html','germany.html','serbia.html','turkiye.html','china.html','ukraine.html']);
  const playerPages=new Set(['players.html','player.html','player-search.html','player-compare.html','draft-hub.html']);
  const schedulePages=new Set(['schedules.html','competition-calendar.html']);
  const teamPages=new Set(['university-teams.html']);
  const simulatorPages=new Set(['simulator.html','danyang-qualification-calculator.html']);
  let active='';
  if(path==='index.html'||path==='')active='home';
  else if(schedulePages.has(path))active='schedules';
  else if(competitionPages.has(path))active='competition';
  else if(simulatorPages.has(path))active='simulator';
  else if(teamPages.has(path))active='teams';
  else if(playerPages.has(path))active='players';
  else if(path==='pamphlet-archive.html')active='records';

  const icon={
    home:'<svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5"></path><path d="M5.5 10.5V20h13v-9.5"></path><path d="M9.5 20v-6h5v6"></path></svg>',
    calendar:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M7 3v4M17 3v4M3 10h18"></path><path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01"></path></svg>',
    globe:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M3.5 9h17M3.5 15h17M12 3c2.2 2.4 3.3 5.4 3.3 9S14.2 18.6 12 21c-2.2-2.4-3.3-5.4-3.3-9S9.8 5.4 12 3Z"></path></svg>',
    calculator:'<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2"></rect><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"></path></svg>',
    teams:'<svg viewBox="0 0 24 24"><path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"></path><path d="M2.5 20c.4-4 2.3-6 5.5-6s5.1 2 5.5 6M10.5 20c.4-4 2.3-6 5.5-6s5.1 2 5.5 6"></path></svg>',
    player:'<svg viewBox="0 0 24 24"><circle cx="12" cy="7" r="3"></circle><path d="M5 21c.5-5.1 2.8-7.6 7-7.6S18.5 15.9 19 21"></path></svg>',
    file:'<svg viewBox="0 0 24 24"><path d="M5 3h11l3 3v15H5z"></path><path d="M16 3v4h4M8 11h8M8 15h8M8 19h5"></path></svg>',
    request:'<svg viewBox="0 0 24 24"><path d="M4 5h16v14H4z"></path><path d="m8 10 4 3 4-3"></path></svg>'
  };

  const items=[
    ['home','index.html',icon.home,'홈'],
    ['section','정보'],
    ['schedules','competition-calendar.html?year=2026',icon.calendar,'경기 일정'],
    ['competition','competition.html',icon.globe,'국제 대회'],
    ['teams','university-teams.html',icon.teams,'대학 팀'],
    ['players','players.html',icon.player,'선수'],
    ['section','도구'],
    ['simulator','simulator.html',icon.calculator,'진출 계산기'],
    ['records','pamphlet-archive.html',icon.file,'기록실'],
    ['section','지원'],
    ['request','https://forms.gle/MFNYhJX6Bq5zeNmp8',icon.request,'요청하기','external']
  ];

  const nav=items.map(item=>{
    if(item[0]==='section')return `<p class="kvl-global-section">${item[1]}</p>`;
    const current=active===item[0];
    const external=item[4]==='external'?' target="_blank" rel="noopener"':'';
    return `<a class="${current?'active':''}" href="${item[1]}"${current?' aria-current="page"':''}${external}><span class="kvl-global-icon">${item[2]}</span>${item[3]}</a>`;
  }).join('');

  document.body.classList.add('kvl-sidebar-enabled');
  document.body.insertAdjacentHTML('afterbegin',`<aside class="kvl-global-sidebar" aria-label="K-Volley Lab 메뉴"><div class="kvl-global-sidebar-head"><a class="kvl-global-brand" href="index.html"><span class="kvl-global-mark">K</span><strong>K-VOLLEY LAB</strong></a><button class="kvl-global-close" type="button" aria-label="메뉴 닫기">×</button></div><nav class="kvl-global-nav">${nav}</nav></aside><div class="kvl-global-backdrop"></div><button class="kvl-global-toggle" type="button" aria-expanded="false" aria-label="메뉴 열기">☰ 메뉴</button>`);

  const sidebar=document.querySelector('.kvl-global-sidebar');
  const toggle=document.querySelector('.kvl-global-toggle');
  const close=document.querySelector('.kvl-global-close');
  const backdrop=document.querySelector('.kvl-global-backdrop');
  const open=()=>{sidebar.classList.add('open');backdrop.classList.add('show');document.body.classList.add('kvl-sidebar-open');toggle.setAttribute('aria-expanded','true')};
  const shut=()=>{sidebar.classList.remove('open');backdrop.classList.remove('show');document.body.classList.remove('kvl-sidebar-open');toggle.setAttribute('aria-expanded','false')};
  toggle.addEventListener('click',()=>sidebar.classList.contains('open')?shut():open());
  close.addEventListener('click',shut);
  backdrop.addEventListener('click',shut);
  sidebar.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{if(matchMedia('(max-width:900px)').matches)shut()}));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')shut()});
  addEventListener('resize',()=>{if(innerWidth>900)shut()});
})();