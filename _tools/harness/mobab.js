// true-mobile harness: real touch taps only
const puppeteer=require('puppeteer-core');
const FILE=process.argv[2]||'index-v99.html';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage();
 await p.setViewport({width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push('console:'+m.text());});
 await p.goto('http://localhost:8945/'+FILE+'?new=1',{waitUntil:'load',timeout:120000});
 let t0=Date.now(); while(Date.now()-t0<90000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 for(let i=0;i<5;i++){ await p.evaluate(()=>{ S.story=null; S.started=true; S.introZoom=0; S.tut=QUESTS.length; S.elderHush=1; S.mode='village'; S.dayT=0.4; CAM.zoom=1; CAM.tx=29.5; CAM.ty=29.5; S.res={food:900,wood:900,stone:900,gold:900}; }); await sleep(300); }
 const card=await p.evaluate(()=>{ const r=cardRect2(0); return {x:r.x+r.w/2,y:r.y+r.h/2}; });
 await p.touchscreen.tap(card.x,card.y); await sleep(400);
 const sel=await p.evaluate(()=>S.sel);
 const res=[];
 const gx=195, gy=430;
 const n0=await p.evaluate(()=>S.buildings.length);
 await p.touchscreen.tap(gx,gy); await sleep(250);
 const ghost=await p.evaluate(()=>({show:S.ghost.show,ok:S.ghost.ok,armed:ghostArmed}));
 await p.touchscreen.tap(gx,gy); await sleep(700);
 res.push({x:gx,y:gy,ghost,n0,n1:await p.evaluate(()=>S.buildings.length)});
 await p.screenshot({path:'mob-village.png'});
 console.log(FILE, JSON.stringify({sel,res,errs}));
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
