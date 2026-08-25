// v112 raid-stall banner: frozen fight (no hp change) -> 'THE RAID IS GOING NOWHERE' once per lull; normal fights never see it
const puppeteer=require('puppeteer-core');
const MOB=process.argv[2]!=='d', FILE=process.env.FILE||'index-v112.html';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage();
 await p.setViewport(MOB?{width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true}:{width:1920,height:1080,deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push('console:'+m.text());});
 await p.goto('http://localhost:8945/'+FILE+'?new=1',{waitUntil:'load',timeout:120000});
 let t0=Date.now(); while(Date.now()-t0<120000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 const r={vp:MOB?'390x844':'1920x1080'};
 // normal fight: banner must NOT fire
 r.normal=await p.evaluate(()=>{ S.story=null; S.started=true; S.introZoom=0; S.elderHush=1; S.mode='village'; S.war.troops=5;
  startBattle(RIVALS[0]);
  let told=0; const dt=0.05;
  for(let i=0;i<2400;i++){ updateBattle(dt); if(S.banner&&S.banner.t==='THE RAID IS GOING NOWHERE') told++; if(S.war.result) break; }
  const res=S.war.result; if(res) leaveBattle(); else endBattle(false); S.mode='village';
  return {resolved:!!res, bannerFires:told}; });
 // frozen fight: banner fires once, re-arms only after hp changes
 r.frozen=await p.evaluate(()=>{ S.war.troops=5; startBattle(RIVALS[0]);
  for(const g of S.gobs) g.atk=0;
  for(const b of S.buildings) if(b.key==='tower') b.cool=1e9;
  let fires=0, lastTold=-1; const dt=0.05;
  for(let i=0;i<1400;i++){ updateBattle(dt);   // 70 sim-seconds
    if(S.war._stallTold&&S.war._stallTold!==lastTold){ lastTold=S.war._stallTold; fires++; } }
  return {fires, banner:S.banner&&S.banner.t, sub:S.banner&&S.banner.s, stallT:Math.round(S.war.stallT)}; });
 await p.evaluate(()=>banner2('THE RAID IS GOING NOWHERE','RETREAT brings the brood home'));
 await sleep(900);
 await p.screenshot({path:'stallbanner-'+(MOB?'m':'d')+'.png'});
 // hp change re-arms the tracker
 r.rearm=await p.evaluate(()=>{ const g0=S.gobs.find(g=>g.side==='us'&&g.hp>0)||S.gobs[0];
  g0.hp-=5; const dt=0.05; updateBattle(dt);
  return {hpSumReset:S.war.stallT<1, toldCleared:S.war._stallTold===0}; });
 r.errs=errs;
 console.log(JSON.stringify(r));
 await b.close();
})().catch(e=>{console.log('ERR',e.message);process.exit(1);});
