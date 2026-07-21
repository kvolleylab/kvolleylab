(()=>{
const nativeFetch=window.fetch.bind(window);
const MATCH_FILE='data/matches/vnl-2026-men.json';
const RESULT_FILE='data/results/vnl-2026-men-results.json';
const SET_FILE='data/results/vnl-2026-set-scores.json';
const FINALS_FILE='data/matches/vnl-2026-finals.json';
const clean=u=>String(typeof u==='string'?u:u?.url||'').split('?')[0].replace(/^.*\//,'');
const jsonResponse=data=>new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json;charset=utf-8'}});
const loadJson=url=>nativeFetch(url,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(url);return r.json()});
const overlayResult=row=>{const[id,homeSets,awaySets,setRows]=row;return{result_id:`${id}-R2`,match_id:id,status:'final',winner:{side:homeSets>awaySets?'home':'away'},final_score:{home_sets:homeSets,away_sets:awaySets,display:`${homeSets}-${awaySets}`},sets:(setRows||[]).map((s,i)=>({set:i+1,home_points:s[0],away_points:s[1]})),set_scores_status:'confirmed',updated_at:'2026-07-21'}};
window.fetch=(input,init)=>{
 const file=clean(input);
 if(file==='vnl-2026-men.json'){
   return Promise.all([loadJson(MATCH_FILE),loadJson(FINALS_FILE),loadJson(SET_FILE)]).then(([base,finals,sets])=>{
     const scoreMap=new Map((sets.results||[]).map(r=>[r[0],r]));
     const preliminary=(base.matches||[]).map(m=>{const row=scoreMap.get(m.match_id);return row?{...m,status:'completed',score:{home_sets:row[1],away_sets:row[2]}}:m});
     return jsonResponse({...base,generated_at:'2026-07-21',matches:[...preliminary,...(finals.matches||[])]});
   });
 }
 if(file==='vnl-2026-men-results.json'){
   return Promise.all([loadJson(RESULT_FILE).catch(()=>({results:[]})),loadJson(SET_FILE)]).then(([base,sets])=>{
     const map=new Map((base.results||[]).map(r=>[r.match_id,r]));
     (sets.results||[]).forEach(row=>map.set(row[0],overlayResult(row)));
     return jsonResponse({...base,result_version:'v2',updated_at:'2026-07-21',results:[...map.values()]});
   });
 }
 return nativeFetch(input,init);
};
function legacyId(){const raw=new URLSearchParams(location.search).get('id')||'';const m=raw.match(/^KVL-M-2026-VNL-(\d{6})$/);return m?`KVL-M-${m[1]}`:raw}
function patchFinalMeta(){const id=legacyId(),num=Number((id.match(/(\d{6})$/)||[])[1]);if(num<109)return false;const rounds={109:'8강 1',110:'8강 2',111:'8강 3',112:'8강 4',113:'준결승 1',114:'준결승 2',115:'3위 결정전',116:'결승'};const eyebrow=document.querySelector('#summary .eyebrow');if(eyebrow)eyebrow.textContent=`2026 VNL Men · ${rounds[num]||'파이널'}`;const meta=[...document.querySelectorAll('#summary .md-meta>div')];const venue=meta.find(x=>x.querySelector('span')?.textContent.trim()==='개최지');if(venue){const strong=venue.querySelector('strong');if(strong)strong.textContent='중국 (닝보)'}return !!eyebrow}
const observer=new MutationObserver(()=>{if(patchFinalMeta())observer.disconnect()});
if(document.documentElement)observer.observe(document.documentElement,{childList:true,subtree:true});
})();