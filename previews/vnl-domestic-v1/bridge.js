/* Preview composition only. The maintained domestic presentation and V2 engine own the UI. */
(()=>{'use strict';
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const params=new URLSearchParams(location.search);
if(!params.has('competition')){params.set('competition','vnl-men-2026');history.replaceState(null,'',location.pathname+'?'+params);}
window.KVLCompetitionAdapterV2=d=>{
 if(d.competitionId!=='KVL-COMP-000001'||d.season!=='2026'||d.competitionFamily!=='fivb')throw Error('This preview only supports VNL men 2026');
 return {...d,participants:d.participants.map(t=>({...t,logo:t.flag})).sort((a,b)=>a.name.localeCompare(b.name,'ko-KR')),
 standings:{...d.standings,rows:d.standings.rows.map(r=>r.team.code==='CHN'&&r.status==='host-qualified'?{...r,statusLabel:'개최국'}:r)},structure:{...d.structure,
  presentation:'domestic-home-v2',heroPresentation:'preserve',divisionLabel:'남자부',heroTitle:d.displayName,heroTagline:d.officialName,
  standings:{...d.structure.standings,showStatus:false},
  teamResults:{...d.structure.teamResults,summary:'record',preliminaryStages:['예선']},
  hubUrl:'https://kvolleylab.com/competition.html',hubCategoryLabel:'국제대회',hubLabel:'VNL',
  eyebrow:'KVL INTERNATIONAL · VOLLEYBALL NATIONS LEAGUE',
  labels:{...d.structure.labels,participantsTitle:'참가국',groupsTab:'예선순위',knockoutTab:'대진·최종순위'},
  participants:{...d.structure.participants,linkMode:'team-roster',sort:'name-ko',searchLabels:{label:'참가국 검색',placeholder:'국가명 검색',sortNote:'국가명 가나다순',emptyMessage:'검색한 국가가 없습니다.'}}
 }};
};
function profileLinks(){
 qa('[data-roster-player]').forEach(row=>{const id=row.dataset.playerId,cell=q('.kvl1180-roster-korean',row);if(!/^KVL-P-\d+$/.test(id)||!cell||q('a',cell))return;const a=document.createElement('a');a.href='https://kvolleylab.com/player.html?id='+encodeURIComponent(id);a.textContent=cell.textContent;a.target='_blank';a.rel='noopener noreferrer';a.setAttribute('aria-label',cell.textContent+' 선수 프로필');cell.replaceChildren(a);});
}
function localLabels(){
 qa('main img[alt$=" 엠블럼"]').forEach(el=>el.alt=el.alt.replace(' 엠블럼',' 국기'));
 const root=q('[data-kvl-component="participants"]');if(root)qa('.kvl1180-participant-group header span',root).forEach(el=>el.textContent=el.textContent.replaceAll('팀','개국'));
 qa('.dv2-trophy.trophy-4,.dv2-trophy.trophy-5').forEach(el=>el.remove());
 profileLinks();
}
const apply=window.KVLDomesticHomeV2.apply;
window.KVLDomesticHomeV2.apply=d=>{
 const result=apply(d);if(!result)return result;
 const overview=q('.kvl1180-view[data-view="overview"]'),meaning=q('[data-kvl-section="qualifications"]');
 if(meaning)overview.after(meaning); // Move the original rendered DOM; never copy/rewrite explanation text.
 q('[data-gender-link="men"]').textContent='남자부';q('[data-gender-link="women"]').textContent='여자부';
 const rosterTab=q('.kvl1180-tabs [data-view="rosters"] span');if(rosterTab)rosterTab.textContent='참가국·선수명단';
 qa('.dv2-metric em').forEach(el=>{if(el.textContent==='팀')el.textContent='개국';});
 const all=q('.dv2-overview-teams .dv2-heading>a');if(all)all.textContent=all.textContent.replace('팀','개국');
 const groupHeading=q('.kvl1180-combined-head>div>.label'),groupNote=q('.kvl1180-combined-head>p');
 if(groupHeading)groupHeading.textContent=d.structure.labels.standingsEyebrow;
 if(groupNote)groupNote.textContent=d.standingsNote;
 q('.dv2-utility').insertAdjacentHTML('beforeend','<small class="vnl-preview-tag">국제 기본 템플릿 기준 시안</small>');
 localLabels();return result;
};
document.addEventListener('click',e=>{
 if(e.target.closest('[data-team-code],[data-team-roster]'))requestAnimationFrame(localLabels);
 const a=e.target.closest('a[href]');if(!a)return;const u=new URL(a.getAttribute('href'),document.baseURI);
 if(u.origin===location.origin&&!u.pathname.startsWith('/previews/')&&u.pathname!==location.pathname&&(/\.html$/.test(u.pathname)||u.pathname==='/'))a.href='https://kvolleylab.com'+u.pathname+u.search+u.hash;
},true);
document.addEventListener('input',e=>{if(e.target.closest('.dv2-participant-search'))requestAnimationFrame(localLabels);});
addEventListener('popstate',()=>requestAnimationFrame(localLabels));
})();
