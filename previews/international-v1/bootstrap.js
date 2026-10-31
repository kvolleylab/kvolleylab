/* Preview-only composition. Production config/data and shared files remain byte-identical. */
(()=>{'use strict';
const params=new URLSearchParams(location.search);
if(!params.has('competition')){params.set('competition','vnl-men-2026');history.replaceState(null,'',location.pathname+'?'+params+location.hash);}
window.KVLCompetitionAdapterV2=async d=>{
 const slug=params.get('competition');
 if(slug!=='vnl-men-2026')throw Error('This review entrypoint only allows the selected competition');
 const res=await fetch('/previews/international-v1/vnl-men-2026.json');if(!res.ok)throw Error('Presentation config unavailable');
 const p=await res.json(),errors=window.KVLInternationalModel.validate(p,d);if(errors.length)throw Error(errors.join('; '));
 return {...d,structure:{...d.structure,presentation:p.presentation,international:p}};
};
// Only the preview and its six views are hosted here. Keep shared menu/profile destinations functional.
document.addEventListener('click',e=>{
 const a=e.target.closest('a[href]');if(!a)return;const u=new URL(a.getAttribute('href'),document.baseURI);
 if(u.origin!==location.origin||u.pathname.startsWith('/previews/')||u.pathname===location.pathname||u.pathname.startsWith('/docs/'))return;
 if(!/\.html$/.test(u.pathname)&&u.pathname!=='/')return;
 a.href='https://kvolleylab.com'+u.pathname+u.search+u.hash;
},true);
})();
