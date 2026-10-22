// Responsive regression: every page × 320/375/768/1440 × EN/RU with the production CSP.
// Usage: python3 -m http.server 8765 &  then  node tools/qa.js
// Needs Playwright; set CHROME=/path/to/chrome if Playwright has no browser of its own.
const {chromium}=require('playwright');
const fs=require('fs');
const BASE=process.env.BASE||'http://localhost:8765/';
const csp=fs.readFileSync('netlify.toml','utf8').match(/Content-Security-Policy = "([^"]+)"/)[1].replace(' upgrade-insecure-requests','');
const PAGES=['index.html','concept-noir.html','concept-0642.html','concept-atelier07.html','404.html'];
(async()=>{
const b=await chromium.launch(process.env.CHROME?{executablePath:process.env.CHROME}:{});
let bad=0;
for(const page of PAGES)for(const w of [320,375,768,1440])for(const lang of ['en','ru']){
 const ctx=await b.newContext({viewport:{width:w,height:900}});
 await ctx.addInitScript(l=>{try{localStorage.setItem('evtin-lang',l)}catch(e){}},lang);
 await ctx.route(BASE+'**',async r=>{const res=await r.fetch();const h=res.headers();if((h['content-type']||'').includes('html'))h['content-security-policy']=csp;await r.fulfill({response:res,headers:h})});
 const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await p.goto(BASE+page,{waitUntil:'networkidle'});
 const ov=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
 if(ov>0||errs.length){bad++;console.log('FAIL',page,w,lang,'overflow',ov,errs.join(' | '))}
 await ctx.close()}
await b.close();console.log(bad?bad+' failures':'all clean');process.exit(bad?1:0)})();
