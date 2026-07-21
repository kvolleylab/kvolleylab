(()=>{
const nativeFetch=window.fetch.bind(window);
const CALENDAR_FILE='data/matches/vnl-2026-calendar.json?v=20260721-verified';
const RESULT_FILE='data/results/vnl-2026-men-results.json';
const SET_FILE='data/results/vnl-2026-set-scores.json?v=20260721-verified';
const clean=u=>String(typeof u==='string'?u:u?.url||'').split('?')[0].replace(/^.*\//,'');
const jsonResponse=data=>new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json;charset=utf-8'}});
const loadJson=url=>nativeFetch(url,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(url);return r.json()});
const TEAM={일본:['Japan','P01'],브라질:['Brazil','P02'],폴란드:['Poland','P03'],이란:['Iran','P04'],미국:['USA','P05'],프랑스:['France','P06'],아르헨티나:['Argentina','P07'],이탈리아:['Italy','P08'],캐나다:['Canada','P09'],벨기에:['Belgium','P10'],쿠바:['Cuba','P11'],슬로베니아:['Slovenia','P12'],독일:['Germany','P13'],세르비아:['Serbia','P14'],튀르키예:['Türkiye','P15'],불가리아:['Bulgaria','P16'],중국:['China','P17'],우크라이나:['Ukraine','P18']};
const VENUE={중국:['China','린이'],브라질:['Brazil','브라질리아'],캐나다:['Canada','오타와'],프랑스:['France','오를레앙'],폴란드:['Poland','글리비체'],슬로베니아:['Slovenia','류블랴나'],세르비아:['Serbia','베오그라드'],미국:['USA','시카고'],일본:['Japan','오사카'],'중국(닝보)':['China','닝보']};
const team=name=>{const x=TEAM[name];return{name_ko:name,name_en:x?.[0]||name,...(x?{participant_id:`KVL-COMP-000001-${x[1]}`}:{})}};
const toMatch=(x,i)=>{const no=i+1,id=`KVL-M-${String(no).padStart(6,'0')}`,score=x[5]?x[5].split('-').map(Number):null,v=VENUE[x[6]]||[x[6],x[6]],finals=no>108,rounds={109:'Quarterfinal',110:'Quarterfinal',111:'Quarterfinal',112:'Quarterfinal',113:'Semifinal',114:'Semifinal',115:'3rd Place',116:'Final'};return{match_id:id,competition_id:'KVL-COMP-000001',season:2026,stage:finals?'finals':'preliminary',week:finals?null:x[2],round:finals?rounds[no]:`Week ${x[2]}`,date_kst:x[0],time_kst:x[1],datetime_kst:`${x[0]}T${x[1]}:00+09:00`,timezone:'Asia/Seoul',home:team(x[3]),away:team(x[4]),venue:{country_ko:x[6]==='중국(닝보)'?'중국':x[6],country_en:v[0],city_ko:v[1]},status:score?'completed':'scheduled',score:score?{home_sets:score[0],away_sets:score[1]}:null,source_text:`${x[3]} ${x[5]||'vs'} ${x[4]}`}};
const overlayResult=row=>{const[id,homeSets,awaySets,setRows]=row;return{result_id:`${id}-R2`,match_id:id,status:'final',winner:{side:homeSets>awaySets?'home':'away'},final_score:{home_sets:homeSets,away_sets:awaySets,display:`${homeSets}-${awaySets}`},sets:(setRows||[]).map((s,i)=>({set:i+1,home_points:s[0],away_points:s[1]})),set_scores_status:'confirmed',updated_at:'2026-07-21'}};
window.fetch=(input,init)=>{
 const file=clean(input);
 if(file==='vnl-2026-men.json')return loadJson(CALENDAR_FILE).then(data=>jsonResponse({competition_id:'KVL-COMP-000001',timezone:'Asia/Seoul',generated_at:'2026-07-21',verification:'calendar-derived; 108 preliminary matches checked against official final standings',matches:(data.matches||[]).map(toMatch)}));
 if(file==='vnl-2026-men-results.json')return Promise.all([loadJson(RESULT_FILE).catch(()=>({results:[]})),loadJson(SET_FILE)]).then(([base,sets])=>{const map=new Map((base.results||[]).map(r=>[r.match_id,r]));(sets.results||[]).forEach(row=>map.set(row[0],overlayResult(row)));return jsonResponse({...base,result_version:'verified-v3',updated_at:'2026-07-21',results:[...map.values()]})});
 return nativeFetch(input,init);
};
function legacyId(){const raw=new URLSearchParams(location.search).get('id')||'';const m=raw.match(/^KVL-M-2026-VNL-(\d{6})$/);return m?`KVL-M-${m[1]}`:raw}
function patchFinalMeta(){const id=legacyId(),num=Number((id.match(/(\d{6})$/)||[])[1]);if(num<109)return false;const rounds={109:'8강 1',110:'8강 2',111:'8강 3',112:'8강 4',113:'준결승 1',114:'준결승 2',115:'3위 결정전',116:'결승'};const eyebrow=document.querySelector('#summary .eyebrow');if(eyebrow)eyebrow.textContent=`2026 VNL Men · ${rounds[num]||'파이널'}`;const meta=[...document.querySelectorAll('#summary .md-meta>div')];const venue=meta.find(x=>x.querySelector('span')?.textContent.trim()==='개최지');if(venue){const strong=venue.querySelector('strong');if(strong)strong.textContent='중국 (닝보)'}return !!eyebrow}
const observer=new MutationObserver(()=>{if(patchFinalMeta())observer.disconnect()});if(document.documentElement)observer.observe(document.documentElement,{childList:true,subtree:true});
})();