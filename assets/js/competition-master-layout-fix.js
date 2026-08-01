(()=>{
  'use strict';
  const normalize=()=>{
    const title=document.getElementById('cdTitle');
    if(title){
      const lines=[...title.querySelectorAll('.cd-hero-title-line')]
        .map(node=>node.textContent.trim())
        .filter(Boolean);
      if(lines.length>1){
        const first=lines[0];
        const cleaned=[];
        for(const line of lines){
          let value=line;
          if(cleaned.length&&value.startsWith(`${first} `))value=value.slice(first.length).trim();
          if(value&&!cleaned.includes(value))cleaned.push(value);
        }
        title.innerHTML=cleaned.map(line=>`<span class="cd-hero-title-line"></span>`).join('');
        [...title.children].forEach((node,index)=>{node.textContent=cleaned[index]||'';});
      }
    }
    document.querySelectorAll('.kvl-competition-list-link').forEach(link=>link.remove());
  };
  const run=()=>{
    normalize();
    const title=document.getElementById('cdTitle');
    if(title){
      const observer=new MutationObserver(normalize);
      observer.observe(title,{childList:true,subtree:true,characterData:true});
    }
  };
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',run,{once:true}):run();
})();
