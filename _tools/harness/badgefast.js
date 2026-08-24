// how fast does a badge fire once its condition becomes true? measures frames+ms from condition to S.ach
const puppeteer=require('puppeteer-core');
const MOB=process.argv[2]==='m', FILE=process.env.FILE||'index-v106.html';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage();
 await p.setViewport(MOB?{width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true}:{width:1920,height:1080,deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push('console:'+m.text());});
 await p.goto('http://localhost:8945/'+FILE+'?new=1',{waitUntil:'load',timeout:120000});
 let t0=Date.now(); while(Date.now()-t0<90000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 for(let i=0;i<5;i++){ await p.evaluate(()=>{ S.story=null; S.started=true; S.introZoom=0; S.tut=QUESTS.length; S.elderHush=1; S.mode='village'; S.dayT=0.4; }); await sleep(300); }
 // condition true for one frame only: food over 300, then spent immediately on the next frame
 const r=await p.evaluate(async()=>{
   S.res.food=5; const f0=G.frame, t0=performance.now();
   S.res.food=400;
   await new Promise(rq=>requestAnimationFrame(()=>requestAnimationFrame(rq)));
   const fired1=!!(S.ach&&S.ach.larder300);
   S.res.food=5;   // spent on a building, the way a player would
   return {framesWaited:G.frame-f0, ms:Math.round(performance.now()-t0), firedAfter2Frames:fired1};
 });
 await sleep(4000);
 const later=await p.evaluate(()=>({larder300:!!(S.ach&&S.ach.larder300), food:Math.round(S.res.food)}));
 console.log(JSON.stringify({file:FILE,vp:MOB?'390x844':'1920x1080',...r,later,errs}));
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
