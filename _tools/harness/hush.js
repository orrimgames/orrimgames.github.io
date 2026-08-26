// elder-hush audit: mid-tutorial X tap hushes the elder (tut=max, elderHush=1, persists reload, no rewind); without hush, a boot with tut=max but quests unmet rewinds to the first unmet quest ('the elder returns'). 390x844, real taps.
const puppeteer=require('puppeteer-core');
const FILE=process.env.FILE||'index-v113.html';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',protocolTimeout:600000,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage();
 await p.setViewport({width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error'&&!/404/.test(m.text()))errs.push('console:'+m.text());});
 const boot=async(u)=>{ await p.goto(u,{waitUntil:'load',timeout:120000});
  let t0=Date.now(); while(Date.now()-t0<120000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); } };
 const r={vp:'390x844'};
 // leg 1: mid-tutorial hush via real tap on the quest X
 await boot('http://localhost:8945/'+FILE+'?new=1');
 r.setup=await p.evaluate(()=>{ S.story=null; S.started=true; S.introZoom=0; S.tut=2; S.mode='village'; S.dayT=0.4;
  return {tut:S.tut, elderHush:S.elderHush}; });
 const qx=await p.evaluate(()=>questXR());
 r.questXRect=qx;
 await p.screenshot({path:'hush-m.png'});
 await p.touchscreen.tap(qx.x+qx.w/2, qx.y+qx.h/2); await sleep(400);
 r.hush=await p.evaluate(()=>({tut:S.tut, tutMax:QUESTS.length, elderHush:S.elderHush, toast:S.toast&&S.toast.t}));
 // post-hush: tapping where the X was must do nothing (tutorial UI gone)
 await p.touchscreen.tap(qx.x+qx.w/2, qx.y+qx.h/2); await sleep(300);
 r.postHush=await p.evaluate(()=>({tut:S.tut, elderHush:S.elderHush}));
 // persistence: reload, welcome-back tap, tut must stay max (no rewind when hushed)
 await p.evaluate(()=>saveGame());
 await boot('http://localhost:8945/'+FILE);
 await p.touchscreen.tap(195,422); await sleep(400);
 r.afterReload=await p.evaluate(()=>({tut:S.tut, elderHush:S.elderHush, banner:S.banner&&S.banner.t}));
 // leg 2: NO hush - tut=max but quests unmet -> elder returns rewind on boot tap
 await boot('http://localhost:8945/'+FILE+'?new=1');
 await p.evaluate(()=>{ S.story=null; S.started=true; S.introZoom=0; S.tut=QUESTS.length; S.elderHush=0; S.tapCombo=0; saveGame(); });
 await boot('http://localhost:8945/'+FILE);
 r.preRewind=await p.evaluate(()=>({tut:S.tut, elderHush:S.elderHush, started:S.started}));
 await p.touchscreen.tap(195,422); await sleep(400);
 r.rewind=await p.evaluate(()=>({tut:S.tut, elderHush:S.elderHush, started:S.started, toast:S.toast&&S.toast.t}));
 r.errs=errs;
 console.log(JSON.stringify(r));
 await b.close();
})().catch(e=>{ try{ console.log('PARTIAL',JSON.stringify(r)); }catch(_){ } console.log('ERR',e.message); process.exit(1); });
