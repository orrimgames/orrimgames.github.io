// v106: a stalled brood says why in its own chip - full (raise a hut) or hungry (30 food to breed); silent while growing or in tutorial
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
 // 1: fresh game, intro skipped, tutorial ACTIVE -> suppressed
 await p.evaluate(()=>{ S.story=null; S.started=true; S.introZoom=0; S.elderHush=1; S.mode='village'; S.dayT=0.4; });
 await sleep(400);
 const duringTut=await p.evaluate(()=>stallReason());
 // 2: tutorial done, brood at cap -> full
 await p.evaluate(()=>{ S.tut=QUESTS.length; S.res={food:9000,wood:9000,stone:9000,gold:9000}; S.popCap=S.gobs.length; });
 await sleep(500);
 const atCap=await p.evaluate(()=>stallReason());
 await p.screenshot({path:'stall-full-'+(MOB?'m':'d')+'.png', clip:{x:0,y:0,width:MOB?390:760,height:90}});
 // 3: room but no food -> hungry
 await p.evaluate(()=>{ S.popCap=99; S.res.food=10; });
 await sleep(500);
 const hungry=await p.evaluate(()=>stallReason());
 await p.screenshot({path:'stall-hungry-'+(MOB?'m':'d')+'.png', clip:{x:0,y:0,width:MOB?390:760,height:90}});
 // 4: food back -> silent again
 await p.evaluate(()=>{ S.res.food=50; });
 await sleep(500);
 const growing=await p.evaluate(()=>stallReason());
 console.log(JSON.stringify({vp:MOB?'390x844':'1920x1080',duringTut,atCap,hungry,growing,errs}));
 await b.close();
})().catch(e=>{console.log('ERR',e.message);process.exit(1);});
