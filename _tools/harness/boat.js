// v64 sailing audit: real-tap FP walk button -> shore (probe cheat: teleport to coast) -> real-tap SAIL -> run before the wind -> real-tap COME ASHORE -> boat persists reload -> re-board. 390x844 mobile.
const puppeteer=require('puppeteer-core');
const MOB=process.argv[2]!=='d', FILE=process.env.FILE||'index-v113.html';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',protocolTimeout:600000,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage();
 await p.setViewport(MOB?{width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true}:{width:1920,height:1080,deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error'&&!/404/.test(m.text()))errs.push('console:'+m.text());});
 await p.goto('http://localhost:8945/'+FILE+'?new=1',{waitUntil:'load',timeout:120000});
 let t0=Date.now(); while(Date.now()-t0<120000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 const r={vp:MOB?'390x844':'1920x1080'};
 await p.evaluate(()=>{ S.story=null; S.started=true; S.introZoom=0; S.tut=QUESTS.length; S.elderHush=1; S.mode='village'; S.dayT=0.4; S.res.wood=200; });
 await sleep(400);
 // 1. real-tap the WALK button -> first person
 const wr=await p.evaluate(()=>walkBtnR());
 await p.touchscreen.tap(wr.x+wr.w/2, wr.y+wr.h/2); await sleep(900);
 r.fpEnter=await p.evaluate(()=>({on:FP.on, mode:CAM.mode}));
 if(!r.fpEnter.on){ r.SKIP='walk button did not enter FP'; r.errs=errs; console.log(JSON.stringify(r)); await b.close(); process.exit(0); }
 // 2. probe cheat: teleport the chief to a walkable shore point next to water
 r.shore=await p.evaluate(()=>{
   for(let y=2;y<MAP-2;y++) for(let x=2;x<MAP-2;x++){
     if(!fpWalkable(x,y)) continue;
     if(sailFindWater(x,y)){ FP.x=x; FP.y=y; fpSyncCam(); return {x,y,water:sailFindWater(x,y),boardable:sailBoardable(x,y)}; } }
   return null; });
 if(!r.shore||!r.shore.boardable){ r.SKIP='no boardable shore found'; r.errs=errs; console.log(JSON.stringify(r)); await b.close(); process.exit(0); }
 await sleep(300);
 // 3. real-tap SAIL
 const sr=await p.evaluate(()=>sailBtnR());
 await p.touchscreen.tap(sr.x+sr.w/2, sr.y+sr.h/2); await sleep(600);
 r.sailStart=await p.evaluate(()=>({sail:!!S.sail, x:S.sail&&+S.sail.x.toFixed(1), y:S.sail&&+S.sail.y.toFixed(1)}));
 if(!r.sailStart.sail){ r.SKIP='sail tap did not start'; r.errs=errs; console.log(JSON.stringify(r)); await b.close(); process.exit(0); }
 // 4. probe cheat: hold the stick forward; RAF drives fpUpdate in real time
 await p.evaluate(()=>{ FP.mv={x:195,y:300,x0:195,y0:430}; });
 const pre=await p.evaluate(()=>({x:S.sail.x,y:S.sail.y}));
 await sleep(3500);
 r.sailMove=await p.evaluate(()=>({x:+S.sail.x.toFixed(1),y:+S.sail.y.toFixed(1),spd:+S.sail.spd.toFixed(2)}));
 r.sailMove.moved=Math.hypot(r.sailMove.x-pre.x,r.sailMove.y-pre.y)>2;
 await p.screenshot({path:'boat-m.png'});
 // 5. steer back toward land, then real-tap COME ASHORE
 r.ashore=await p.evaluate(()=>{
   for(let i=0;i<40;i++){ const land=sailFindLand(FP.x,FP.y,14); if(land){ FP.x=land[0]; FP.y=land[1]; return {found:true,i}; }
     S.sail.x+=(SITE.x-S.sail.x)*0.2; S.sail.y+=(SITE.y-S.sail.y)*0.2; FP.x=S.sail.x; FP.y=S.sail.y; }
   return {found:false}; });
 await sleep(300);
 await p.touchscreen.tap(sr.x+sr.w/2, sr.y+sr.h/2); await sleep(600);
 r.sailStop=await p.evaluate(()=>({sail:!!S.sail, boat:S.boat&&{x:+S.boat.x.toFixed(1),y:+S.boat.y.toFixed(1)}, fpOn:FP.on}));
 // 6. exit FP, save, reload, verify boat persists
 await p.evaluate(()=>{ if(FP.on) fpExit(); saveGame(); });
 await sleep(400);
 await p.goto('http://localhost:8945/'+FILE,{waitUntil:'load',timeout:120000});
 t0=Date.now(); while(Date.now()-t0<120000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 r.afterReload=await p.evaluate(()=>({boat:S.boat&&{x:+S.boat.x.toFixed(1),y:+S.boat.y.toFixed(1)}, sail:!!S.sail}));
 // 7. re-board the parked boat: enter FP (real tap), cheat-teleport to boat, real-tap SAIL
 if(r.afterReload.boat){
   const wr2=await p.evaluate(()=>walkBtnR());
   await p.touchscreen.tap(wr2.x+wr2.w/2, wr2.y+wr2.h/2); await sleep(900);
   r.reboardEnter=await p.evaluate(()=>({fpOn:FP.on, mode:S.mode, camMode:CAM.mode, started:S.started, tut:S.tut}));
   if(!r.reboardEnter.fpOn){ await p.touchscreen.tap(wr2.x+wr2.w/2, wr2.y+wr2.h/2); await sleep(900);
     r.reboardEnter.retry=await p.evaluate(()=>({fpOn:FP.on, camMode:CAM.mode})); }
   r.reboard=await p.evaluate(()=>{
     const bx=S.boat.x, by=S.boat.y;
     const land=sailFindLand(bx,by,14); if(land){ FP.x=land[0]; FP.y=land[1]; } else { FP.x=bx; FP.y=by; }
     fpSyncCam();
     return {fpOn:FP.on, fp:[+FP.x.toFixed(1),+FP.y.toFixed(1)], boardable:sailBoardable(FP.x,FP.y)}; });
   await sleep(300);
   const sr2=await p.evaluate(()=>sailBtnR());
   await p.touchscreen.tap(sr2.x+sr2.w/2, sr2.y+sr2.h/2); await sleep(600);
   r.reboard.sailAgain=await p.evaluate(()=>!!S.sail);
   if(!r.reboard.sailAgain){ await sleep(1200); r.reboard.sailAgainLate=await p.evaluate(()=>({sail:!!S.sail, fpOn:FP.on, mode:S.mode})); }
 }
 r.errs=errs;
 console.log(JSON.stringify(r));
 await b.close();
})().catch(e=>{console.log('ERR',e.message);process.exit(1);});
