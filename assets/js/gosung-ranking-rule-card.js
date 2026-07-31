(()=>{
  const install=()=>{
    if(document.body?.dataset.competition!=='gosung-2026')return;
    const section=document.getElementById('group-standings');
    if(!section||section.querySelector('.kvl-ranking-rule-card'))return;
    const card=document.createElement('div');
    card.className='cd-rule-card kvl-ranking-rule-card';
    card.innerHTML='<strong>순위 결정 방법</strong>승리 경기 수로 순위를 결정한다. 승리 경기 수가 같으면 득실점수비율(예선 총 득점 ÷ 총 실점)을 기준으로 하며, 득실점수비율이 같으면 세트비율(예선 총 승리세트 ÷ 총 패배세트) 순으로 정한다. 세트비율까지 같으면 동률인 팀 간의 승자승으로 순위를 정한다.<br><a href="university-competition.html?view=sources">대회요강 원문 확인 →</a>';
    section.appendChild(card);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
