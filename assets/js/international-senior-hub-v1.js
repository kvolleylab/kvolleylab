(()=> {
  const grid=document.getElementById('seniorRecentGrid');
  if(!grid)return;

  const DATA_URL='data/international/senior-competitions.json?v=20260919-4';
  const pad=n=>String(n).padStart(2,'0');
  const now=new Date();
  const today=now.getFullYear()+'-'+pad(now.getMonth()+1)+'-'+pad(now.getDate());
  const DESKTOP_SOURCE_WIDTH=1180;

  const recentSort=(a,b)=>{
    const aActive=a.startDate<=today&&today<=a.endDate;
    const bActive=b.startDate<=today&&today<=b.endDate;
    if(aActive!==bActive)return bActive-aActive;
    if(aActive)return b.startDate.localeCompare(a.startDate);
    return b.endDate.localeCompare(a.endDate);
  };

  const resizePreview=frame=>{
    const shell=frame.parentElement;
    if(!shell)return;
    const heroHeight=Number(frame.dataset.heroHeight)||218;
    const mobileHub=window.matchMedia('(max-width:900px)').matches;

    if(mobileHub){
      const available=shell.clientWidth||1;
      const scale=Math.min(1,available/DESKTOP_SOURCE_WIDTH);
      frame.style.width=DESKTOP_SOURCE_WIDTH+'px';
      frame.style.height=heroHeight+'px';
      frame.style.transform='scale('+scale+')';
      shell.style.height=Math.ceil(heroHeight*scale)+'px';
      shell.dataset.previewMode='desktop-source';
    }else{
      frame.style.width='100%';
      frame.style.height=heroHeight+'px';
      frame.style.transform='none';
      shell.style.height=heroHeight+'px';
      shell.dataset.previewMode='mobile-source';
    }
  };

  const injectPreviewMode=(frame,item)=>{
    try{
      const doc=frame.contentDocument;
      if(!doc)return;

      const selector=item.preview?.heroSelector||'.kvl1180-hero';
      const attach=hero=>{
        if(!hero||frame.dataset.previewAttached==='true')return;
        frame.dataset.previewAttached='true';

        const style=doc.createElement('style');
      style.setAttribute('data-kvl-recent-preview','true');
      style.textContent=[
        'html,body{margin:0!important;padding:0!important;background:transparent!important;overflow:hidden!important}',
        'body::before,.site-header,.site-footer,.kvl1180-controlbar{display:none!important}',
        '.kvl1180-main{width:100%!important;max-width:none!important;margin:0!important;padding:0!important}',
        '.kvl1180-hero{margin:0!important;border-radius:0!important;box-shadow:none!important}'
      ].join('');
      doc.head.appendChild(style);

      const main=hero.closest('.kvl1180-main')||hero.parentElement;
      if(main){
        [...main.children].forEach(el=>{
          if(el!==hero)el.style.display='none';
        });
      }

      const apply=()=>{
        const rect=hero.getBoundingClientRect();
        const h=Math.max(1,Math.ceil(rect.height));
        frame.dataset.heroHeight=String(h);
        resizePreview(frame);
      };

      frame.contentWindow?.scrollTo(0,0);
      requestAnimationFrame(()=>requestAnimationFrame(apply));
        setTimeout(apply,250);
        setTimeout(apply,900);
      };

      const existing=doc.querySelector(selector);
      if(existing){
        attach(existing);
        return;
      }

      const observer=new MutationObserver(()=>{
        const hero=doc.querySelector(selector);
        if(!hero)return;
        observer.disconnect();
        attach(hero);
      });
      observer.observe(doc.documentElement,{childList:true,subtree:true});

      setTimeout(()=>{
        observer.disconnect();
        if(frame.dataset.previewAttached!=='true'){
          frame.closest('.senior-recent-card')?.classList.add('is-preview-fallback');
        }
      },5000);
    }catch{
      frame.closest('.senior-recent-card')?.classList.add('is-preview-fallback');
    }
  };

  const renderPreview=item=>{
    const card=document.createElement('a');
    card.className='senior-recent-card';
    card.href=item.href;
    card.dataset.competition=item.id;
    card.setAttribute('aria-label',(item.title||'국제대회')+' 페이지 열기');

    const shell=document.createElement('div');
    shell.className='senior-recent-preview-shell';

    const frame=document.createElement('iframe');
    frame.className='senior-recent-preview-frame';
    frame.src=item.preview?.url||item.href;
    frame.title=(item.title||'국제대회')+' 메인카드 미리보기';
    frame.loading='eager';
    frame.tabIndex=-1;
    frame.setAttribute('aria-hidden','true');

    frame.addEventListener('load',()=>injectPreviewMode(frame,item));
    shell.appendChild(frame);
    card.appendChild(shell);
    return card;
  };

  const showError=()=>{
    grid.innerHTML='<div class="senior-recent-loading">최근 대회를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.</div>';
  };

  fetch(DATA_URL,{cache:'no-cache'})
    .then(res=>{if(!res.ok)throw new Error('recent data');return res.json()})
    .then(data=>{
      const limit=Number(data.recentPolicy&&data.recentPolicy.limit)||3;
      const excludeFuture=!(data.recentPolicy&&data.recentPolicy.excludeFuture===false);
      const items=(data.competitions||[])
        .filter(item=>item.showInRecent!==false&&item.startDate&&item.endDate)
        .filter(item=>!excludeFuture||item.startDate<=today)
        .sort(recentSort)
        .slice(0,limit);

      if(!items.length){showError();return}
      grid.innerHTML='';
      items.forEach(item=>grid.appendChild(renderPreview(item)));
    })
    .catch(showError);

  let resizeTimer=0;
  window.addEventListener('resize',()=>{
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(()=>{
      grid.querySelectorAll('.senior-recent-preview-frame').forEach(resizePreview);
    },80);
  },{passive:true});
})();