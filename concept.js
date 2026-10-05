(function(){
var T=window.CONCEPT_I18N||{},lang='en';
try{lang=localStorage.getItem('evtin-lang')||'en'}catch(e){}
var btn=document.querySelector('[data-lang]');
function apply(l){
if(!T[l])l='en';
document.documentElement.lang=l;
document.querySelectorAll('[data-i18n]').forEach(function(e){var v=T[l][e.dataset.i18n];if(v!==undefined)e.innerHTML=v});
if(T[l]['meta.title'])document.title=T[l]['meta.title'];
if(btn)btn.textContent=l==='en'?'RU':'EN';
try{localStorage.setItem('evtin-lang',l)}catch(e){}
}
apply(lang);
if(btn)btn.addEventListener('click',function(){apply(document.documentElement.lang==='en'?'ru':'en')});
})();
