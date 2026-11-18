'use strict';
/* Local-only prototype source model. Never writes KVL master, live roster or source files. */
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const read=file=>JSON.parse(fs.readFileSync(path.join(ROOT,file),'utf8'));
const EVENTS=[
 {id:'VNL',label:'2026 VNL',type:'registered',major:true,source:'data/competitions/vnl-men-2026/data.json'},
 {id:'AG',label:'2026 아시안게임',type:'registered',major:true,source:'data/competitions/asian-games-men-2026/rosters.json'},
 {id:'AVC',label:'2026 AVC 남자 대륙선수권',type:'final',major:false,source:'data/competitions/avc-men-continental-2026-rosters.json'}
];
const SCOPE={code:'JPN',name:'일본',name_en:'Japan',gender:'men',year:2026};
const keyNorm=s=>String(s||'').normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
const verifiedVolleybox=url=>{
 if(!/^https:\/\/volleybox\.net\/(?:ko\/)?[a-z0-9-]+-p\d+(?:[?#].*)?$/i.test(url||''))return '';
 const match=url.match(/-p(\d+)(?:$|[?#])/i);
 return match?match[1]:'';
};
const canonicalVolleybox=url=>verifiedVolleybox(url)?String(url).replace('volleybox.net/ko/','volleybox.net/'):'';
const cleanClub=name=>name&&name!=='미확인'&&name!=='Unknown'&&name!=='-'?name:'';
const pos=p=>{const x=String(p||'').toUpperCase();return x==='O'||x==='OPP'?'OP':x};
function build(){
 const vnl=read(EVENTS[0].source).rosters.JPN.players;
 const asian=read(EVENTS[1].source).JPN.players;
 const avcFile=read(EVENTS[2].source);
 const avc=avcFile.teams.find(t=>t.code==='JPN').players;
 const clubFile=read('data/competitions/avc-men-continental-2026-clubs-2026-27.json');
 const master=read('data/master/player_master_international_v1.json');
 const rosterIndex=read('data/international/country-roster-index-v1.json');
 const cup=read('data/competition/avc-men-cup-2026-men-rosters.json');
 if(cup.teams.some(t=>t.country==='Japan'))throw Error('Japan AVC Cup participation unexpected — review source');
 const refs=['vnl-men-2026:JPN','asian-games-men-2026:JPN','avc-men-continental-2026:JPN'];
 const arrays={VNL:vnl,AG:asian,AVC:avc};
 for(const [i,event] of EVENTS.entries()){
  const snap=rosterIndex.snapshots.find(t=>t.snapshot_id===refs[i]);
  if(!snap||snap.player_count!==arrays[event.id].length||snap.country_code!=='JPN'||snap.year!==2026||snap.gender!=='men')
   throw Error('Unexpected source roster '+event.id);
 }
 const group=new Map();
 for(const event of EVENTS)for(const original of arrays[event.id]){
  const en=String(original.en||original.name||'').trim(),dob=String(original.dob||'');
  const playerId=original.playerId||'';
  const vurl=String(original.volleybox||'');
  const vbId=verifiedVolleybox(vurl);
  if(!en||!/^\d{4}-\d{2}-\d{2}$/.test(dob))throw Error('Missing full verified name/date: '+en);
  const key=vbId?'vb:'+vbId+':'+dob:'name:'+keyNorm(en)+':'+dob;
  const p=group.get(key)||{
    key,en,name:'',dob,position:'',height:0,jerseys:{},heights:{},positions:{},entries:{},sources:[],
    club:'',clubSource:'',clubProof:'',clubAlt:[],volleybox:'',volleyboxSearch:'',officialProfile:'',KVLProfile:'',
    matchBasis:vbId?'exact Volleybox profile + DOB':'exact English name + DOB'
  };
  if(p.entries[event.id])throw Error('Duplicate player in '+event.id+': '+en);
  if(p.en!==en&&p.dob===dob&&vbId){
   // Different official spellings share the exact Volleybox player page and DOB.
   p.matchBasis='exact Volleybox profile + DOB / official name variation';
  }
  p.sources.push(event.id);
  p.entries[event.id]=String(original.entryStatus||event.type);
  p.jerseys[event.id]=original.number;
  p.heights[event.id]=Number(original.heightCm||original.height||0)||null;
  p.positions[event.id]=pos(original.position);
  if(event.id==='AVC'){p.name=original.nameKo||original.name||p.name;p.position=pos(original.position);p.height=p.heights.AVC||p.height;}
  else if(event.id==='AG'&&!p.entries.AVC){p.name=original.name||p.name;p.position=pos(original.position);p.height=p.heights.AG||p.height;}
  else if(!p.name){p.name=original.name||p.name;p.position=pos(original.position);p.height=p.heights.VNL||p.height;}
  if(vbId)p.volleybox=canonicalVolleybox(vurl);
  else if(vurl.startsWith('https://volleybox.net/')&&vurl.includes('/search?'))p.volleyboxSearch=vurl;
  if(original.vnlProfile&&/^https:\/\/en\.volleyballworld\.com\//.test(original.vnlProfile))p.officialProfile=original.vnlProfile;
  if(event.id==='AG'&&original.club?.confirmed===true&&cleanClub(original.club.name)){
   p.club=original.club.name;p.clubSource='2026 아시안게임 명단';p.clubProof='KVL 대회 스냅샷';
  }
  if(event.id==='AVC'){
   const staff=clubFile?.teams?.JPN?.[String(original.number)];
   if(staff?.status==='CONFIRMED'&&cleanClub(staff.club)&&/^https:\/\//.test(staff.source||'')){
    if(p.club&&keyNorm(p.club)!==keyNorm(staff.club))p.clubAlt.push({club:p.club,source:p.clubSource});
    p.club=staff.club;p.clubSource='2026–27 AVC 검수본 ('+staff.checkedAt+')';p.clubProof=staff.source;
   }
  }
  group.set(key,p);
 }
 const records=[...group.values()];
 for(const p of records){
  if(p.sources.length!==new Set(p.sources).size)throw Error('Duplicate occurrence '+p.en);
  // Strict identity link only: exact English spelling, birthdate, nationality and gender.
  const verified=master.filter(m=>keyNorm(m.identity?.name_en)===keyNorm(p.en)&&m.identity?.birth_date===p.dob
   &&keyNorm(m.identity?.nationality)==='japan'&&m.identity?.gender==='M');
  if(verified.length===1){
   const id=verified[0].system?.player_id;
   if(/^KVL-P-\d{6}$/.test(id)&&!/^KVL-P-0016(?:2\d|3\d|4[0-5])$/.test(id))p.KVLProfile='https://kvolleylab.com/player.html?id='+id;
  }
  const distinctPos=new Set(Object.values(p.positions).filter(Boolean));
  if(distinctPos.size>1)throw Error('Position conflicts require identity review: '+p.en);
  const nums=[...new Set(Object.values(p.jerseys).map(String))];
  p.jersey=nums.length===1?'#'+nums[0]:'대회별';
  p.eventCount=p.sources.length;
  p.evidence='동일 국가·성별 / '+p.matchBasis;
 }
 records.sort((a,b)=>b.eventCount-a.eventCount||a.en.localeCompare(b.en,'en'));
 const counts=EVENTS.map(e=>arrays[e.id].length);
 if(counts.join()!=='16,12,14'||records.length!==26)throw Error('Source identities diverged: '+counts+'/'+records.length+'; review before showing');
 const model={version:'v1',status:'PROTOTYPE_ONLY_NOT_DEPLOYED',year:2026,scope:SCOPE,
  events:EVENTS,sourceSnapshot:{VNL:16,AG:12,AVC:14},total:records.length,
  sourceComment:'2026 KVL 공개 대회 명단과 AVC 2026-27 출처 검증 소속팀 스냅샷. 변경 시 재검수 필요.',
  notes:[
   '같은 생년월일과 영문 이름 또는 동일 Volleybox 선수 페이지가 일치하는 경우에만 통합했습니다.',
   '서로 다른 선수의 동일 등번호는 통합 근거가 아닙니다. 등번호·신장·소속은 대회별로 상이할 수 있습니다.',
   '소속팀은 2026-27 AVC 검증 자료 또는 2026 아시안게임 당시 확인 값이며 실시간 소속을 뜻하지 않습니다.',
   '일본의 AVC 남자컵 참가 명단은 확인되지 않았으므로 이력에 포함하지 않았습니다.',
   '빨간 점: VNL·아시안게임 / 검은 점: 대륙선수권. 점은 검수된 해당 대회 명단에 포함됨을 의미하며 실제 코트 출전과는 다릅니다.'
  ],
  rows:records};
 return model;
}
function renderStandalone(model){
 const target=path.join(ROOT,'prototypes/kvl-international-unified-roster-v1.html');
 const t=fs.readFileSync(target,'utf8');
 if((t.match(/__KVL_DATA_JSON__/g)||[]).length!==1)throw Error('Prototype HTML data placeholder contract changed');
 const safe=JSON.stringify(model).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
 return t.replace('__KVL_DATA_JSON__',safe);
}
function run(){
 const m=build();
 const output=process.argv.find(x=>x.startsWith('--output='))?.slice('--output='.length);
 if(output){fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,renderStandalone(m),'utf8');}
 else process.stdout.write(JSON.stringify({countries:1,year:m.year,players:m.total,events:m.sourceSnapshot,linked:m.rows.filter(x=>x.KVLProfile).length,club:m.rows.filter(x=>x.club).length,volleybox:m.rows.filter(x=>x.volleybox).length})+'\n');
}
if(require.main===module)run();
module.exports={build,renderStandalone,verifiedVolleybox,pos};
