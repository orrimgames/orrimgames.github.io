// milestone survival: ordinary lines get evicted first, in memory and in the save
const puppeteer=require('puppeteer-core');
const MOB=process.argv[2]==='m', FILE=process.env.FILE||'index-v110.html';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const skip=async p=>{ for(let i=0;i<5;i++){ await p.evaluate(()=>{ S.story=null; S.started=true; S.introZoom=0; S.tut=QUESTS.length; S.elderHush=1; S.mode='village'; S.dayT=0.4; }); await sleep(300);} };
(async()=>{
 const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage();
 await p.setViewport(MOB?{width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true}:{width:1920,height:1080,deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push('console:'+m.text());});
 const url='http://localhost:8945/'+FILE;
 await p.goto(url+'?new=1',{waitUntil:'load',timeout:120000});
 let t0=Date.now(); while(Date.now()-t0<90000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 await skip(p);
 const r=await p.evaluate(()=>{
   const founding=S.chronicle.filter(e=>/planted a hall/.test(e.line)).length;
   // five real milestones, then a long boring game
   for(let d=1;d<=5;d++){ S.day=d; chron('MILESTONE '+d,true); }
   for(let d=6;d<=200;d++){ S.day=d; chron('an ordinary day, number '+d); }
   const mem={lines:S.chronicle.length, milestones:S.chronicle.filter(e=>e.k).length, foundingKept:S.chronicle.some(e=>/planted a hall/.test(e.line))};
   const sv=chronTrim(S.chronicle,60);
   return {founding, mem, save:{lines:sv.length, milestones:sv.filter(e=>e.k).length, foundingKept:sv.some(e=>/planted a hall/.test(e.line)), oldestOrdinary:(sv.find(e=>!e.k)||{}).line}};
 });
 // badge phrasing variety
 const said=await p.evaluate(()=>{ const out=[]; for(let i=0;i<BADGE_SAID.length;i++) out.push(BADGE_SAID[i]('FULL LARDERS')); return out; });
 // it still saves and reloads with the milestones intact
 await p.evaluate(()=>saveGame()); await sleep(600);
 await p.goto(url,{waitUntil:'load',timeout:120000});
 t0=Date.now(); while(Date.now()-t0<90000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 await skip(p);
 const after=await p.evaluate(()=>{ const n=S.chronicle.length; const ms=S.chronicle.filter(e=>e.k).length; const f=S.chronicle.some(e=>/planted a hall/.test(e.line)); toggleChron(); chronScroll(-99999); return {lines:n, milestones:ms, foundingKept:f}; });
 await sleep(1200);
 await p.screenshot({path:'chrontrim-'+(MOB?'m':'d')+'.png'});
 console.log(JSON.stringify({file:FILE,vp:MOB?'390x844':'1920x1080',...r,said,after,errs},null,1));
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
