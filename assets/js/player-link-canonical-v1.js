(()=>{
  const rewrite=root=>{
    const scope=root&&root.querySelectorAll?root:document;
    scope.querySelectorAll('a[href^="player-profile.html"]').forEach(a=>{
      const raw=a.getAttribute('href')||'';
      a.setAttribute('href',raw.replace(/^player-profile\.html/,'player.html'));
    });
  };
  rewrite(document);
  new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{
    if(node.nodeType!==1)return;
    if(node.matches?.('a[href^="player-profile.html"]')){
      const raw=node.getAttribute('href')||'';
      node.setAttribute('href',raw.replace(/^player-profile\.html/,'player.html'));
    }
    rewrite(node);
  }))).observe(document.documentElement,{childList:true,subtree:true});
})();
