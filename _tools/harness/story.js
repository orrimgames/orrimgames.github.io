// intro/story audit: fresh boot title -> real tap starts story -> real taps advance beats -> finishStory auto on last -> 'MAKE IT BREATHE AGAIN'; fresh boot #2 -> SKIP pill; boot #3 -> natural RAF auto-advance; save reload -> no replay (welcome-back gate). 390x844, real touchscreen taps.
const puppeteer=require('puppeteer-core');
const MOB=process.argv[2]!=='d', FILE=process.env.FILE||'index-v113.html';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',protocolTimeout:600000,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage();
 await p.setViewport(MOB?{width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true}:{width:1920,height:1080,deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error'&&!/404/.test(m.text()))errs.push('console:'+m.text());});
 const boot=async()=>{ await p.goto('http://localhost:8945/'+FILE+'?new=1',{waitUntil:'load',timeout:120000});
  let t0=Date.now(); while(Date.now()-t0<120000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); } };
 const st=()=>p.evaluate(()=>({story:!!S.story, beat:S.story&&S.story.beat, started:S.started, banner:S.banner&&S.banner.t, zoom:S.introZoom}));
 const r={vp:MOB?'390x844':'1920x1080'};
 // boot 1: title -> tap through all beats
 await boot();
 r.title=await st();
 await p.screenshot({path:'story-title.png'});
 await p.touchscreen.tap(195,422); await sleep(400);
 r.beat0=await st();
 await p.screenshot({path:'story-m.png'});
 r.taps=[];
 for(let i=0;i<4;i++){ await p.touchscreen.tap(195,422); await sleep(400); r.taps.push(await st()); }
 r.afterStory=await st();
 // boot 2: SKIP pill
 await boot();
 await p.touchscreen.tap(195,422); await sleep(300);
 const sk=await p.evaluate(()=>storySkipR());
 await p.touchscreen.tap(sk.x+sk.w/2, sk.y+sk.h/2); await sleep(400);
 r.skip=await st();
 // boot 3: natural auto-advance (no taps after the starter tap)
 await boot();
 await p.touchscreen.tap(195,422); await sleep(200);
 const b0=await st();
 await sleep(7000);
 r.autoAdvance={from:b0.beat, to:await st()};
 // persistence: reload (plain URL) -> welcome-back gate, story must NOT replay
 await p.evaluate(()=>saveGame());
 await p.goto('http://localhost:8945/'+FILE,{waitUntil:'load',timeout:120000});
 let t0=Date.now(); while(Date.now()-t0<120000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 r.reloadPre=await p.evaluate(()=>({story:!!S.story, started:S.started, saveExists}));
 await p.touchscreen.tap(195,422); await sleep(400);
 r.reloadTap=await st();
 r.errs=errs;
 console.log(JSON.stringify(r));
 await b.close();
})().catch(e=>{ try{ console.log('PARTIAL',JSON.stringify(r)); }catch(_){ } console.log('ERR',e.message); process.exit(1); });
