// vanto re-sign audit: sign -> 1 delivery -> hungry dawn lapse -> RE-SIGN pill (label + real tap) -> trades NOT reset -> deliveries 2,3 -> Warming Main. Persistence. 390x844, real map taps, dawn stepper (village updateWorld).
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
  S.day=3; S.dayT=0.4; S.res.food=100; S.res.gold=0;
  window.BANNERS=[]; const b2=banner2; window.banner2=function(t,s){ BANNERS.push(t); return b2(t,s); };
  window.V_step=function(n,target){ const dt=0.05; let i=0;
   while(S.day===target&&i<n){ tickClock(dt); updateWorld(dt); i++; }
   return {day:S.day, signed:S.vanto.signed, lapsed:S.vanto.lapsed, trades:S.vanto.trades, main:S.vanto.main, food:Math.round(S.res.food), gold:Math.round(S.res.gold)}; };
  return {day:S.day}; });
 r.tapMap=await p.evaluate(()=>{ deskTap(warBtnR()); return {mode:S.mode}; });
 r.tapNode=await p.evaluate(()=>{ const R=REGIONS.find(x=>x.id==='vanto'); const pt=mpt(R); handleTap3(pt[0],pt[1]);
  return {sel:mapSel, locked:R.locked}; });
 await sleep(300);
 r.sign=await p.evaluate(()=>{ handleTap3(sendR().x+sendR().w/2, sendR().y+sendR().h/2);
  return {signed:S.vanto.signed, lapsed:S.vanto.lapsed}; });
 r.dawn1=await p.evaluate(t=>V_step(4000,t), 3);   // delivery 1
 // starve -> lapse on the next dawn
 await p.evaluate(()=>{ S.res.food=5; });
 r.dawn2=await p.evaluate(t=>V_step(4000,t), 4);
 // RE-SIGN: label check + real tap
 r.reSignLabel=await p.evaluate(()=>{ const R=REGIONS.find(x=>x.id==='vanto'); const pt=mpt(R); handleTap3(pt[0],pt[1]);
  return {sel:mapSel, lapsed:S.vanto.lapsed}; });
 await sleep(300);
 await p.screenshot({path:'vanto2-m.png'});
 r.reSign=await p.evaluate(()=>{ const t0=S.vanto.trades; handleTap3(sendR().x+sendR().w/2, sendR().y+sendR().h/2);
  return {signed:S.vanto.signed, lapsed:S.vanto.lapsed, tradesKept:S.vanto.trades===t0, trades:S.vanto.trades}; });
 await p.evaluate(()=>{ S.res.food=100; });
 r.dawn3=await p.evaluate(t=>V_step(4000,t), 5);   // delivery 2
 await p.evaluate(()=>{ S.res.food=100; });
 r.dawn4=await p.evaluate(t=>V_step(4000,t), 6);   // delivery 3 -> main
 r.banners=await p.evaluate(()=>BANNERS);
 // persistence
 await p.evaluate(()=>saveGame());
 await p.goto('http://localhost:8945/'+FILE,{waitUntil:'load',timeout:120000});
 t0=Date.now(); while(Date.now()-t0<120000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 r.afterReload=await p.evaluate(()=>({vanto:S.vanto}));
 r.errs=errs;
 console.log(JSON.stringify(r));
 await b.close();
})().catch(e=>{ try{ console.log('PARTIAL',JSON.stringify(r)); }catch(_){ } console.log('ERR',e.message); process.exit(1); });
