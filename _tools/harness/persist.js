// remembered-vs-recomputed audit: earn things, then break the conditions, save, reload, see what survived
const puppeteer=require('puppeteer-core');
const MOB=process.argv[2]==='m', FILE=process.env.FILE||'index-v106.html';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage();
 await p.setViewport(MOB?{width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true}:{width:1920,height:1080,deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push('console:'+m.text());});
 const url='http://localhost:8945/'+FILE;
 await p.goto(url+'?new=1',{waitUntil:'load',timeout:120000});
 let t0=Date.now(); while(Date.now()-t0<90000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 for(let i=0;i<5;i++){ await p.evaluate(()=>{ S.story=null; S.started=true; S.introZoom=0; S.tut=QUESTS.length; S.elderHush=1; S.mode='village'; S.dayT=0.4; }); await sleep(300); }
 // earn: reversible milestones only - food 400 (badge larder300 + goal 'stock 300'), day 12 (day10 badge + goal), 8 goblins
 await p.evaluate(()=>{ S.res.food=400; S.day=12; while(S.gobs.length<8){ const g=spawnGob(SITE.x+1,SITE.y+1,true); if(!g) break; } });
 await sleep(7000);
 const earned=await p.evaluate(()=>({ach:Object.keys(S.ach||{}),goalDone:S.goalDone,goal:goalLine().text,pop:S.gobs.length,food:Math.round(S.res.food),day:S.day}));
 // break every one of those conditions, then save
 await p.evaluate(()=>{ S.res.food=5; while(S.gobs.length>4) S.gobs.pop(); recount(); S.pop=S.gobs.length; saveGame(); });
 await sleep(1200);
 const broken=await p.evaluate(()=>({ach:Object.keys(S.ach||{}),goalDone:S.goalDone,goal:goalLine().text,pop:S.gobs.length,food:Math.round(S.res.food)}));
 await p.goto(url,{waitUntil:'load',timeout:120000});
 t0=Date.now(); while(Date.now()-t0<90000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 await sleep(7000);
 const after=await p.evaluate(()=>({ach:Object.keys(S.ach||{}),goalDone:S.goalDone,goal:goalLine().text,pop:S.gobs.length,food:Math.round(S.res.food),day:S.day,tut:S.tut,hints:Object.keys(S.hints||{}).length,chron:S.chronicle.length}));
 await p.screenshot({path:'persist-'+(MOB?'m':'d')+'.png'});
 console.log(JSON.stringify({vp:MOB?'390x844':'1920x1080',earned,broken,after,errs},null,1));
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
