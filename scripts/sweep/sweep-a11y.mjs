// What a screen reader and a keyboard find on every admin screen.
const BASE = "http://localhost:3000";
let id=0,ws,pending=new Map();
const list=await (await fetch("http://127.0.0.1:9222/json/list")).json();
ws=new WebSocket(list.find(t=>t.type==="page").webSocketDebuggerUrl);
await new Promise(r=>ws.addEventListener("open",r,{once:true}));
ws.addEventListener("message",e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id);}});
const send=(m,p={})=>{const n=++id;ws.send(JSON.stringify({id:n,method:m,params:p}));return new Promise(r=>pending.set(n,r));};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const ev=async e=>(await send("Runtime.evaluate",{expression:e,returnByValue:true})).result?.result?.value;
await send("Page.enable");await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride",{width:1512,height:950,deviceScaleFactor:1,mobile:false});

const ROUTES = ["/admin","/admin/analytics","/admin/products","/admin/drafts","/admin/categories","/admin/orders",
 "/admin/customers","/admin/enquiries","/admin/bin","/admin/pages","/admin/pages/drafts","/admin/theme","/admin/data",
 "/admin/menus","/admin/discounts","/admin/site-text","/admin/preferences","/admin/fonts","/admin/buttons",
 "/admin/redirects","/admin/metafields","/admin/settings","/admin/domains","/admin/account","/admin/products/new"];

const findings = { current: [], h1: [], alt: [], name: [], label: [] };
for (const path of ROUTES) {
  await send("Page.navigate",{url:BASE+path}); await wait(2600);
  const r = JSON.parse(await ev(`(()=>{
    // One per navigation, not one per page: the sidebar says which section,
    // the tab row says which screen, the pager says which page. Each is its
    // own set, and each may mark exactly one.
    const navs = [...document.querySelectorAll('nav, aside')];
    const current = Math.max(0, ...navs.map(nv => nv.querySelectorAll('[aria-current="page"]').length), 0);
    const h1 = document.querySelectorAll('h1').length;
    const imgs = [...document.querySelectorAll('img')].filter(i=>!i.hasAttribute('alt')).length;
    const unnamed = [...document.querySelectorAll('button,a[href]')].filter(b=>{
      if (b.getAttribute('aria-hidden') === 'true') return false;
      const t = (b.textContent||'').trim();
      if (t || b.getAttribute('aria-label') || b.getAttribute('title')) return false;
      // A link whose only child is a labelled graphic is named by that graphic.
      // An <img> with real alt text is exactly that — it was missing here, and
      // the theme gallery's preview links were reported unnamed for it.
      if ([...b.querySelectorAll('img[alt]')].some(i => i.getAttribute('alt').trim())) return false;
      return !b.querySelector('[aria-label],[role=img][aria-label],title');
    }).length;
    const unlabelled = [...document.querySelectorAll('input:not([type=hidden]),select,textarea')].filter(f=>{
      if (f.getAttribute('aria-label') || f.getAttribute('aria-labelledby') || f.getAttribute('title')) return false;
      if (f.id && document.querySelector('label[for="'+CSS.escape(f.id)+'"]')) return false;
      return !f.closest('label');
    }).length;
    return JSON.stringify({current,h1,imgs,unnamed,unlabelled});
  })()`));
  if (r.current !== 1) findings.current.push(`${path}:${r.current}`);
  if (r.h1 !== 1) findings.h1.push(`${path}:${r.h1}`);
  if (r.imgs > 0) findings.alt.push(`${path}:${r.imgs}`);
  if (r.unnamed > 0) findings.name.push(`${path}:${r.unnamed}`);
  if (r.unlabelled > 0) findings.label.push(`${path}:${r.unlabelled}`);
}

let n = 0, bad = 0;
const probe = (name, list) => { n++; if (list.length === 0) console.log(`  ok    ${name}`); else { bad++; console.log(`  FAIL  ${name} — ${list.join(", ")}`); } };
console.log(`WHAT A SCREEN READER FINDS (${ROUTES.length} screens)`);
probe("81 each navigation marks exactly one current item", findings.current);
probe("82 exactly one first-level heading per screen", findings.h1);
probe("83 every picture has alt text", findings.alt);
probe("84 every button and link has a name", findings.name);
probe("85 every field has a label", findings.label);
console.log(`\n${n - bad}/${n} passed`);
process.exit(0);
