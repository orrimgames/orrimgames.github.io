// ogre organic-bonding audit: real map taps LEAVE AN OFFERING x3 dawns (10f+5g, one/day) -> THE MOUNTAIN REMEMBERS -> persistence -> rescue clause (2 troops vs bonechoir -> DRUMS, foe towers smashed, rout -> win) -> one-shot verification. 390x844.
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
 r.setup=await p.evaluate(()=>{ S.story=null; S.started=true; S.introZoom=0; S.tut=QUESTS.length; S.elderHush=1; S.mode='village';
  S.day=2; S.dayT=0.4; S.res.food=60; S.res.gold=40;
  window.BANNERS=[]; const b2=banner2; window.banner2=function(t,s){ BANNERS.push(t); return b2(t,s); };
  return {day:S.day, food:S.res.food, gold:S.res.gold}; });
 // world map -> Ogre Steps node
 r.tapMap=await p.evaluate(()=>{ deskTap(warBtnR()); return {mode:S.mode}; });
 r.tapNode=await p.evaluate(()=>{ const R=REGIONS.find(x=>x.id==='ogre'); const pt=mpt(R); handleTap3(pt[0],pt[1]);
  return {sel:mapSel, locked:R.locked}; });
 await sleep(300);
 await p.screenshot({path:'ogre-m.png'});
 const offer=()=>p.evaluate(()=>{ const f0=S.ogre.fed, fd0=S.res.food, g0=S.res.gold;
  handleTap3(sendR().x+sendR().w/2, sendR().y+sendR().h/2);
  return {fed:S.ogre.fed, fedDelta:S.ogre.fed-f0, food:S.res.food, gold:S.res.gold, foodSpent:fd0-S.res.food, goldSpent:g0-S.res.gold}; });
 r.offer1=await offer();
 r.offerSameDay=await offer();   // must deny: one bowl per day
 // dawn-stepper (chunked, school.js pattern)
 await p.evaluate(()=>{ window.OG_step=function(n,target){ const dt=0.05; let i=0;
   while(S.day===target&&i<n){ tickClock(dt); updateWorld(dt); i++; }
   return {day:S.day, fed:S.ogre.fed, bound:S.ogre.bound, pending:S.ogre.pending}; }; });
 const dawn=async()=>{ let d0=await p.evaluate(()=>S.day), st={day:d0}, guard=0;
  while(st.day===d0&&guard<40){ st=await p.evaluate(t=>OG_step(4000,t),d0); guard++; } return st; };
 r.dawn1=await dawn();             // processes bowl 1 (pending -> chron)
 r.offerDay3=await offer();
 // resource gate: starve, expect deny
 r.gate=await p.evaluate(()=>{ S.res.food=5; S.res.gold=2; return {food:5,gold:2}; });
 r.offerPoor=await offer();
 await p.evaluate(()=>{ S.res.food=60; S.res.gold=40; });
 r.dawn2=await dawn();
 r.offerDay4=await offer();
 r.dawn3=await dawn();             // processes bowl 3 -> bound
 r.bound=await p.evaluate(()=>({fed:S.ogre.fed, bound:S.ogre.bound, day:S.day, banners:BANNERS}));
 // persistence
 await p.evaluate(()=>saveGame());
 await p.goto('http://localhost:8945/'+FILE,{waitUntil:'load',timeout:120000});
 t0=Date.now(); while(Date.now()-t0<120000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 r.afterReload=await p.evaluate(()=>{ window.BANNERS=[]; const b2=banner2; window.banner2=function(t,s){ BANNERS.push(t); return b2(t,s); };
  return {ogre:S.ogre, mode:S.mode}; });
 // rescue clause: 2 troops vs bonechoir (tier 4) -> ogre intervenes at first tick
 r.rescue=await p.evaluate(()=>{ S.war.troops=2; const rv=RIVALS.find(x=>x.id==='bonechoir');
  startBattle(rv);
  return {mode:S.mode, deployed:S.war.deployed, foeTowers:S.buildings.filter(b=>b.key==='tower').length, us:S.gobs.filter(g=>g.side==='us').length, foes:S.gobs.filter(g=>g.side==='foe').length}; });
 await p.evaluate(()=>{ window.OG_bat=function(n){ const dt=0.05; let i=0;
  while(!S.war.result&&i<n){ updateWorld(dt); i++; }
  return {i, result:S.war.result&&S.war.result.win, used:S.ogre.used,
   foeTowers:S.buildings.filter(b=>b.key==='tower').length, routed:S.gobs.filter(g=>g.side==='foe'&&g.rout).length,
   foesAlive:S.gobs.filter(g=>g.side==='foe'&&g.hp>0).length, usAlive:S.gobs.filter(g=>g.side==='us'&&g.hp>0).length,
   hall:!!S.buildings.some(b=>b.key==='hall')}; }; });
 let bt={i:0}, chunks=0;
 while(!bt.result&&chunks<8){ bt=await p.evaluate(()=>OG_bat(4000)); chunks++; if(bt.result!==undefined&&bt.result!==null) break; }
 r.rescueSim=bt; r.rescueSim.chunks=chunks;
 r.rescueBanner=await p.evaluate(()=>BANNERS.filter(t=>/DRUMS|MOUNTAIN/.test(t)));
 r.rescueAfter=await p.evaluate(()=>{ const w=S.war.result&&S.war.result.win; leaveBattle(); return {win:w, used:S.ogre.used, banners:S.war.banners}; });
 // one-shot: rescue must NOT fire twice
 r.second=await p.evaluate(()=>{ S.war.troops=2; startBattle(RIVALS.find(x=>x.id==='bonechoir'));
  const st=OG_bat(4000); const w=S.war.result&&S.war.result.win;
  if(S.war.result) leaveBattle();
  return {after4000:st, result:w, drumsTwice:BANNERS.filter(t=>/DRUMS/.test(t)).length}; });
 r.errs=errs;
 console.log(JSON.stringify(r));
 await b.close();
})().catch(e=>{ try{ console.log('PARTIAL',JSON.stringify(r)); }catch(_){ } console.log('ERR',e.message); process.exit(1); });
