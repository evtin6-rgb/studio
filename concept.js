(function(){
var T=window.CONCEPT_I18N||{},lang='en';
try{lang=localStorage.getItem('evtin-lang')||'en'}catch(e){}
var btn=document.querySelector('[data-lang]');
function apply(l){
if(!T[l])l='en';
document.documentElement.lang=l;
document.querySelectorAll('[data-i18n]').forEach(function(e){var v=T[l][e.dataset.i18n];if(v!==undefined)e.innerHTML=v});
if(T[l]['meta.title'])document.title=T[l]['meta.title'];
if(btn){var to=l==='en'?'ru':'en';btn.textContent=to.toUpperCase();btn.lang=to;btn.setAttribute('aria-label',to==='ru'?'RU — Русская версия':'EN — English version')}
try{localStorage.setItem('evtin-lang',l)}catch(e){}
}
apply(lang);
if(btn)btn.addEventListener('click',function(){apply(document.documentElement.lang==='en'?'ru':'en')});
})();
