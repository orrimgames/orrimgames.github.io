// chronicle content: repetition suppressed, milestones recorded, survives a reload
const puppeteer=require('puppeteer-core');
const MOB=process.argv[2]==='m', FILE=process.env.FILE||'index-v106.html';
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
 await p.evaluate(()=>{ S.res={food:9000,wood:9000,stone:9000,gold:9000}; });
 const huts=await p.evaluate(()=>{ const h=hallB(); let ok=0; for(let i=0;i<6;i++){ if(placeBuilding('hut',h.tx+4+i*3,h.ty+5)) ok++; }
   let f=0; for(let i=0;i<3;i++){ if(placeBuilding('farm',h.tx-6,h.ty+3+i*3)) f++; }
   return {huts:ok, farms:f, hutLines:S.chronicle.filter(e=>/hut rose/.test(e.line)).length, farmLines:S.chronicle.filter(e=>/farm rose/.test(e.line)).length, lines:S.chronicle.length}; });
 await p.evaluate(()=>{ S.res.food=400; S.day=12; while(S.gobs.length<8){ if(!spawnGob(SITE.x+1,SITE.y+1,true)) break; } });
 await sleep(6000);
 const mile=await p.evaluate(()=>({badgeLines:S.chronicle.filter(e=>/earned a name for it/.test(e.line)).length,
   goalLines:S.chronicle.filter(e=>/and got it/.test(e.line)).length,
   badges:Object.keys(S.ach||{}).length, total:S.chronicle.length,
   sample:S.chronicle.slice(-6).map(e=>'d'+e.day+': '+e.line)}));
 await p.evaluate(()=>saveGame()); await sleep(600);
 await p.goto(url,{waitUntil:'load',timeout:120000});
 t0=Date.now(); while(Date.now()-t0<90000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 await skip(p);
 const after=await p.evaluate(()=>{ const n=S.chronicle.length; toggleChron(); return {lines:n, open:S.chronOpen, dupes:(()=>{const seen=new Set();let d=0;for(const e of S.chronicle){const k=e.day+'|'+e.line; if(seen.has(k))d++; seen.add(k);} return d;})()}; });
 await sleep(1200);
 await p.screenshot({path:'chroncov-'+(MOB?'m':'d')+'.png'});
 console.log(JSON.stringify({file:FILE,vp:MOB?'390x844':'1920x1080',huts,mile,after,errs},null,1));
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
