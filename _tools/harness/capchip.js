// v108: a resource at its ceiling shows v/cap in amber; raising the ceiling (storehouse) clears it
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
 await p.evaluate(()=>{ S.story=null; S.started=true; S.introZoom=0; S.tut=QUESTS.length; S.elderHush=1; S.mode='village'; S.dayT=0.4; });
 await sleep(400);
 const capBefore=await p.evaluate(()=>({foodCap:capOf('food')}));
 await p.evaluate(()=>{ S.res.food=capOf('food'); });
 await sleep(2500);
 await p.screenshot({path:'cap-full-'+(MOB?'m':'d')+'.png', clip:{x:0,y:0,width:MOB?390:820,height:52}});
 // a storehouse rises: ceiling moves, the chip must go back to plain
 await p.evaluate(()=>{ const b2=makeBuilding('store',24,20); b2.pop=1; b2.t=9; S.buildings.push(b2); });
 await sleep(2500);
 const capAfter=await p.evaluate(()=>({foodCap:capOf('food'), food:S.res.food}));
 await p.screenshot({path:'cap-raised-'+(MOB?'m':'d')+'.png', clip:{x:0,y:0,width:MOB?390:820,height:52}});
 console.log(JSON.stringify({vp:MOB?'390x844':'1920x1080',capBefore,capAfter,errs}));
 await b.close();
})().catch(e=>{console.log('ERR',e.message);process.exit(1);});
