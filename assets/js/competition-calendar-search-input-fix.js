(()=>{
  const root=document.getElementById('competitionCalendar');
  if(!root)return;

  function stabilizeSearch(){
    const input=root.querySelector('[data-search]');
    if(!input||input.dataset.inputFixed==='true')return;

    const originalHandler=input.oninput;
    if(typeof originalHandler!=='function')return;

    input.dataset.inputFixed='true';
    let timer=null;
    let composing=false;

    const runSearch=()=>{
      clearTimeout(timer);
      timer=null;
      originalHandler.call(input,new Event('input',{bubbles:true}));
    };

    input.oncompositionstart=()=>{
      composing=true;
      clearTimeout(timer);
    };

    input.oncompositionend=()=>{
      composing=false;
      runSearch();
    };

    input.oninput=()=>{
      if(composing)return;
      clearTimeout(timer);
      timer=setTimeout(runSearch,220);
    };
  }

  const observer=new MutationObserver(stabilizeSearch);
  observer.observe(root,{childList:true,subtree:true});
  stabilizeSearch();
})();
