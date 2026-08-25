// stalemate repro: 5v9 ratkin raid, no support - dump unit/building state over time
const puppeteer=require('puppeteer-core');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage();
 await p.setViewport({width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8945/index-v111.html?new=1',{waitUntil:'load',timeout:120000});
 let t0=Date.now(); while(Date.now()-t0<120000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 const out=await p.evaluate(()=>{
  S.story=null; S.started=true; S.introZoom=0; S.elderHush=1; S.mode='village'; S.war.troops=5;
  const R=RIVALS[0]; startBattle(R);
  const snap=(tag)=>({tag, result:S.war.result&&S.war.result.win,
   units:S.gobs.map(g=>({side:g.side,hp:Math.round(g.hp),x:+g.x.toFixed(1),y:+g.y.toFixed(1),rout:!!g.rout,sw:!!g.sw})),
   bld:S.buildings.map(b=>({k:b.key,hp:Math.round(b.hp),tx:b.tx,ty:b.ty}))});
  const snaps=[];
  let simT=0; const dt=0.05;
  for(let i=0;i<2400;i++){ updateBattle(dt); simT+=dt; if(i%600===599) snaps.push(snap('t'+Math.round(simT))); if(S.war.result) break; }
  snaps.push(snap('end'));
  return {snaps, simT:Math.round(simT), result:S.war.result};
 });
 console.log(JSON.stringify({out,errs}));
 await b.close();
})().catch(e=>{console.log('ERR',e.message);process.exit(1);});
