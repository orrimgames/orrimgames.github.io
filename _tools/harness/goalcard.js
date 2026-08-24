// does the game point at the building it is asking for, even when the card is off the end of the bar?
const puppeteer=require('puppeteer-core');
const MOB=process.argv[2]!=='d', FILE=process.env.FILE||'index-v106.html';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage();
 await p.setViewport(MOB?{width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true}:{width:1920,height:1080,deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push('console:'+m.text());});
 await p.goto('http://localhost:8945/'+FILE+'?new=1',{waitUntil:'load',timeout:120000});
 let t0=Date.now(); while(Date.now()-t0<90000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 for(let i=0;i<5;i++){ await p.evaluate(()=>{ S.story=null; S.started=true; S.introZoom=0; S.tut=QUESTS.length; S.elderHush=1; S.mode='village'; S.dayT=0.4; S.res={food:9000,wood:9000,stone:9000,gold:9000}; }); await sleep(300); }
 // force the goal rail onto the GOLD MINE goal (card index 4, off the end of the bar at 390)
 const set=await p.evaluate(()=>{ S.goalDone=2; S._goal=undefined; const l=goalLine(); return {goal:l.text, want:objCardKey(), jump:barJumpR(), scroll:Math.round(barScroll)}; });
 await sleep(900);
 await p.screenshot({path:'goalcard-off-'+(MOB?'m':'d')+'.png'});
 // tap the pill the way a thumb would
 const j=await p.evaluate(()=>barJumpR());
 let tapped=null;
 if(j){ if(MOB) await p.touchscreen.tap(j.x+j.w/2,j.y+j.h/2); else await p.mouse.click(j.x+j.w/2,j.y+j.h/2); await sleep(900);
   tapped=await p.evaluate(()=>{ const i=BKEYS.indexOf(objCardKey()), c=cardRect2(i);
     return {scroll:Math.round(barScroll), cardX:Math.round(c.x), onScreen:c.x>=-2&&c.x+c.w<=W+2, jumpGone:barJumpR()===null}; }); }
 await p.screenshot({path:'goalcard-on-'+(MOB?'m':'d')+'.png'});
 // and the ring points at it: select nothing, confirm ring target matches
 const ring=await p.evaluate(()=>({want:objCardKey(), sel:S.sel}));
 // sanity: the quarry goal (already visible card) needs no pill
 const q=await p.evaluate(()=>{ S.goalDone=1; S._goal=undefined; return {goal:goalLine().text, want:objCardKey(), jump:barJumpR()}; });
 console.log(JSON.stringify({file:FILE,vp:MOB?'390x844':'1920x1080',set,tapped,ring,quarry:q,errs},null,1));
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
