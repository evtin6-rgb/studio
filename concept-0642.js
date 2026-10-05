(function(){
  var T=window.CONCEPT_I18N,html=document.documentElement,L=function(k){return (T[html.lang]||T.en)[k]};
  // The shop lives in St. Petersburg, so status and timeline follow its clock, not the visitor's.
  var spb=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Moscow',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  function hhmm(d){var p={};spb.formatToParts(d).forEach(function(x){p[x.type]=x.value});return (+p.hour)*100+(+p.minute)}
  function refresh(){
    var now=hhmm(new Date()),open=now>=642&&now<1500,el=document.getElementById('open');
    el.classList.toggle('closed',!open);
    document.getElementById('openText').textContent=L(open?'r.open':'r.closed');
    document.querySelectorAll('#timeline li').forEach(function(li){var on=now>=+li.dataset.from&&now<+li.dataset.to;li.classList.toggle('now',on);if(on)li.setAttribute('aria-current','time');else li.removeAttribute('aria-current')});
    var d=new Date();d.setDate(d.getDate()-2);
    document.getElementById('roastDate').textContent=d.toLocaleDateString(html.lang==='ru'?'ru-RU':'en-GB',{day:'numeric',month:'long'});
  }
  refresh();setInterval(refresh,60000);
  new MutationObserver(refresh).observe(html,{attributes:true,attributeFilter:['lang']});

  var g=document.getElementById('grams'),ratio=16,btns=document.querySelectorAll('[data-r]');
  function calc(){
    var grams=+g.value,water=grams*ratio,secs=Math.round(150+grams*1.7);
    document.getElementById('gOut').textContent=grams;
    document.getElementById('water').textContent=water;
    document.getElementById('time').textContent=Math.floor(secs/60)+':'+String(secs%60).padStart(2,'0');
  }
  g.addEventListener('input',calc);
  btns.forEach(function(b){b.addEventListener('click',function(){ratio=+b.dataset.r;btns.forEach(function(x){x.setAttribute('aria-pressed',x===b)});calc()})});
  calc();
})();
