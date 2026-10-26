#!/usr/bin/env node
/* Reproducible DATA ONLY migration from the deployed school score bundles.
 * Legacy files remain the source snapshot; never recalculate scores from set points.
 * Local VM reads trusted repository constants only; no browser eval or remote code.
 */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const divisions=[['high-men','남고부','18세이하 남자부'],['high-women','여고부','18세이하 여자부'],['middle-men','남중부','15세이하 남자부'],['middle-women','여중부','15세이하 여자부']];
const definitions=[
 ['spring','spring-middle-high-2026','school-competition-spring-2026.html'],
 ['samcheok','middle-high-first-2026','school-competition-samcheok-2026.html'],
 ['iksan','middle-high-second-2026','school-competition-iksan-2026.html'],
 ['presidents','presidents-cup-middle-high-2026','school-competition-presidents-2026.html'],
 ['ibk','ibk-middle-high-2026','ibk-middle-high-2026.html']
];
// Source links copied from the base-commit legacy pages, retained after their redirects.
const sourceResources={"spring":[{"title":"춘계전국중고배구연맹전 공식자료","url":"https://drive.google.com/file/d/1SYkStAnh8hMiUIyM_2oEWVdZHML7l5tX"},{"title":"춘계전국중고배구연맹전 공식자료 보관함","url":"https://drive.google.com/drive/folders/17KXSC84GQtVjvtbmuDAfqh7CM5CDmt5q"}],"samcheok":[{"title":"한국중고배구 1차 연맹전 삼척대회 공식자료","url":"https://drive.google.com/file/d/1oaWVWpTtdIsxAjS-_wQTSipsQbmpnLBx"},{"title":"한국중고배구 1차 연맹전 삼척대회 공식자료 보관함","url":"https://drive.google.com/drive/folders/1EQx_iLXJon5YoexDLc_06b2-fi2UYhn7"}],"iksan":[{"title":"한국중고배구 2차 연맹전 익산보석배대회 공식자료","url":"https://drive.google.com/file/d/1tM5RFGQRnFrvNW92eQ85zbBGxz2KlnFK"},{"title":"한국중고배구 2차 연맹전 익산보석배대회 공식자료 보관함","url":"https://drive.google.com/drive/folders/1UyNViuGvPKq4A5KyK4Ja6YmgnfTrv939"}],"presidents":[{"title":"제59회 대통령배 전국중고배구대회 공식자료","url":"https://drive.google.com/file/d/1oMmohcnIDQf4E8fRv1APPK1nnfZq8UEr/view?usp=drivesdk"},{"title":"제59회 대통령배 전국중고배구대회 참가요강·기록 원문","url":"https://drive.google.com/file/d/1p4pDIsHiC95oDdKY46ySG3_Q6bWh2kel/view?usp=drivesdk"}],"ibk":[{"title":"IBK기업은행배 전국중고배구대회 공식자료","url":"https://drive.google.com/uc?export=download&id=1NGytIv0UqbCMCAPrFWIf0ZFW3qaXTEki"},{"title":"IBK기업은행배 전국중고배구대회 참가요강·기록 원문","url":"https://drive.google.com/file/d/1hbdact8MYEPAIZ2qHKtpEjOJIOQp3uI0/view"},{"title":"IBK기업은행배 전국중고배구대회 참가요강·기록 원문","url":"https://drive.google.com/uc?export=download&id=16O-WpuLf9VmNfF-TStyKQEjfFi6bz8wM"}]};
const hero={pcImage:'/assets/img/home-hero/kvl-home-hero-pc-v01.webp',mobileImage:'/assets/img/home-hero/kvl-home-hero-mobile-v01.webp',showImage:true,mode:'photo',position:'center center',mobilePosition:'72% center',alt:'K-Volley Lab 중·고 배구대회'};
const catalog=json('data/competitions/school-index-2026.json');
const aliases=json('data/master/school_logo_manifest_2026.json').aliases;
const canonical=n=>aliases[n]||n;
const teamCode=n=>'SCH-'+crypto.createHash('sha1').update(canonical(n)).digest('hex').slice(0,10).toUpperCase();
const ratio=(a,b)=>b?a/b:a?Infinity:0,ratioText=n=>n===Infinity?'MAX':n.toFixed(3);
function constants(file,from,to,expression,context={}){vm.createContext(context);const s=read(file);vm.runInContext(s.slice(s.indexOf(from),s.indexOf(to))+';globalThis.extracted='+expression,context);return context.extracted;}
function legacy(name){
 const context={window:{}};vm.createContext(context);
 for(const file of fs.readdirSync(path.join(root,'assets/js/data')).filter(f=>f.startsWith(`school-${name}-2026-games-`)).sort())vm.runInContext(read('assets/js/data/'+file),context);
 const data=constants(`assets/js/school-competition-${name}-2026.js`,'const D=','const $=',name==='ibk'?'{G}':'{G,teams,podium}',context);
 data.groupGamesSource=Object.values(context.window)[0]||data.G;
 if(name==='presidents')data.groups=constants('assets/js/school-competition-presidents-goseong-template.js','const GROUPS=','const state=','GROUPS');
 if(name==='ibk'){
  const final=constants('assets/js/school-competition-ibk-division-adapter.js','const FINAL=','const state=','{FINAL,PODIUM}');
  // The deployed adapter replaces the scheduled knockout slots with these results.
  data.G=data.G.map(g=>{
   const rows=data.G.filter(x=>x.division===g.division&&x.date===g.date&&x.stage===g.stage),index=rows.indexOf(g);
   const patch=(final.FINAL[g.division]||[]).filter(x=>x.date===g.date&&x.stage===g.stage)[index];
   return patch?{...g,...patch}:g;
  });
  data.podium=final.PODIUM;
  data.groupRows=constants('assets/js/school-competition-ibk-groups.js','const DATA=','const state=','DATA');
  data.groups=Object.fromEntries(Object.entries(data.groupRows).map(([d,groups])=>[d,Object.fromEntries(Object.entries(groups).map(([id,rows])=>[id,rows.map(r=>r.team)]))]));
 }
 return data;
}
function deriveGroups(games){
 const adj=new Map(),seen=new Set(),groups=[];
 for(const g of games.filter(g=>['예선','사전경기'].includes(g.stage))){for(const n of [g.teamA,g.teamB])if(!adj.has(n))adj.set(n,new Set());adj.get(g.teamA).add(g.teamB);adj.get(g.teamB).add(g.teamA);}
 for(const team of adj.keys()){if(seen.has(team))continue;const stack=[team],members=[];seen.add(team);while(stack.length){const n=stack.pop();members.push(n);for(const next of adj.get(n))if(!seen.has(next)){seen.add(next);stack.push(next);}}groups.push(members);}
 return Object.fromEntries(groups.map((teams,i)=>[String.fromCharCode(65+i),teams]));
}
function groupRows(members,games,officialRows){
 if(officialRows)return officialRows.map((r,i)=>({rank:i+1,team:{code:teamCode(r.team)},played:r.gp,wins:r.w,losses:r.l,points:null,setRatio:typeof r.sr==='number'?r.sr.toFixed(3):r.sr,pointRatio:typeof r.pr==='number'?r.pr.toFixed(3):r.pr,status:r.q?'qualified':'out'}));
 const stats=new Map(members.map(n=>[n,{name:n,w:0,l:0,gp:0,sf:0,sa:0,pf:0,pa:0}]));
 for(const g of games){const a=stats.get(g.teamA),b=stats.get(g.teamB);if(!a||!b||!g.score)continue;const [h,v]=g.score.split('-').map(Number);a.gp++;b.gp++;a.sf+=h;a.sa+=v;b.sf+=v;b.sa+=h;if(h>v){a.w++;b.l++;}else if(v>h){b.w++;a.l++;}for(const s of g.sets){const [x,y]=s.split(/[:-]/).map(Number);a.pf+=x;a.pa+=y;b.pf+=y;b.pa+=x;}}
 const direct=(a,b)=>{const g=games.find(g=>[g.teamA,g.teamB].includes(a.name)&&[g.teamA,g.teamB].includes(b.name));if(!g?.score)return 0;const [h,v]=g.score.split('-').map(Number);return h===v?0:(h>v?g.teamA:g.teamB)===a.name?-1:1;};
 return [...stats.values()].sort((a,b)=>b.w-a.w||(ratio(b.pf,b.pa)-ratio(a.pf,a.pa))||(ratio(b.sf,b.sa)-ratio(a.sf,a.sa))||direct(a,b)||a.name.localeCompare(b.name,'ko')).map((r,i)=>({rank:i+1,team:{code:teamCode(r.name)},played:r.gp,wins:r.w,losses:r.l,points:null,setRatio:ratioText(ratio(r.sf,r.sa)),pointRatio:ratioText(ratio(r.pf,r.pa)),status:i<2?'qualified':'out'}));
}
function configFor(prefix,key,label,item,groups,stages){
 const slug=`${prefix}-${key}`,gender=key.endsWith('women')?'women':'men';
 return {schemaVersion:2,slug,competition:{competitionId:`KVL-COMP-SCHOOL-${prefix.toUpperCase()}-${key.toUpperCase()}`,displayName:`2026 ${item.name} ${label}`,officialName:`2026 ${item.name} · ${label}`,season:'2026',gender,competitionFamily:'domestic'},structure:{presentation:'domestic-home-v2',audience:'school',divisionKey:key,divisionLabel:label,labels:{groupsTab:'조별순위',groupsKpi:'예선 조',groupsKpiUnit:'개 조',knockoutKpi:'결선 진출',knockoutKpiUnit:'팀',standingsTitle:`${label} 조별순위`,knockoutTitle:`${label} 결선 토너먼트`,participantsTitle:'참가학교',participantsKpi:'참가학교',participantsKpiUnit:'팀'},calendar:true,schedule:{stages:['전체',...stages]},standings:{mode:groups?'pools-combined':'none',overall:true,combined:true,title:`${label} 조별순위`,overallTitle:`${label} 예선 종합순위`},knockout:{mode:'bracket-8',qfLabel:'본선',sfLabel:'준결승',finalLabel:'결승',byeLabel:'준결승 직행'},participants:{mode:groups?'groups':'flat',linkMode:'team-results',groupLabel:`${label} 참가학교`},roster:{mode:'none',domesticTeamRoute:'none'}},hero,seo:{title:`2026 ${item.name} ${label} | K-Volley Lab`,description:`2026 ${item.name} ${label} 경기 일정과 결과, 조별순위, 결선 대진표, 참가학교를 확인합니다.`},data:'data.json'};
}
const links=prefix=>divisions.map(([key,label])=>({key,label,gender:key.endsWith('women')?'women':'men',url:`competition-engine.html?competition=${prefix}-${key}`}));
const write=(p,d)=>{fs.mkdirSync(path.dirname(path.join(root,p)),{recursive:true});fs.writeFileSync(path.join(root,p),JSON.stringify(d,null,2)+'\n');};
function build(){const summary=[];
 for(const [name,id,page] of definitions){
  const old=legacy(name),item=catalog.competitions.find(c=>c.competitionId===id),prefix=`school-${name}-2026`;
  for(const [key,label,division] of divisions){
   const games=old.G.filter(g=>g.division===division).map(g=>({...g,teamA:canonical(g.teamA),teamB:canonical(g.teamB)}));
   const sourceGroups=old.groups?.[division]||deriveGroups(old.groupGamesSource.filter(g=>g.division===division).map(g=>({...g,teamA:canonical(g.teamA),teamB:canonical(g.teamB)}))),groups=Object.fromEntries(Object.entries(sourceGroups).map(([id,names])=>[id,[...new Set(names.map(canonical))]]));
   const teams=[...new Set([...(old.teams?.[division]||[]).map(canonical),...games.flatMap(g=>[g.teamA,g.teamB]),...Object.values(groups).flat()])].sort((a,b)=>a.localeCompare(b,'ko'));
   const groupOf=n=>Object.keys(groups).find(k=>groups[k].includes(n));
   const prelim=games.filter(g=>['예선','사전경기'].includes(g.stage));
   const matches=games.map(g=>{
    const parts=g.score?.split('-').map(Number),sets=g.sets.map(s=>{const [home,away]=s.split(/[:-]/).map(Number);return {home,away};});
    const conflict=parts&&sets.length&&(sets.filter(s=>s.home>s.away).length!==parts[0]||sets.filter(s=>s.away>s.home).length!==parts[1]);
    return {id:g.id,date:g.date,time:g.start||'',stage:g.stage,pool:['예선','사전경기'].includes(g.stage)&&groupOf(g.teamA)===groupOf(g.teamB)?groupOf(g.teamA)||'':'',home:{code:teamCode(g.teamA)},away:{code:teamCode(g.teamB)},venueLabel:g.venue,score:parts?{home:parts[0],away:parts[1],sets:conflict?[]:sets}:null,...(conflict?{reportedSets:sets,scoreNote:'원문 최종 스코어와 세트별 점수가 일치하지 않아 확인 중입니다. 기존 최종 스코어를 기준으로 표시합니다.'}:{}),...(['8강','7강','6강','준결승','결승'].includes(g.stage)?{round:g.stage==='결승'?'FINAL':g.stage==='준결승'?'SF':'QF',bracketLabel:g.stage}:{})};
   });
   const win=m=>!m.score||m.score.home===m.score.away?null:m.score.home>m.score.away?m.home.code:m.away.code;
   for(const m of matches.filter(m=>m.round==='QF'||m.round==='SF')){const next=matches.find(n=>n.round===(m.round==='QF'?'SF':'FINAL')&&[n.home.code,n.away.code].includes(win(m)));if(next)m.nextMatchId=next.id;}
   const ranks=(old.podium?.[division]||[]).flatMap((names,i)=>names.split(' · ').map(n=>({rank:i+1,code:teamCode(n),team:canonical(n),result:i===0?'우승':i===1?'준우승':'공동 3위',confirmed:true})));
   const resources=sourceResources[name];
   const conflicts=matches.filter(m=>m.scoreNote),note=(name==='presidents'?'기존 공식 조 편성 기준':name==='ibk'?'기존 검수 조별순위 기준':'기존 예선·사전경기 연결관계로 구성한 조입니다. 공식 조 표기와 다를 수 있습니다.')+' · 순위: 승수 → 점수 득실비 → 세트 득실비 → 승자승. 승점은 별도 산정하지 않습니다.';
   const config=configFor(prefix,key,label,item,Object.keys(groups).length,[...new Set(games.map(g=>g.stage))]);
   const qf=matches.filter(m=>m.round==='QF');config.structure.knockout.mode=qf.length?'bracket-8':'bracket-4';config.structure.knockout.qfLabel=[...new Set(qf.map(m=>m.stage))].join(' · ')||'본선';
   const data={status:'completed',stageLabel:'대회 종료',dateLabel:`${item.startDate} ~ ${item.endDate}`,locationLabel:item.location,venueLabel:[...new Set(games.map(g=>g.venue))].join(' · '),teamCount:teams.length,groupCount:Object.keys(groups).length,matchCount:matches.length,knockoutTeamCount:new Set(matches.filter(m=>m.round).flatMap(m=>[m.home.code,m.away.code])).size,champion:ranks[0]?.team||'',championAchievement:'우승',divisionLinks:links(prefix),participants:teams.map(n=>({code:teamCode(n),name:n,fullName:n,group:groupOf(n)||'조 미확인'})),matches,standings:{pools:Object.entries(groups).map(([id,names])=>({id,title:id+'조',matchCount:prelim.filter(g=>names.includes(g.teamA)&&names.includes(g.teamB)).length,rows:groupRows(names,prelim.filter(g=>names.includes(g.teamA)&&names.includes(g.teamB)),old.groupRows?.[division]?.[id])})),combinedRows:[]},standingsNote:(name==='presidents'?'공식 조 편성 기준':name==='ibk'?'검수 조별순위 기준':'예선 대진으로 구성한 조')+(conflicts.length?' · 일부 원문 점수 확인 중':''),standingsRule:'승수 → 점수 득실비 → 세트 득실비 → 승자승 · 승점 미산정',scheduleNote:'기존 공식 경기스코어 기록 · 사전경기 포함 · 한국시간(KST)'+(conflicts.length?` · ${conflicts.length}경기의 원문 세트 점수 확인 중`:''),finalRanking:ranks,qualifications:[],resources,domesticRules:{standings:{title:'조별순위 기준',body:note},knockout:{title:'결선 진출 경로',body:'기존 경기 결과의 승리 팀과 다음 경기 참가 팀을 연결합니다. 준결승 직행 팀은 별도 표시합니다.'}},sourceSnapshot:{baseCommit:'a986092fd8f4dd0f8ba8c36b7779785f45cd23cf',legacyPage:page,legacyScript:`assets/js/school-competition-${name}-2026.js`,generatedBy:'scripts/migrate-school-competitions-v2.cjs'}};
   write(`data/competitions/${config.slug}/config.json`,config);write(`data/competitions/${config.slug}/data.json`,data);summary.push({slug:config.slug,matches:matches.length,teams:teams.length,pools:Object.keys(groups).length,conflicts:conflicts.length});
  }
 }
 // Catalog summaries come from the same detail records, including existing podiums.
 for(const item of catalog.competitions){
  if(!item.enginePrefix)continue;
  const payloads=divisions.map(([key])=>json(`data/competitions/${item.enginePrefix}-${key}/data.json`));
  item.gameCount=payloads.reduce((n,d)=>n+d.matches.length,0);
  item.divisionResults=Object.fromEntries(divisions.map(([key],i)=>[key,payloads[i].finalRanking.map(r=>({rank:r.rank,team:r.team}))]));
  if(item.enginePrefix==='cbs-2026')item.recordStatus='partial';
 }
 write('data/competitions/school-index-2026.json',catalog);
 return summary;
}
if(require.main===module)console.log(JSON.stringify(build(),null,2));
module.exports={build,legacy,divisions,definitions,deriveGroups,hero,links};
