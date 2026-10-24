import {loadMembers} from './member-client-v1.mjs';
const status=document.getElementById('authStatus');
try{
  const service=await loadMembers();
  history.replaceState(null,'','member-auth.html');
  if(!service)status.textContent='회원 서비스 연결을 준비하고 있습니다. 공개 선수 검색은 계속 이용할 수 있습니다.';
  else {const state=await service.refresh();status.textContent=state.user?'로그인했습니다. 선수 검색에서 관심선수와 개인 메모를 이용할 수 있습니다.':state.error||'로그인 링크를 확인하지 못했습니다. 다시 로그인해 주세요.'}
}catch{history.replaceState(null,'','member-auth.html');status.textContent='로그인을 완료하지 못했습니다. 만료된 링크라면 새 로그인 링크를 받아 주세요.'}
