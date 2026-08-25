// intro/story audit: cold open plays, taps advance beats, SKIP lands clean, save returns skip the story, hushed elder returns
const puppeteer=require('puppeteer-core');
const MOB=process.argv[2]!=='d', FILE=process.env.FILE||'index-v111.html';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage();
 await p.setViewport(MOB?{width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true}:{width:1920,height:1080,deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push('console:'+m.text());});
 const tap=async(x,y)=>{ if(MOB) await p.touchscreen.tap(x,y); else await p.mouse.click(x,y); };
 const boot=async(url)=>{ await p.goto(url,{waitUntil:'load',timeout:120000});
   let t0=Date.now(); while(Date.now()-t0<120000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); } };
 const r={vp:MOB?'390x844':'1920x1080'};
 // A: fresh world, title tap starts the cold open
 await boot('http://localhost:8945/'+FILE+'?new=1');
 await tap(195,450); await sleep(800);
 r.storyStart=await p.evaluate(()=>({story:!!S.story, beat:S.story&&S.story.beat, started:S.started, iz:+S.introZoom.toFixed(2)}));
 await sleep(1500);
 await p.screenshot({path:'intro-beat-'+(MOB?'m':'d')+'.png'});
 // B: ground taps advance one beat each
 r.beatTaps=await p.evaluate(()=>{ const b0=S.story.beat; return b0; });
 await tap(120,500); await sleep(400);
 const b1=await p.evaluate(()=>S.story&&S.story.beat);
 await tap(120,500); await sleep(400);
 const b2=await p.evaluate(()=>S.story&&S.story.beat);
 r.beatAdvance=[b1,b2];
 // C: SKIP lands in a clean playable state
 await p.evaluate(()=>{ const r=storySkipR(); return r; });
 await tap(MOB?355:1880, 81); await sleep(900);
 r.afterSkip=await p.evaluate(()=>({story:S.story===null, started:S.started, iz:+S.introZoom.toFixed(2), tut:S.tut, mode:S.mode, camFinite:isFinite(CAM.zoom)&&isFinite(CAM.pitch)&&isFinite(CAM.yaw)}));
 // D: reload with a save: no story replay, REMEMBERS YOU path
 await boot('http://localhost:8945/'+FILE);
 r.returning=await p.evaluate(()=>({story:!!S.story, started:S.started, save:saveExists}));
 await tap(195,450); await sleep(700);
 r.returnTap=await p.evaluate(()=>({started:S.started, story:!!S.story}));
 // E: hush the elder, reload, the elder returns at the first unmet quest
 await p.evaluate(()=>{ S.tut=QUESTS.length; S.elderHush=1; saveGame(); });
 await boot('http://localhost:8945/'+FILE);
 await tap(195,450); await sleep(900);
 r.elderReturn=await p.evaluate(()=>({tut:S.tut, unmet0:S.tut===0}));
 // F: full no-touch playthrough auto-finishes
 await boot('http://localhost:8945/'+FILE+'?new=1');
 await tap(195,450); await sleep(300);
 let waited=0; while(waited<40000){ const s=await p.evaluate(()=>S.story===null&&S.started); if(s) break; await sleep(2000); waited+=2000; }
 r.autoFinish=await p.evaluate(()=>({story:S.story===null, started:S.started, tut:S.tut, waitedMs:waited}));
 r.errs=errs;
 console.log(JSON.stringify(r));
 await b.close();
})().catch(e=>{console.log('ERR',e.message);process.exit(1);});
