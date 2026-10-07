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
document.querySelectorAll('[data-eur]').forEach(function(e){
var ru=l==='ru',v=+(ru?e.dataset.rub:e.dataset.eur);
e.textContent=new Intl.NumberFormat(ru?'ru-RU':'en-GB',{style:'currency',currency:ru?'RUB':'EUR',minimumFractionDigits:v%1?2:0,maximumFractionDigits:2}).format(v);
});
}
apply(lang);
if(btn)btn.addEventListener('click',function(){apply(document.documentElement.lang==='en'?'ru':'en')});
})();
