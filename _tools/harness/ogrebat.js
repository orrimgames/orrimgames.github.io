// ogre rescue battle leg (probe cheat: ogre pre-bound, labeled - bonding path verified separately in ogre.js). 2 troops vs bonechoir, REAL updateBattle stepper: rescue fires, foes rout+despawn, towers smashed, outcome; then one-shot check. 390x844.
const puppeteer=require('puppeteer-core');
const FILE=process.env.FILE||'index-v113.html';
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
  S.day=5; S.ogre={fed:3,lastDay:4,bound:true,used:false,pending:false}; S.war.troops=2;
  window.BANNERS=[]; const b2=banner2; window.banner2=function(t,s){ BANNERS.push(t); return b2(t,s); };
  window.BAT=function(n){ const dt=0.05; let i=0;
   while(!S.war.result&&i<n){ updateBattle(dt); i++; }
   return {i, simS:Math.round(i*dt), result:S.war.result&&S.war.result.win, used:S.ogre.used,
    foeTowers:S.buildings.filter(b=>b.key==='tower').length, routed:S.gobs.filter(g=>g.side==='foe'&&g.rout).length,
    foesAlive:S.gobs.filter(g=>g.side==='foe'&&g.hp>0).length, usAlive:S.gobs.filter(g=>g.side==='us'&&g.hp>0).length,
    hall:!!S.buildings.some(b=>b.key==='hall'), hallHp:(S.buildings.find(b=>b.key==='hall')||{}).hp}; };
  return {troops:S.war.troops, bound:S.ogre.bound}; });
 r.start=await p.evaluate(()=>{ startBattle(RIVALS.find(x=>x.id==='bonechoir'));
  return {deployed:S.war.deployed, us:S.gobs.filter(g=>g.side==='us').length, foes:S.gobs.filter(g=>g.side==='foe').length, foeTowers:S.buildings.filter(b=>b.key==='tower').length}; });
 r.track=[];
 let st={}, guard=0;
 do { st=await p.evaluate(()=>BAT(2000)); r.track.push({simS:st.simS,result:st.result,foes:st.foesAlive,routed:st.routed,us:st.usAlive,towers:st.foeTowers,hallHp:st.hallHp}); guard++; } while(st.result===null&&guard<20);
 r.final=st;
 r.drums=await p.evaluate(()=>BANNERS.filter(t=>/DRUMS/.test(t)).length);
 await p.evaluate(()=>{ if(S.war.result) leaveBattle(); });
 r.afterBattle1=await p.evaluate(()=>({win:!!st0_result, used:S.ogre.used, mode:S.mode, banners:S.war.banners.length})).catch(()=>({}));
 r.afterBattle1=await p.evaluate(()=>({used:S.ogre.used, mode:S.mode, warBanners:S.war.banners.length}));
 // one-shot: second battle, rescue must NOT refire - 2 troops, no help, they die
 r.second=await p.evaluate(()=>{ S.war.troops=2; startBattle(RIVALS.find(x=>x.id==='bonechoir'));
  const st=BAT(6000); const drums=BANNERS.filter(t=>/DRUMS/.test(t)).length;
  if(S.war.result) leaveBattle();
  return {sim:st, drumsTotal:drums}; });
 r.errs=errs;
 console.log(JSON.stringify(r));
 await b.close();
})().catch(e=>{ try{ console.log('PARTIAL',JSON.stringify(r)); }catch(_){ } console.log('ERR',e.message); process.exit(1); });
