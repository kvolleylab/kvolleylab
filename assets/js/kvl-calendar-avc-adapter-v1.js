/* Data-only bridge for the existing AVC production snapshots. No page migration. */
(()=>{
'use strict';
function mount(root,source,teams){
 if(!window.KVLMatchCalendarV1)return false;
 const participants=Object.entries(teams).map(([name,t])=>({name,code:t.code,flag:t.flag?`https://flagcdn.com/w80/${t.flag}.png`:''}));
 const matches=(source.matches||[]).map(m=>({id:m.id,date:m.date,time:m.time,stage:m.stage,pool:m.group,
  home:{name:m.teamA,code:teams[m.teamA]?.code||m.teamA},away:{name:m.teamB,code:teams[m.teamB]?.code||m.teamB},
  status:Number.isFinite(m.setsA)&&Number.isFinite(m.setsB)?'final':'scheduled',
  score:Number.isFinite(m.setsA)&&Number.isFinite(m.setsB)?{home:m.setsA,away:m.setsB,sets:(m.sets||[]).map(s=>({home:s[0],away:s[1]}))}:null,
  venueLabel:m.venue||source.venueKo||source.venue||'',localTimeLabel:m.localTime?'현지 '+m.localTime:''}));
 const data={participants,matches,status:source.status,dateLabel:source.startDate+' ~ '+source.endDate};
 return window.KVLMatchCalendarV1.mount(root,data,{scheduleUrl:date=>{const url=new URL(location.href);url.searchParams.set('view','schedule');url.searchParams.set('date',date);return url.href;}});
}
window.KVLCalendarAVCAdapterV1={mount};
})();
