(()=>{
  const root=document.getElementById('competitionCalendar');
  if(!root)return;

  function placeSearch(){
    const toolbar=root.querySelector('.cc-toolbar');
    const searchRow=root.querySelector('.cc-search-row');
    const filters=root.querySelector('.cc-filters');
    if(!toolbar||!searchRow)return;

    searchRow.classList.add('cc-search-inline');
    searchRow.querySelector('.cc-search-label')?.remove();
    searchRow.querySelector('.cc-search-help')?.remove();

    if(searchRow.parentElement!==toolbar){
      if(filters&&filters.parentElement===toolbar)toolbar.insertBefore(searchRow,filters);
      else toolbar.appendChild(searchRow);
    }
  }

  const observer=new MutationObserver(placeSearch);
  observer.observe(root,{childList:true,subtree:true});
  placeSearch();
  setTimeout(placeSearch,0);
  setTimeout(placeSearch,150);
  setTimeout(placeSearch,500);
})();
