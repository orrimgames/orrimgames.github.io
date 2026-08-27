// early-game feel audit: fresh boot -> story -> quest 1 via 5 REAL land taps (projPt-located, real touchscreen),
// metGob via REAL goblin tap (tut cheated to 3), WORLD via REAL rail tap (tut cheated to 4) -> 'GOBLINVILLE RISES'.
// probe cheats (labeled): S.tut jumps for legs 2/3 only - quest 1 is played straight. 390x844 dpr2 touch.
const puppeteer=require('puppeteer-core');
const FILE=process.env.FILE||'index-v114.html';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',protocolTimeout:600000,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage();
 await p.setViewport({width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error'&&!/404/.test(m.text()))errs.push('console:'+m.text());});
 await p.goto('http://localhost:8945/'+FILE+'?new=1',{waitUntil:'load',timeout:120000});
 let t0=Date.now(); while(Date.now()-t0<120000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 const r={vp:'390x844'};
 // through the story with real taps
 await p.touchscreen.tap(195,422); await sleep(400);
 for(let i=0;i<4;i++){ await p.touchscreen.tap(195,422); await sleep(400); }
 r.started=await p.evaluate(()=>({started:S.started, tut:S.tut, tapCombo:S.tapCombo}));
 await p.evaluate(()=>{ window.TOASTS=[]; const t2=toast2; window.toast2=function(m){ TOASTS.push(m); return t2(m); };
  window.BANNERS=[]; const b2=banner2; window.banner2=function(t,s){ BANNERS.push(t); return b2(t,s); }; });
 // quest ring visible at tut 0 - frame for the report
 await sleep(600); await p.screenshot({path:'feel-ring.png'});
 // QUEST 1: five real resource taps, located through the game's own projPt (same math the quest ring uses)
 r.taps=[];
 for(let n=0;n<5;n++){
  let ok=false;
  for(let att=0;att<4&&!ok;att++){
   const pt=await p.evaluate(()=>{ const t=findTile(c=>c.deco==='tree'||c.deco==='shroom'||c.deco==='rock'||c.t===3, Math.round(CAM.tx), Math.round(CAM.ty));
    if(!t) return null; const pp=projPt(t[0]+0.5, groundH(t[0]+0.5,t[1]+0.5)+0.35, t[1]+0.5);
    return pp?{x:pp[0],y:pp[1],deco:(tiles[t[1]][t[0]].deco||'rockface')}:null; });
   if(!pt){ await sleep(300); continue; }
   const c0=await p.evaluate(()=>S.tapCombo);
   await p.touchscreen.tap(Math.round(pt.x),Math.round(pt.y)); await sleep(450);
   const c1=await p.evaluate(()=>S.tapCombo);
   r.taps.push({deco:pt.deco, before:c0, after:c1, hit:c1===c0+1});
   ok=(c1===c0+1);
  }
 }
 await sleep(700);
 r.afterQ1=await p.evaluate(()=>({tut:S.tut, tapCombo:S.tapCombo, toasts:TOASTS.slice()}));
 // METGOB leg (tut cheated to 3): real tap on a projected goblin
 await p.evaluate(()=>{ S.tut=3; TOASTS.length=0; });
 r.gob=null;
 for(let att=0;att<6&&!r.gob;att++){
  const gp=await p.evaluate(()=>{ let best=null,bd=1e9;
   for(const g of S.gobs){ const pp=projPt(g.x, g.z+0.45*g.size, g.y); if(!pp) continue;
    if(pp[0]>20&&pp[0]<370&&pp[1]>120&&pp[1]<700){ const d=Math.hypot(pp[0]-195,pp[1]-422); if(d<bd){bd=d;best={x:pp[0],y:pp[1],name:g.name};} } }
   return best; });
  if(!gp){ await sleep(300); continue; }
  await p.touchscreen.tap(Math.round(gp.x),Math.round(gp.y)); await sleep(450);
  const m=await p.evaluate(()=>({met:S.metGob, tut:S.tut, inspect:!!S.inspect}));
  if(m.met){ r.gob={name:gp.name, ...m}; }
 }
 // WORLD leg (tut cheated to 4): real rail tap
 await p.evaluate(()=>{ S.tut=4; });
 const wb=await p.evaluate(()=>warBtnR());
 await p.touchscreen.tap(wb.x+wb.w/2, wb.y+wb.h/2); await sleep(600);
 r.world=await p.evaluate(()=>({mode:S.mode, sawMap:S.sawMap, tut:S.tut}));
 await p.screenshot({path:'feel-risen.png'});
 r.finish=await p.evaluate(()=>({banners:BANNERS, toasts:TOASTS, saveExists:!!saveExists, chronLast:S.chronicle.length?S.chronicle[S.chronicle.length-1].t||S.chronicle[S.chronicle.length-1]:null}));
 r.errs=errs;
 console.log(JSON.stringify(r));
 await b.close();
})().catch(e=>{ console.error('FATAL',e.message); process.exit(1); });
