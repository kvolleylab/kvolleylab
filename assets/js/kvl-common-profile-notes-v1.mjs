import {supabase} from './kvl-supabase-browser-v1.mjs?v=20261124-auth-singleton-v1';

const el=(tag,txt,cls)=>{const node=document.createElement(tag);if(txt!=null)node.textContent=txt;if(cls)node.className=cls;return node};
const validId=id=>/^KVL-P-\d{6}$/.test(id)&&!!window.KVLPlayerIdCollisionV1&&!window.KVLPlayerIdCollisionV1.isConflict(id)&&!window.KVLCommonProfileBlockedIds?.has(id);
async function api(action,payload={}){
 const {data,error}=await supabase.functions.invoke('admin-player-workspace',{body:{action,...payload}});
 if(error||!data?.ok)throw new Error(data?.error||error?.message||'개인 메모 조회 실패');
 return data;
}
let activeAccount=null;
supabase.auth.onAuthStateChange((event,session)=>{
 const next=session?.user?.id||null;
 if(event==='SIGNED_OUT'||(activeAccount!==null&&next!==activeAccount)){
  document.querySelectorAll('[data-cpp-note-editor]').forEach(node=>node.remove());
 }
 activeAccount=next;
});
export function mountProfileNotes(host,playerId,{onChange}={}){
 if(!host||!validId(playerId)||host.querySelector('[data-cpp-note-editor]'))return;
 const root=el('details',null,'kvl-cpp-note-editor');root.dataset.cppNoteEditor='true';
 root.append(el('summary','내 메모 · 나만 보기'));
 const list=el('div',null,'kvl-cpp-note-list'),form=el('form',null,'kvl-cpp-note-form'),status=el('p','','kvl-cpp-note-status');
 status.setAttribute('role','status');root.append(list,form,status);
 function field(label,tag,max){const wrapper=el('label',label),input=el(tag);input.maxLength=max;input.required=true;wrapper.append(input);form.append(wrapper);return input}
 const season=field('시즌','input',20),title=field('메모 제목','input',120),body=field('관찰 메모','textarea',10000);body.rows=6;
 const footer=el('div',null,'kvl-cpp-note-buttons'),save=el('button','저장'),fresh=el('button','새 메모'),reload=el('button','다시 불러오기');
 save.type='submit';fresh.type=reload.type='button';footer.append(fresh,reload,save);form.append(footer);
 form.hidden=true;host.append(root);
 let owner=null,loaded=false,busy=false,editing=null,items=[],request=0;
 function reset(note=null){editing=note;season.value=note?.season||'2026-27';title.value=note?.title||'';body.value=note?.body||'';save.textContent=note?'수정 저장':'저장'}
 function lock(value){busy=value;for(const control of form.elements)control.disabled=value;list.querySelectorAll('button').forEach(b=>b.disabled=value)}
 async function authorized(){
  if(!root.isConnected||!validId(playerId))throw Error('선수 연결 미확인');
  const {data,error}=await supabase.auth.getSession();
  const current=data?.session?.user?.id;
  if(error||!current||(owner&&owner!==current)){root.remove();throw Error('로그인 상태가 변경되었습니다.')}
  owner=current;
 }
 function paint(){
  list.replaceChildren();
  if(!items.length)list.append(el('p','아직 작성한 메모가 없습니다.'));
  for(const note of items){
   const article=el('article',null,'kvl-cpp-note-item');
   article.append(el('strong',note.title||'제목 없음'),el('small',[note.season,note.updated_at?.slice(0,10)].filter(Boolean).join(' · ')),el('p',note.body||''));
   const edit=el('button','수정');edit.type='button';edit.addEventListener('click',()=>{if(busy)return;reset(note);title.focus()});article.append(edit);list.append(article);
  }
 }
 async function load({preserveDraft=false}={}){
  if(busy)return;
  const token=++request;lock(true);status.textContent='개인 메모 확인 중…';
  try{
   await authorized();const data=await api('list_notes');await authorized();
   if(token!==request||!root.isConnected)return;
   items=(data.items||[]).filter(n=>n.player_id===playerId);
   paint();loaded=true;form.hidden=false;if(!preserveDraft)reset();status.textContent='';
  }catch(err){if(root.isConnected)status.textContent='메모를 불러오지 못했습니다. 닫았다 다시 열거나 재조회하세요.'}
  finally{lock(false)}
 }
 root.addEventListener('toggle',()=>{if(root.open&&!loaded)load()});
 fresh.addEventListener('click',()=>{if(!busy)reset()});
 reload.addEventListener('click',()=>{if(!busy)load({preserveDraft:true})});
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy||!loaded||!form.reportValidity())return;
  const payload={id:editing?.id||null,expected_revision:editing?Number(editing.revision):null,player_id:playerId,season:season.value.trim(),title:title.value.trim(),body:body.value.trim()};
  if(!payload.season||!payload.title||!payload.body){status.textContent='시즌, 제목, 내용을 입력해 주세요.';return}
  lock(true);status.textContent='저장 중…';
  try{
   await authorized();await api('save_note',payload);await authorized();
   if(!root.isConnected)return;
   reset();loaded=false;form.hidden=true;lock(false);await load();if(root.isConnected&&loaded)status.textContent='저장되었습니다.';
   try{await onChange?.()}catch{}
  }catch(err){if(root.isConnected)status.textContent='저장 실패. 다른 화면에서 수정했다면 다시 불러온 뒤 해당 메모를 선택하세요. 입력 내용은 유지됩니다.'}
  finally{lock(false)}
 });
}
