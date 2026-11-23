import {validateData} from './national-history-model-v1.mjs';
import {compactEventView} from './national-history-detail-model-v1.mjs?v=20261123-detail-completion-v1';

const timeline=document.getElementById('timeline');
const node=(tag,className,text)=>{const el=document.createElement(tag);if(className)el.className=className;if(text)el.textContent=text;return el;};
async function json(url){const r=await fetch(url,{cache:'no-cache'});if(!r.ok)throw Error('detail_data');return r.json();}
function improveEvent(container,event,db,summaries){
  if(container.dataset.detailView)return;
  const original=[...container.children].find(el=>el.classList.contains('event-detail'));if(!original)return;
  const view=compactEventView(event,db,summaries),body=node('div','event-detail-v2');
  if(view.date||view.location){
    const metadata=node('p','compact-date');
    if(view.date)metadata.append(node('span','compact-period',view.date));
    if(view.date&&view.location)metadata.append(document.createTextNode(' '));
    if(view.location)metadata.append(node('span','compact-location',view.location));
    body.append(metadata);
  }
  if(view.notice)body.append(node('p','compact-notice',view.notice));
  if(view.rows.length){
    const rows=node('dl','compact-facts');
    for(const row of view.rows){
      const line=node('div','compact-fact'),value=node('dd');line.append(node('dt','',row.label));
      if(row.match){
        const [won,lost]=row.match.score.split(/[–-]/).map(Number);
        value.className='compact-match';value.append(node('span','','대한민국'),node('strong',won<lost?'compact-score is-loss':'compact-score',row.match.score),node('span','',row.match.opponent));
      }else value.textContent=row.text;
      line.append(value);rows.append(line);
    }
    body.append(rows);
  }
  const actions=node('div','compact-actions'+(view.recordHref?' has-record':''));
  if(view.recordHref){const link=node('a','compact-record-link','대회 기록 보기 →');link.href=view.recordHref;actions.append(link);}
  const more=node('details','compact-more'),toggle=node('summary','','세부 기록·출처');
  toggle.setAttribute('aria-label',`${event.nameKo} 세부 기록·출처`);
  more.append(toggle);actions.append(more);body.append(actions);
  // Move the complete original detail into the disclosure: no evidence or notes are deleted.
  original.replaceWith(body);more.append(original);
  const sourceList=original.querySelector('.detail-sources');
  for(const source of view.locationSources){
    if(!sourceList||[...sourceList.querySelectorAll('a')].some(a=>a.href===source.url))continue;
    const link=node('a','',`${source.title} ↗`);link.href=source.url;link.target='_blank';link.rel='noopener noreferrer';sourceList.append(link);
  }
  if(view.relatedEventIds.length){
    const related=node('div','compact-related');
    for(const id of view.relatedEventIds){const relatedEvent=db.events.find(e=>e.id===id),link=node('a','',`관련 기록 · ${relatedEvent.nameKo} →`);const url=new URL(location.href);url.searchParams.set('event',id);url.searchParams.set('filter','all');url.hash='';link.href=url.pathname+url.search;related.append(link);}
    original.append(related);
  }
  container.dataset.detailView='compact-v1';
}
async function init(){
  if(!timeline)return;
  try{
    const [db,summaries]=await Promise.all([json('data/national/men-senior-history-v1.json'),json('data/national/men-senior-history-summaries-v1.json').catch(()=>null)]);
    if(validateData(db).length)return;
    const records=new Map(db.events.map(e=>[e.id,e]));
    const update=()=>{for(const row of timeline.querySelectorAll('[data-event]')){const event=records.get(row.dataset.event);if(event)improveEvent(row,event,db,summaries);}timeline.dataset.detailView='compact-v1';};
    // The existing renderer replaces timeline children for filters; observe only that level.
    new MutationObserver(update).observe(timeline,{childList:true});update();
    // Preserve original event deep links after their expanded content becomes shorter.
    const requested=new URLSearchParams(location.search).get('event');
    if(requested){const selected=document.getElementById(requested);if(selected?.open)requestAnimationFrame(()=>selected.scrollIntoView({block:'center'}));}
  }catch{/* The existing full detail remains readable if enhancement data cannot load. */}
}
init();
