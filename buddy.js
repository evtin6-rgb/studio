// Little doodle Ivan who wanders along the bottom of the screen. Decoration only.
(()=>{
if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
const svg='<svg viewBox="0 0 64 88" focusable="false"><g class="b-flip"><g class="b-bob">'+
'<path class="leg leg-a" d="M28 62l-3 20h-4"/><path class="leg leg-b" d="M37 62l2 20h5"/>'+
'<path class="arm arm-l" d="M22 44l-6 13"/><path class="arm arm-r" d="M43 44l6 13"/>'+
'<path class="jacket" d="M21 41c7-5 16-5 23 0l3 23H18z"/>'+
'<g class="keys"><rect x="8" y="55" width="48" height="9" rx="1.5"/><path d="M16 55v5M24 55v5M32 55v5M40 55v5M48 55v5"/></g>'+
'<g class="b-head"><circle class="face" cx="33" cy="27" r="12"/>'+
'<g class="curls"><circle cx="23" cy="19" r="5"/><circle cx="28" cy="14" r="5.5"/><circle cx="34" cy="12" r="5.5"/><circle cx="40" cy="15" r="5"/><circle cx="44" cy="21" r="4.2"/><circle cx="22" cy="25" r="3.6"/></g>'+
'<rect class="lens" x="27" y="24" width="8" height="6.5" rx="2.2"/><rect class="lens" x="37" y="24" width="8" height="6.5" rx="2.2"/><path class="frame" d="M35 26.5h2"/>'+
'<g class="eyes"><circle cx="32" cy="27.3" r="1.2"/><circle cx="42" cy="27.3" r="1.2"/></g>'+
'<path class="mouth" d="M35 34c2 1.6 4 1.6 6 0"/></g></g></g></svg>';
const el=document.createElement('div');
el.className='buddy';el.setAttribute('aria-hidden','true');el.innerHTML='<div class="b-jump">'+svg+'</div>';
document.body.appendChild(el);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const rand=(a,b)=>a+Math.random()*(b-a);
let x=-80,y=0,away=false;
const place=()=>{el.style.transform='translate('+x+'px,'+(-y)+'px)'};
const face=left=>el.classList.toggle('left',left);
const note=()=>{const n=document.createElement('span');n.className='b-note';n.textContent=Math.random()<.5?'♪':'♫';n.style.setProperty('--dx',rand(-18,18)+'px');el.appendChild(n);setTimeout(()=>n.remove(),1700)};
function walkTo(t){return new Promise(done=>{face(t<x);el.classList.add('walk');let last=performance.now();const speed=innerWidth<700?42:60;
const step=now=>{const d=Math.min(now-last,50)/1000;last=now;const left=t-x;const move=Math.sign(left)*Math.min(Math.abs(left),speed*d);x+=move;place();
if(Math.abs(t-x)<.5){el.classList.remove('walk');done()}else requestAnimationFrame(step)};requestAnimationFrame(step)})}
async function act(name,ms){el.classList.add(name);await wait(ms);el.classList.remove(name)}
async function play(){el.classList.add('play');for(let i=0;i<7;i++){note();await wait(450)}el.classList.remove('play')}
async function look(){face(!el.classList.contains('left'));await wait(900);face(!el.classList.contains('left'));await wait(700)}
const maxX=()=>innerWidth-el.offsetWidth-8;
async function life(){await wait(3800);
while(true){
if(away){await wait(800);continue}
const r=Math.random();
if(r<.5){let t=rand(8,maxX());if(Math.abs(t-x)<120)t=x<innerWidth/2?Math.min(x+rand(140,320),maxX()):Math.max(x-rand(140,320),8);await walkTo(t)}
else if(r<.72)await play();
else if(r<.84)await act('wave',1800);
else if(r<.94)await look();
else await act('blink2',1200);
await wait(rand(500,1600));
}}
el.addEventListener('click',()=>{if(el.classList.contains('jump'))return;el.classList.add('jump');note();setTimeout(note,120);setTimeout(note,240);setTimeout(()=>el.classList.remove('jump'),520)});
let lastWave=0;
window.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||el.classList.contains('walk')||el.classList.contains('play'))return;
const cx=x+el.offsetWidth/2,dy=innerHeight-e.clientY;if(Math.abs(e.clientX-cx)<140&&dy<200&&performance.now()-lastWave>4000){lastWave=performance.now();face(e.clientX<cx);act('wave',1400)}},{passive:true});
const contact=document.querySelector('#contact');
if(contact)new IntersectionObserver(es=>{away=es[0].isIntersecting;el.classList.toggle('away',away)},{threshold:.15}).observe(contact);
// The page is his ground: scrolling carries him up, then he drops back to the bottom edge.
let lastY=scrollY,still=0,falling=false;
const GRAVITY=2600,TOP_GAP=90;
function fall(){if(falling||y<=0)return;falling=true;el.classList.add('fall');let v=0,last=performance.now();
const step=now=>{const d=Math.min(now-last,40)/1000;last=now;v+=GRAVITY*d;y=Math.max(0,y-v*d);place();
if(y>0)requestAnimationFrame(step);else{falling=false;el.classList.remove('fall','ride');el.classList.add('land');setTimeout(()=>el.classList.remove('land'),260)}};requestAnimationFrame(step)}
addEventListener('scroll',()=>{const dy=scrollY-lastY;lastY=scrollY;if(falling)return;
y=Math.min(Math.max(y+dy,0),innerHeight-el.offsetHeight-TOP_GAP);place();el.classList.toggle('ride',y>0);
clearTimeout(still);still=setTimeout(fall,260)},{passive:true});
addEventListener('resize',()=>{if(x>maxX()){x=maxX();place()}},{passive:true});
place();life();
})();
