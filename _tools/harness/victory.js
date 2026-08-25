// victory ceremony smoke: force every banner, watch the dawn, tap through the ENDURES card, confirm the ending persists
const puppeteer=require('puppeteer-core');
const MOB=process.argv[2]!=='d', FILE=process.env.FILE||'index-v110.html';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage();
 await p.setViewport(MOB?{width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true}:{width:1920,height:1080,deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push('console:'+m.text());});
 const tap=async(x,y)=>{ if(MOB) await p.touchscreen.tap(x,y); else await p.mouse.click(x,y); };
 await p.goto('http://localhost:8945/'+FILE+'?new=1',{waitUntil:'load',timeout:120000});
 let t0=Date.now(); while(Date.now()-t0<90000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 await p.evaluate(()=>{ S.story=null; S.started=true; S.introZoom=0; S.tut=QUESTS.length; S.elderHush=1; S.mode='village'; S.dayT=0.4; S.res={food:9000,wood:9000,stone:9000,gold:9000}; });
 await sleep(500);
 const chron0=await p.evaluate(()=>S.chronicle.length);
 await p.evaluate(()=>{ S.war.banners=RIVALS.map(r=>r.id); checkVictory(); });
 await sleep(400);
 const vict=await p.evaluate(()=>({victory:S.victory, phase:S.victPhase}));
 await sleep(2500);
 await p.screenshot({path:'vict-dawn-'+(MOB?'m':'d')+'.png'});   // phase 0: fireworks over the village
 // tap once: fast-forwards the dawn, lands on the ENDURES card
 await tap(195,400); await sleep(1200);
 const phase1=await p.evaluate(()=>S.victPhase);
 await sleep(800);
 await p.screenshot({path:'vict-card-'+(MOB?'m':'d')+'.png'});
 // tap again: the ending closes
 await tap(195,400); await sleep(800);
 const done=await p.evaluate(()=>({phase:S.victPhase, ceremonyDone:S.ceremonyDone, share:S._shareT>0, chron:S.chronicle.length, goal:goalLine().done}));
 // reload: the ending must not replay
 await p.goto('http://localhost:8945/'+FILE,{waitUntil:'load',timeout:120000});
 t0=Date.now(); while(Date.now()-t0<90000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 const persisted=await p.evaluate(()=>({victory:S.victory, ceremonyDone:S.ceremonyDone, phase:S.victPhase}));
 console.log(JSON.stringify({vp:MOB?'390x844':'1920x1080',vict,phase1,done,persisted,chron0,errs}));
 await b.close();
})().catch(e=>{console.log('ERR',e.message);process.exit(1);});
