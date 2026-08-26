// cold peace treaty audit: real taps WORLD->karrow->ACCEPT, legion joins battles, 4g/dawn tithe, unpaid tithe breaks it, persistence
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
 r.setup=await p.evaluate(()=>{ S.story=null; S.started=true; S.introZoom=0; S.elderHush=1; S.mode='village';
  S.day=3; S.res.gold=50; S.war.banners=['ratkin','ironbeard'];
  return {banners:S.war.banners.length}; });
 r.tapMap=await p.evaluate(()=>{ deskTap(warBtnR()); return {mode:S.mode}; });
 r.tapNode=await p.evaluate(()=>{ const R=REGIONS.find(x=>x.id==='karrow'); const pt=mpt(R); handleTap3(pt[0],pt[1]);
  return {sel:mapSel}; });
 await sleep(300);
 await p.screenshot({path:'treaty-'+(MOB?'m':'d')+'.png'});
 r.tapAccept=await p.evaluate(()=>{ handleTap3(sendR().x+sendR().w/2, sendR().y+sendR().h/2);
  return {treaty:S.war.treaty, banner:S.banner&&S.banner.t}; });
 // legion joins the next battle
 r.legion=await p.evaluate(()=>{ S.war.troops=5; startBattle(RIVALS[0]);
  const leg=S.gobs.filter(g=>g.side==='us'&&g.legion);
  const out={legion:leg.length, hp:leg[0]&&leg[0].hp, atk:leg[0]&&leg[0].atk, rig:leg[0]&&leg[0].rig};
  for(const g of S.gobs.slice()) if(g.side==='us'&&!g.legion) g.hp=0;   // end it fast
  const dt=0.05; let g2=0; while(!S.war.result&&g2<2000){ updateBattle(dt); g2++; }
  if(S.war.result) leaveBattle(); S.mode='village';
  return out; });
 // dawn tithe holds the peace when paid
 r.tithe=await p.evaluate(()=>{ S.res.gold=50; const dt=0.05; let i=0; const d0=S.day;
  while(S.day===d0&&i<80000){ tickClock(dt); updateWorld(dt); i++; }
  return {gold:Math.round(S.res.gold), treaty:S.war.treaty}; });
 // unpaid tithe breaks it
 r.broke=await p.evaluate(()=>{ S.res.gold=0; const dt=0.05; let i=0; const d0=S.day;
  while(S.day===d0&&i<80000){ tickClock(dt); updateWorld(dt); i++; }
  return {gold:Math.round(S.res.gold), treaty:S.war.treaty}; });
 // persistence
 r.persist=await p.evaluate(()=>{ S.war.treaty=true; saveGame(); return {saved:true}; });
 await p.goto('http://localhost:8945/'+FILE,{waitUntil:'load',timeout:120000});
 t0=Date.now(); while(Date.now()-t0<120000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 r.afterReload=await p.evaluate(()=>({treaty:S.war.treaty}));
 r.errs=errs;
 console.log(JSON.stringify(r));
 await b.close();
})().catch(e=>{console.log('ERR',e.message);process.exit(1);});
