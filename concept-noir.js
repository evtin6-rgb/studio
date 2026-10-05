(function(){
  var T=window.CONCEPT_I18N,L=function(k){return (T[document.documentElement.lang]||T.en)[k]};
  var filters=document.querySelectorAll('[data-filter]'),items=document.querySelectorAll('.n-item'),grid=document.getElementById('grid');
  filters.forEach(function(b){b.addEventListener('click',function(){
    filters.forEach(function(x){x.setAttribute('aria-pressed',x===b)});
    grid.classList.toggle('filtered',b.dataset.filter!=='all');
    items.forEach(function(it){it.hidden=b.dataset.filter!=='all'&&it.dataset.cat!==b.dataset.filter});
  })});
  var tick=document.querySelector('.n-ticker'),pause=document.getElementById('tickPause');
  pause.addEventListener('click',function(){var p=tick.classList.toggle('paused');pause.setAttribute('aria-pressed',p)});
  var count=0,bag=document.getElementById('bagCount'),status=document.getElementById('status'),timer;
  items.forEach(function(it){
    var add=it.querySelector('.n-add'),sizes=it.querySelectorAll('.n-sizes button'),h=it.querySelector('h3'),i=[].indexOf.call(items,it);
    h.id='n-item-'+i;it.querySelector('.n-sizes').setAttribute('aria-labelledby',h.id);add.setAttribute('aria-describedby',h.id);
    sizes.forEach(function(s){s.addEventListener('click',function(){
      sizes.forEach(function(x){x.setAttribute('aria-pressed',x===s)});
      add.disabled=false;add.dataset.i18n='n.add';add.textContent=L('n.add');
    })});
    add.addEventListener('click',function(){
      bag.textContent=++count;status.textContent=L('n.added');status.classList.add('show');
      clearTimeout(timer);timer=setTimeout(function(){status.classList.remove('show')},2400);
    });
  });
})();
