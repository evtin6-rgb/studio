(function(){
  var T=window.CONCEPT_I18N,html=document.documentElement,L=function(k){return (T[html.lang]||T.en)[k]};
  // Variant B: the clock, open status and timeline all follow the visitor's own local time.
  var OPEN=730,CLOSE=1900;
  function hhmm(d){return d.getHours()*100+d.getMinutes()}
  function pad(n){return String(n).padStart(2,'0')}
  function refresh(){
    var d=new Date(),now=hhmm(d),open=now>=OPEN&&now<CLOSE,el=document.getElementById('open');
    document.getElementById('clockH').textContent=pad(d.getHours());
    document.getElementById('clockM').textContent=pad(d.getMinutes());
    document.getElementById('clock').setAttribute('aria-label',pad(d.getHours())+':'+pad(d.getMinutes()));
    el.classList.toggle('closed',!open);
    document.getElementById('openText').textContent=L(open?'r.open':'r.closed');
    document.querySelectorAll('#timeline li').forEach(function(li){var on=now>=+li.dataset.from&&now<+li.dataset.to;li.classList.toggle('now',on);if(on)li.setAttribute('aria-current','time');else li.removeAttribute('aria-current')});
    var r=new Date();r.setDate(r.getDate()-(r.getDay()+6)%7);
    document.getElementById('roastDate').textContent=r.toLocaleDateString(html.lang==='ru'?'ru-RU':'en-GB',{day:'numeric',month:'long'});
  }
  // Tick on the minute boundary so the clock never lags behind the system clock.
  function tick(){refresh();setTimeout(tick,60000-Date.now()%60000+50)}
  tick();
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
