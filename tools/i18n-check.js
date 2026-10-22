const fs=require('fs'),vm=require('vm');
function load(f,expr){const s=fs.readFileSync(f,'utf8');return s}
function homeDict(){let s=fs.readFileSync('script.js','utf8');const i=s.indexOf('const status');const c={};vm.runInNewContext(s.slice(0,i).replace('const translations','this.translations'),c);return c.translations}
// i18n consistency: missing RU/EN keys, static EN text drift, duplicate ids, unused keys.
// Usage: node tools/i18n-check.js (from the repo root)
const pages=[['index.html',homeDict()]];
for(const n of ['0642','atelier07','noir']){const c={window:{}};vm.runInNewContext(fs.readFileSync(`concept-${n}.i18n.js`,'utf8'),c);pages.push([`concept-${n}.html`,c.window.CONCEPT_I18N])}
for(const [f,T] of pages){
 const h=fs.readFileSync(f,'utf8');
 const ids={};[...h.matchAll(/\sid="([^"]+)"/g)].forEach(m=>ids[m[1]]=(ids[m[1]]||0)+1);
 for(const k in ids)if(ids[k]>1)console.log(f,'DUP id',k);
 for(const attr of ['data-i18n','data-i18n-aria','data-i18n-alt']){
  const re=new RegExp(`<([a-z0-9]+)[^>]*\\s${attr}="([^"]+)"[^>]*>`,'g');
  for(const m of h.matchAll(re)){for(const l of ['en','ru'])if(T[l][m[2]]===undefined)console.log(f,'MISSING',l,attr,m[2])}
 }
 // static drift
 const re=/<([a-z0-9]+)([^>]*?)\sdata-i18n="([^"]+)"([^>]*)>([\s\S]*?)<\/\1>/g;
 for(const m of h.matchAll(re)){const en=T.en[m[3]];if(en===undefined)continue;const inner=m[5];if(inner.trim()!==en.trim())console.log(f,'DRIFT',m[3],JSON.stringify(inner.slice(0,90)),'|',JSON.stringify(en.slice(0,90)));
  if(/data-i18n|id=/.test(inner))console.log(f,'NESTED',m[3],inner.slice(0,100))}
 // unused dict keys
 const used=new Set([...h.matchAll(/data-i18n(?:-aria|-alt)?="([^"]+)"/g)].map(m=>m[1]));
 for(const k in T.en)if(!used.has(k)&&!k.startsWith('meta'))console.log(f,'UNUSED en key',k);
 for(const k in T.en)if(T.ru[k]===undefined)console.log(f,'RU missing dict',k);
 for(const k in T.ru)if(T.en[k]===undefined)console.log(f,'EN missing dict',k);
}
