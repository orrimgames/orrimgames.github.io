// v105: does the bar teach itself? one subtle self-scroll when the wanted card is off the end, once per goal, never after the player has scrolled
const puppeteer=require('puppeteer-core');
const MOB=process.argv[2]!=='d', FILE=process.env.FILE||'index-v110.html';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage();
 await p.setViewport(MOB?{width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true}:{width:1920,height:1080,deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push('console:'+m.text());});
 await p.goto('http://localhost:8945/'+FILE+'?new=1',{waitUntil:'load',timeout:120000});
 let t0=Date.now(); while(Date.now()-t0<90000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 for(let i=0;i<5;i++){ await p.evaluate(()=>{ S.story=null; S.started=true; S.introZoom=0; S.tut=QUESTS.length; S.elderHush=1; S.mode='village'; S.dayT=0.4; S.res={food:9000,wood:9000,stone:9000,gold:9000}; }); await sleep(300); }
 await sleep(600);
 const fps0=await p.evaluate(()=>Math.round(G.fps));
 // arm the GOLD MINE goal and watch what the bar does on its own
 await p.evaluate(()=>{ S.goalDone=2; S._goal=undefined; goalLine(); });
 const trace=[]; let shot=false, peakAt=null;
 for(let i=0;i<70;i++){
   const v=await p.evaluate(()=>({s:Math.round(barScroll), n:!!barNudge}));
   trace.push(v.s);
   if(!shot && v.s>8){ await p.screenshot({path:'nudge-mid-'+(MOB?'m':'d')+'.png'}); shot=true; peakAt=i; }
   await sleep(60);
 }
 await sleep(1200);
 const after=await p.evaluate(()=>({s:Math.round(barScroll), nudge:!!barNudge, learned:barLearned, fps:Math.round(G.fps), pill:!!barJumpR(), nudged:Object.keys(barNudged)}));
 // same goal again: must not nudge twice
 const trace2=[];
 for(let i=0;i<14;i++){ trace2.push(await p.evaluate(()=>Math.round(barScroll))); await sleep(70); }
 // a player who scrolls the bar has learned it: next goal must not nudge
 await p.evaluate(()=>{ barLearned=false; delete barNudged['shrine']; });
 if(MOB){ await p.touchscreen.tap(200,H_=0); }
 await p.evaluate(()=>{ barLearned=true; S.goalDone=3; S._goal=undefined; goalLine(); });
 const trace3=[];
 for(let i=0;i<14;i++){ trace3.push(await p.evaluate(()=>Math.round(barScroll))); await sleep(70); }
 console.log(JSON.stringify({vp:MOB?'390x844':'1920x1080',fps0,peak:Math.max(...trace),peakAt,trace,after,repeat:{min:Math.min(...trace2),max:Math.max(...trace2)},learned:{min:Math.min(...trace3),max:Math.max(...trace3)},errs}));
 await b.close();
})().catch(e=>{console.log('ERR',e.message);process.exit(1);});
