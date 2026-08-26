// FP battle audit: real-tap FIGHT -> chief in the mud. Swing melee + knockback + kill count, rally once, DRAGONFIRE 25 faith once, chief takes hits, downed -> 'dragged you home' -> battle continues, sim to result. 390x844. Chief positioning via teleport = labeled probe cheat.
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
 r.setup=await p.evaluate(()=>{ S.story=null; S.started=true; S.introZoom=0; S.tut=QUESTS.length; S.elderHush=1; S.mode='village';
  S.day=2; S.dayT=0.4; S.res.food=100; S.res.gold=40; S.faith=60; S.war.troops=6;
  startBattle(RIVALS.find(x=>x.id==='ratkin'));
  window.BAT=function(n){ const dt=0.05; let i=0; while(!S.war.result&&i<n){ updateBattle(dt); i++; } return i; };
  return {mode:S.mode, troops:S.war.deployed, faith:S.faith}; });
 // real-tap FIGHT -> enter FP battle
 const fr=await p.evaluate(()=>fightR());
 await p.touchscreen.tap(fr.x+fr.w/2, fr.y+fr.h/2); await sleep(600);
 r.fpEnter=await p.evaluate(()=>({on:FP.on, battle:FP.battle, hp:FP.hp, mode:CAM.mode}));
 if(!r.fpEnter.battle){ r.SKIP='FIGHT tap did not enter FP battle'; r.errs=errs; console.log(JSON.stringify(r)); await b.close(); process.exit(0); }
 await p.screenshot({path:'fpbat-m.png'});
 // probe cheat: put the chief nose-to-nose with the nearest foe, facing it
 r.melee=await p.evaluate(()=>{ const f=S.gobs.filter(g=>g.side==='foe'&&g.hp>0).sort((a,b)=>Math.hypot(a.x-FP.x,a.y-FP.y)-Math.hypot(b.x-FP.x,b.y-FP.y))[0];
  if(!f) return null;
  FP.x=f.x-1.4*Math.sin(Math.atan2(f.x-FP.x,f.y-FP.y)); FP.y=f.y-1.4*Math.cos(Math.atan2(f.x-FP.x,f.y-FP.y));
  FP.a=Math.atan2(f.x-FP.x,f.y-FP.y); fpSyncCam();
  return {foeHp:f.hp, dist:+Math.hypot(f.x-FP.x,f.y-FP.y).toFixed(2)}; });
 // real-tap right side to swing until the foe dies (max 8 swings)
 r.swings=[];
 for(let i=0;i<8;i++){ await p.touchscreen.tap(320,420); await sleep(450);
  const s=await p.evaluate(()=>({kills:FP.kills, swing:FP.swing>0}));
  r.swings.push(s); if(s.kills>0) break; }
 // rally pill (once) then denied
 const rr=await p.evaluate(()=>rallyR());
 await p.touchscreen.tap(rr.x+rr.w/2, rr.y+rr.h/2); await sleep(300);
 r.rally=await p.evaluate(()=>({rally:S.war.rally, used:S.war.rallyUsed}));
 await p.touchscreen.tap(rr.x+rr.w/2, rr.y+rr.h/2); await sleep(200);
 r.rally2=await p.evaluate(()=>({rally:S.war.rally, used:S.war.rallyUsed}));
 r.rallyOK=await p.evaluate(()=>S.war.rallyUsed===true);
 // DRAGONFIRE pill: 25 faith, once
 const fr2=await p.evaluate(()=>fireR());
 const f0=await p.evaluate(()=>S.faith);
 await p.touchscreen.tap(fr2.x+fr2.w/2, fr2.y+fr2.h/2); await sleep(400);
 r.fire=await p.evaluate(()=>({faith:S.faith, firedOnce:S.war.firedOnce}));
 await p.touchscreen.tap(fr2.x+fr2.w/2, fr2.y+fr2.h/2); await sleep(200);
 r.fire2=await p.evaluate(()=>({faith:S.faith, firedOnce:S.war.firedOnce}));
 r.fire.spent=f0-r.fire.faith;
 // chief takes hits -> downed (cheat: low hp + parked in the foe pack)
 r.downed=await p.evaluate(()=>{ FP.hp=5;
  const f=S.gobs.filter(g=>g.side==='foe'&&g.hp>0)[0];
  if(f){ FP.x=f.x-1; FP.y=f.y-1; fpSyncCam(); }
  return {hp:FP.hp, foesNear:S.gobs.filter(g=>g.side==='foe'&&g.hp>0).length}; });
 await p.evaluate(()=>BAT(200));   // 10 sim-s of combat
 await sleep(600);
 r.afterDowned=await p.evaluate(()=>({on:FP.on, mode:CAM.mode, hp:FP.hp, battle:S.mode, result:S.war.result&&S.war.result.win}));
 // finish the battle on the stepper, dismiss
 r.end=await p.evaluate(()=>{ BAT(6000); const w=S.war.result&&S.war.result.win; if(S.war.result) leaveBattle(); return {win:w, mode:S.mode}; });
 r.errs=errs;
 console.log(JSON.stringify(r));
 await b.close();
})().catch(e=>{ try{ console.log('PARTIAL',JSON.stringify(r)); }catch(_){ } console.log('ERR',e.message); process.exit(1); });
