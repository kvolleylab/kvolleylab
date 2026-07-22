(()=>{
  const root=document.getElementById('competitionCalendar');
  if(!root)return;

  function placeSearch(){
    const toolbar=root.querySelector('.cc-toolbar');
    const searchRow=root.querySelector('.cc-search-row');
    const filters=root.querySelector('.cc-filters');
    if(!toolbar||!searchRow||searchRow.classList.contains('cc-search-inline'))return;

    searchRow.classList.add('cc-search-inline');
    searchRow.querySelector('.cc-search-label')?.remove();
    searchRow.querySelector('.cc-search-help')?.remove();
    if(filters)toolbar.insertBefore(searchRow,filters);
    else toolbar.appendChild(searchRow);
  }

  const observer=new MutationObserver(placeSearch);
  observer.observe(root,{childList:true,subtree:true});
  placeSearch();
})();
