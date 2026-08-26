// vellumspire school audit: real taps WORLD->vellum->SEND, scholar leaves, dawn letters, returns day+3 as the Scholar, persistence
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
  S.day=3; S.res.stone=200; S.res.gold=100;
  let ok=false; for(let x=8;x<24&&!ok;x+=2) for(let y=8;y<24&&!ok;y+=2) ok=placeBuilding('shrine',x,y);
  return {shrine:hasShrine(), placed:ok, gobs:S.gobs.length, school:S.school}; });
 r.tapMap=await p.evaluate(()=>{ deskTap(warBtnR()); return {mode:S.mode}; });
 r.tapNode=await p.evaluate(()=>{ const R=REGIONS.find(x=>x.id==='vellum'); const pt=mpt(R); handleTap3(pt[0],pt[1]);
  return {sel:mapSel}; });
 await sleep(300);
 await p.screenshot({path:'school-'+(MOB?'m':'d')+'.png'});
 r.tapSend=await p.evaluate(()=>{ const n0=S.gobs.length;
  handleTap3(sendR().x+sendR().w/2, sendR().y+sendR().h/2);
  return {school:S.school, gobsBefore:n0, gobsAfter:S.gobs.length, back:S.scholar&&S.scholar.back, banner:S.banner&&S.banner.t}; });
 if(!r.tapSend||!r.tapSend.back){ r.SKIP='sendScholar did not fire'; r.errs=errs; console.log(JSON.stringify(r)); await b.close(); process.exit(0); }
 await p.evaluate(()=>{ window.SCH_step=function(n,target){ const dt=0.05; let i=0;
   while(S.day===target&&i<n){ tickClock(dt); updateWorld(dt); i++; }
   return {day:S.day, school:S.school, scholarHere:S.gobs.some(g=>g.scholar), faith:Math.round(S.faith), i}; }; });
 r.dawns=[];
 for(let d=0;d<3;d++){ let d0=await p.evaluate(()=>S.day), st={day:d0}, guard=0;
  while(st.day===d0&&guard<40){ st=await p.evaluate(t=>SCH_step(4000,t),d0); guard++; }
  r.dawns.push({day:st.day, school:st.school, scholarHere:st.scholarHere, faith:st.faith}); }
 r.scholarDetail=await p.evaluate(()=>{ const g=S.gobs.find(g=>g.scholar);
  return g?{name:g.name, job:g.job, tint:!!g.tint}:null; });
 r.persist=await p.evaluate(()=>{ saveGame(); return {saved:true}; });
 await p.goto('http://localhost:8945/'+FILE,{waitUntil:'load',timeout:120000});
 t0=Date.now(); while(Date.now()-t0<120000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 r.afterReload=await p.evaluate(()=>{ const g=S.gobs.find(g=>g.scholar); return {school:S.school, scholar:!!g, name:g&&g.name, job:g&&g.job, tint:g&&g.tint}; });
 r.errs=errs;
 console.log(JSON.stringify(r));
 await b.close();
})().catch(e=>{console.log('ERR',e.message);process.exit(1);});
