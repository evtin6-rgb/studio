(function(){
  var T=window.CONCEPT_I18N,html=document.documentElement,L=function(k){return (T[html.lang]||T.en)[k]};
  var rooms=document.querySelectorAll('.rm'),cur='living';
  function showRoom(){var r=L('room.'+cur);document.getElementById('roomName').textContent=r[0];document.getElementById('roomNote').textContent=r[1];rooms.forEach(function(x){var on=x.dataset.room===cur;x.classList.toggle('on',on);x.setAttribute('aria-pressed',on);x.setAttribute('aria-label',L('room.'+x.dataset.room)[0])})}
  rooms.forEach(function(r){
    r.addEventListener('click',function(){cur=r.dataset.room;showRoom()});
    r.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();cur=r.dataset.room;showRoom()}});
  });
  var mats=document.querySelectorAll('[data-m]'),mcur='trav';
  function showMat(){document.getElementById('mdesc').textContent=L('mat.'+mcur);mats.forEach(function(b){b.setAttribute('aria-pressed',b.dataset.m===mcur)})}
  mats.forEach(function(b){b.addEventListener('click',function(){mcur=b.dataset.m;showMat()})});
  function all(){showRoom();showMat()}
  all();new MutationObserver(all).observe(html,{attributes:true,attributeFilter:['lang']});
  if('IntersectionObserver' in window){
    var links=document.querySelectorAll('.a-index a');
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)links.forEach(function(a){var on=a.getAttribute('href')==='#'+e.target.id;a.classList.toggle('on',on);if(on)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')})})},{rootMargin:'-40% 0px -55% 0px'});
    document.querySelectorAll('.a-ch').forEach(function(s){io.observe(s)});
  }
})();
