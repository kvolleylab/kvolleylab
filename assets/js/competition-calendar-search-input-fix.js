(()=>{
  const root=document.getElementById('competitionCalendar');
  if(!root)return;

  function applySearch(){
    const input=root.querySelector('[data-search]');
    if(!input||input.dataset.stableSearch==='true')return;

    input.dataset.stableSearch='true';
    input.oninput=null;
    input.oncompositionstart=null;
    input.oncompositionend=null;

    const field=input.closest('.cc-search-field');
    if(!field)return;

    let submit=field.querySelector('[data-search-submit]');
    if(!submit){
      submit=document.createElement('button');
      submit.type='button';
      submit.dataset.searchSubmit='true';
      submit.textContent='검색';
      field.appendChild(submit);
    }

    const run=()=>{
      const url=new URL(location.href);
      const value=input.value.trim();
      if(value)url.searchParams.set('q',value);
      else url.searchParams.delete('q');
      location.assign(url.toString());
    };

    submit.onclick=run;
    input.onkeydown=e=>{
      if(e.key==='Enter'&&!e.isComposing){
        e.preventDefault();
        run();
      }
    };

    const clear=field.querySelector('[data-search-clear]');
    if(clear){
      clear.onclick=()=>{
        const url=new URL(location.href);
        url.searchParams.delete('q');
        location.assign(url.toString());
      };
    }
  }

  const observer=new MutationObserver(applySearch);
  observer.observe(root,{childList:true,subtree:true});
  applySearch();
})();