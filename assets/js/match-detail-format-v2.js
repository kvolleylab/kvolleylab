(()=>{
const area=document.getElementById('matchArea');
if(!area)return;
const weekdays=['일','월','화','수','목','금','토'];
function formatKst(raw){
  const m=String(raw||'').match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}:\d{2})/);
  if(!m)return raw;
  const [,y,mo,d,t]=m;
  const w=weekdays[new Date(Number(y),Number(mo)-1,Number(d)).getDay()];
  return `${y}.${mo}.${d}(${w}) ${t}`;
}
function formatLocal(raw){
  const s=String(raw||'').replace(/\s+/g,' ').trim();
  const m=s.match(/(\d{4})\.\s*(\d{2})\.\s*(\d{2})\.?\s*\(([^)]+)\)\s*(\d{2}:\d{2})/);
  if(!m)return s;
  return `${m[1]}.${m[2]}.${m[3]}(${m[4]}) ${m[5]}`;
}
function apply(){
  const hero=area.querySelector('#summary');
  if(!hero)return false;
  const status=hero.querySelector('.md-status-line');
  if(status){const spans=status.querySelectorAll('span');if(spans[1])spans[1].remove();}
  const meta=hero.querySelectorAll('.md-meta > div');
  if(meta[0]){const strong=meta[0].querySelector('strong');if(strong)strong.textContent=formatKst(strong.textContent);}
  if(meta[1]){const strong=meta[1].querySelector('strong');if(strong)strong.textContent=formatLocal(strong.textContent);}
  return true;
}
if(!apply()){
  const observer=new MutationObserver(()=>{if(apply())observer.disconnect();});
  observer.observe(area,{childList:true,subtree:true});
}
})();