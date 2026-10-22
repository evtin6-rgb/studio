// Copies EN strings from script.js into the static HTML of index.html (data-i18n) and meta description.
// Usage: node tools/i18n-sync.js (from the repo root) after editing translations.
const fs=require('fs'),vm=require('vm');let s=fs.readFileSync('script.js','utf8');const c={};vm.runInNewContext(s.slice(0,s.indexOf('const status')).replace('const translations','this.translations'),c);const T=c.translations.en;
let h=fs.readFileSync('index.html','utf8');let n=0;
h=h.replace(/<([a-z0-9]+)([^>]*?)\sdata-i18n="([^"]+)"([^>]*)>([\s\S]*?)<\/\1>/g,(m,tag,a,k,b,inner)=>{const v=T[k];if(v===undefined||v===inner)return m;n++;return `<${tag}${a} data-i18n="${k}"${b}>${v}</${tag}>`});
h=h.replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="${T['meta.desc']}">`);
fs.writeFileSync('index.html',h);console.log('synced',n)
