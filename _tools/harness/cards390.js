// which build cards are reachable on screen at 390, and does the tutorial ring ever point off-screen?
const puppeteer=require('puppeteer-core');
const MOB=process.argv[2]!=='d';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage();
 await p.setViewport(MOB?{width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true}:{width:1920,height:1080,deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8945/'+(process.env.FILE||'index-v106.html')+'?new=1',{waitUntil:'load',timeout:120000});
 let t0=Date.now(); while(Date.now()-t0<90000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 for(let i=0;i<5;i++){ await p.evaluate(()=>{ S.story=null; S.started=true; S.introZoom=0; S.mode='village'; S.dayT=0.4; }); await sleep(300); }
 const r=await p.evaluate(()=>{
   const out={W,H,BARH,CARDW,barScroll:Math.round(barScroll),barScrollMax:Math.round(barScrollMax),cards:[]};
   for(let i=0;i<BKEYS.length;i++){ const c=cardRect2(i); out.cards.push({i,key:BKEYS[i],x:Math.round(c.x),w:Math.round(c.w),onScreen:c.x>=-2&&c.x+c.w<=W+2}); }
   out.tutTargets={};
   for(const k of ['farm','hut']){ const c=cardRect2(BKEYS.indexOf(k)); out.tutTargets[k]={x:Math.round(c.x),onScreen:c.x>=-2&&c.x+c.w<=W+2}; }
   return out;
 });
 console.log(JSON.stringify({vp:MOB?'390x844':'1920x1080',...r,errs},null,1));
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
