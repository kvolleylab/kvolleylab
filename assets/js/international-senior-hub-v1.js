(()=> {
  const grid=document.getElementById('seniorRecentGrid');
  if(!grid)return;

  const DATA_URL='data/international/senior-competitions.json?v=20260919-3';
  const pad=n=>String(n).padStart(2,'0');
  const now=new Date();
  const today=now.getFullYear()+'-'+pad(now.getMonth()+1)+'-'+pad(now.getDate());
  const clean=value=>String(value||'').replace(/\s+/g,' ').trim();

  const recentSort=(a,b)=>{
    const aActive=a.startDate<=today&&today<=a.endDate;
    const bActive=b.startDate<=today&&today<=b.endDate;
    if(aActive!==bActive)return bActive-aActive;
    if(aActive)return b.startDate.localeCompare(a.startDate);
    return b.endDate.localeCompare(a.endDate);
  };

  const fallbackSnapshot=item=>({
    eyebrow:item.brand||'INTERNATIONAL COMPETITION',
    title:item.title||'국제대회',
    subtitle:'',
    date:item.startDate&&item.endDate?item.startDate+' ~ '+item.endDate:'',
    location:item.location||'',
    statuses:[],
    accentStatus:'대회 보기'
  });

  const sourcePageSnapshot=async item=>{
    const hero=item.hero||{};
    const res=await fetch(hero.sourcePage,{cache:'force-cache'});
    if(!res.ok)throw new Error('source page');
    const html=await res.text();
    const doc=new DOMParser().parseFromString(html,'text/html');
    const root=doc.querySelector(hero.selector||'.kvl1180-hero');
    if(!root)throw new Error('hero');
    const meta=[...root.querySelectorAll('.kvl1180-meta-row')].map(el=>clean(el.textContent));
    const statusEls=[...root.querySelectorAll('.kvl1180-hero-status span')];
    const statuses=statusEls.filter(el=>!el.classList.contains('is-accent')).map(el=>clean(el.textContent)).filter(Boolean);
    const accentEl=root.querySelector('.kvl1180-hero-status .is-accent');
    return {
      eyebrow:clean(root.querySelector('.kvl1180-eyebrow')?.textContent)||item.brand,
      title:clean(root.querySelector('h1')?.textContent)||item.title,
      subtitle:clean(root.querySelector('.kvl1180-hero-sub')?.textContent),
      date:meta[0]||'',
      location:meta[1]||item.location||'',
      statuses,
      accentStatus:clean(accentEl?.textContent)||'대회 보기'
    };
  };

  const configSnapshot=async item=>{
    const hero=item.hero||{};
    const [configRes,dataRes]=await Promise.all([
      fetch(hero.config,{cache:'force-cache'}),
      fetch(hero.data,{cache:'force-cache'})
    ]);
    if(!configRes.ok||!dataRes.ok)throw new Error('competition config');
    const [config,d]=await Promise.all([configRes.json(),dataRes.json()]);
    const statusMap={completed:'대회 종료',live:'대회 진행',upcoming:'대회 예정'};
    return {
      eyebrow:'INTERNATIONAL COMPETITION · '+String(config.competition?.gender||item.gender||'').toUpperCase(),
      title:config.competition?.displayName||item.title,
      subtitle:config.competition?.officialName||'',
      date:d.dateLabel||'',
      location:[d.locationLabel,d.venueLabel].filter(Boolean).join(' · '),
      statuses:[statusMap[d.status]||d.status||'',d.teamCount?d.teamCount+'개국':''].filter(Boolean),
      accentStatus:d.stageLabel||statusMap[d.status]||'대회 보기',
      sourceHero:config.hero||null
    };
  };

  const loadSnapshot=async item=>{
    try{
      if(item.hero?.mode==='source-page')return await sourcePageSnapshot(item);
      if(item.hero?.mode==='competition-config')return await configSnapshot(item);
    }catch{}
    return fallbackSnapshot(item);
  };

  const resolveConfigPhoto=async(card,sourceHero)=>{
    if(!sourceHero||sourceHero.mode!=='photo')return;
    try{
      let image=sourceHero.pcImage||sourceHero.mobileImage||'';
      if(Array.isArray(sourceHero.b64Chunks)&&sourceHero.b64Chunks.length){
        const parts=await Promise.all(sourceHero.b64Chunks.map(async path=>{
          const res=await fetch(path,{cache:'force-cache'});
          if(!res.ok)throw new Error('hero chunk');
          return (await res.text()).replace(/\s+/g,'');
        }));
        image='data:'+(sourceHero.mimeType||'image/webp')+';base64,'+parts.join('');
      }
      if(!image)return;
      card.style.setProperty('--snapshot-image','url("'+image+'")');
      card.style.setProperty('--snapshot-pc-position',sourceHero.mobilePosition||sourceHero.position||'right center');
      card.style.setProperty('--snapshot-mobile-position',sourceHero.position||sourceHero.mobilePosition||'center center');
      card.classList.add('has-photo');
    }catch{}
  };

  const renderHero=(item,snapshot)=>{
    const card=document.createElement('a');
    card.className='senior-recent-card';
    card.href=item.href;
    card.dataset.competition=item.id;
    card.style.setProperty('--snapshot-a',item.hero?.themeA||'#074827');
    card.style.setProperty('--snapshot-b',item.hero?.themeB||'#0e7b43');
    card.style.setProperty('--snapshot-accent',item.hero?.accent||'#f2e8cf');
    card.style.setProperty('--snapshot-eyebrow',item.hero?.eyebrow||'#e6c46c');
    card.style.setProperty('--snapshot-border',item.hero?.border||'rgba(9,67,39,.35)');

    const hero=document.createElement('div');
    hero.className='senior-recent-hero';

    const copy=document.createElement('div');
    copy.className='senior-recent-hero-copy';

    const eyebrow=document.createElement('p');
    eyebrow.className='senior-recent-eyebrow';
    eyebrow.textContent=snapshot.eyebrow||item.brand||'INTERNATIONAL COMPETITION';

    const title=document.createElement('h3');
    title.textContent=snapshot.title||item.title;

    const subtitle=document.createElement('p');
    subtitle.className='senior-recent-sub';
    subtitle.textContent=snapshot.subtitle||'';

    const meta=document.createElement('div');
    meta.className='senior-recent-meta';

    if(snapshot.date){
      const row=document.createElement('div');
      row.className='senior-recent-meta-row';
      row.innerHTML='<span class="senior-recent-meta-icon" aria-hidden="true">▣</span><span></span>';
      row.lastElementChild.textContent=snapshot.date;
      meta.appendChild(row);
    }
    if(snapshot.location){
      const row=document.createElement('div');
      row.className='senior-recent-meta-row';
      row.innerHTML='<span class="senior-recent-meta-icon" aria-hidden="true">●</span><span></span>';
      row.lastElementChild.textContent=snapshot.location;
      meta.appendChild(row);
    }

    copy.append(eyebrow,title);
    if(snapshot.subtitle)copy.appendChild(subtitle);
    copy.appendChild(meta);

    const status=document.createElement('div');
    status.className='senior-recent-status';
    (snapshot.statuses||[]).forEach(value=>{
      const pill=document.createElement('span');
      pill.textContent=value;
      status.appendChild(pill);
    });
    const accent=document.createElement('span');
    accent.className='is-accent';
    accent.textContent=snapshot.accentStatus||'대회 보기';
    status.appendChild(accent);

    hero.append(copy,status);
    card.appendChild(hero);
    if(snapshot.sourceHero)resolveConfigPhoto(card,snapshot.sourceHero);
    return card;
  };

  const showError=()=>{
    grid.innerHTML='<div class="senior-recent-loading">최근 대회를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.</div>';
  };

  fetch(DATA_URL,{cache:'no-cache'})
    .then(res=>{if(!res.ok)throw new Error('recent data');return res.json()})
    .then(async data=>{
      const limit=Number(data.recentPolicy&&data.recentPolicy.limit)||3;
      const excludeFuture=!(data.recentPolicy&&data.recentPolicy.excludeFuture===false);
      const items=(data.competitions||[])
        .filter(item=>item.showInRecent!==false&&item.startDate&&item.endDate)
        .filter(item=>!excludeFuture||item.startDate<=today)
        .sort(recentSort)
        .slice(0,limit);

      if(!items.length){showError();return}
      const snapshots=await Promise.all(items.map(loadSnapshot));
      grid.innerHTML='';
      items.forEach((item,index)=>grid.appendChild(renderHero(item,snapshots[index])));
    })
    .catch(showError);
})();