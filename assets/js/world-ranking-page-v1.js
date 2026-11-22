import {rankingGender} from './world-ranking-model-v1.mjs';
import {loadRanking,rankingHTML,genderLabel} from './world-ranking-ui-v1.js';
import {json} from './world-cup-ui-v1.js';
let gender=rankingGender(new URLSearchParams(location.search).get('gender')||(location.hash==='#womenPanel'?'women':'men')),bundle;
const root=document.getElementById('ranking-content');
function render(){
 document.body.dataset.gender=gender;document.title=`2028 FIVB ${genderLabel(gender)} 세계랭킹 · LA28 출전권 | K-Volley Lab`;
 root.innerHTML=rankingHTML(bundle,gender,{detail:true});root.querySelectorAll('[data-ranking-gender]').forEach(b=>b.addEventListener('click',()=>{gender=b.dataset.rankingGender;render();root.querySelector(`[data-ranking-gender="${gender}"]`).focus({preventScroll:true});}));
 document.getElementById('ranking-return').href=`olympic-roadmap.html?cycle=la2028&ranking=${gender}`;
 const u=new URL(location.href);u.searchParams.set('gender',gender);history.replaceState(history.state,'',u);
}
async function load(){try{bundle=await loadRanking(await json('data/olympics/la2028_v1.json'));render();}catch{root.innerHTML='<h2>세계랭킹 출전 경로</h2><p role="status">공식 안내를 불러오지 못했습니다.</p><button type="button" class="wr-retry">다시 불러오기</button>';root.querySelector('button').addEventListener('click',load);}}
window.addEventListener('hashchange',()=>{if(['#menPanel','#womenPanel'].includes(location.hash)&&bundle){gender=location.hash==='#womenPanel'?'women':'men';render();}});load();
