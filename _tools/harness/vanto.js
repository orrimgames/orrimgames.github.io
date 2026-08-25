// vanto contract audit: real taps WORLD->vanto node->SIGN, dawn trades to the Main, lapse on hungry dawn, persistence
const puppeteer=require('puppeteer-core');
const MOB=process.argv[2]!=='d', FILE=process.env.FILE||'index-v112.html';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',protocolTimeout:600000,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage();
 await p.setViewport(MOB?{width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true}:{width:1920,height:1080,deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error'&&!/404/.test(m.text()))errs.push('console:'+m.text());});
 await p.goto('http://localhost:8945/'+FILE+'?new=1',{waitUntil:'load',timeout:120000});
 let t0=Date.now(); while(Date.now()-t0<120000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 const r={vp:MOB?'390x844':'1920x1080'};
 // setup: day 3, stocked village
 r.setup=await p.evaluate(()=>{ S.story=null; S.started=true; S.introZoom=0; S.elderHush=1; S.mode='village';
  S.day=3; S.res.food=100; S.res.gold=50;
  return {day:S.day, vanto:S.vanto.signed}; });
 // real taps: open WORLD map, tap the vanto node, tap SIGN
 r.tapMap=await p.evaluate(()=>{ deskTap(warBtnR()); return {mode:S.mode}; });
 r.tapNode=await p.evaluate(()=>{ const R=REGIONS.find(x=>x.id==='vanto'); const pt=mpt(R); handleTap3(pt[0],pt[1]);
  return {sel:mapSel}; });
 await sleep(300);
 await p.screenshot({path:'vanto-'+(MOB?'m':'d')+'.png'});
 r.tapSign=await p.evaluate(()=>{ handleTap3(sendR().x+sendR().w/2, sendR().y+sendR().h/2);
  return {signed:S.vanto.signed}; });
 // run dawns with food>=20: trades each dawn, Main at 3 (chunked)
 await p.evaluate(()=>{ window.VANTO_step=function(n,target){ const dt=0.05; let i=0;
   while(S.day===target&&i<n){ tickClock(dt); updateWorld(dt); i++; } return {day:S.day,trades:S.vanto.trades,main:S.vanto.main,gold:Math.round(S.res.gold),i}; }; });
 r.dawns=[];
 for(let d=0;d<4;d++){ await p.evaluate(()=>{ S.res.food=100; });
  let st={day:3+d}, guard=0;
  while(st.day===3+d&&guard<40){ st=await p.evaluate(t=>VANTO_step(4000,t),3+d); guard++; }
  r.dawns.push(st); }
 // lapse: hungry dawn cancels the contract
 await p.evaluate(()=>{ S.vanto.signed=true; S.vanto.main=false; S.vanto.trades=0; S.vanto.lapsed=false; S.res.food=5; });
 { let d0=await p.evaluate(()=>S.day), st={day:d0}, guard=0;
  while(st.day===d0&&guard<40){ st=await p.evaluate(t=>VANTO_step(4000,t),d0); guard++; }
  r.lapse=await p.evaluate(()=>({signed:S.vanto.signed,lapsed:S.vanto.lapsed})); }
 // persistence of the Main across save+reload
 r.persist=await p.evaluate(()=>{ S.vanto.signed=true; S.vanto.main=true; S.vanto.trades=3; saveGame(); return {saved:true}; });
 await p.goto('http://localhost:8945/'+FILE,{waitUntil:'load',timeout:120000});
 t0=Date.now(); while(Date.now()-t0<120000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 r.afterReload=await p.evaluate(()=>({signed:S.vanto.signed, main:S.vanto.main, trades:S.vanto.trades}));
 r.errs=errs;
 console.log(JSON.stringify(r));
 await b.close();
})().catch(e=>{console.log('ERR',e.message);process.exit(1);});
