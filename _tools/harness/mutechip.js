// v110: the sound switch - tap toggles A.muted + S.muted, the icon flips, the choice survives a reload
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
 await sleep(500);
 const before=await p.evaluate(()=>({rect:muteR(), muted:A.muted, s:S.muted}));
 await p.screenshot({path:'mute-on-'+(MOB?'m':'d')+'.png', clip:{x:0,y:440,width:130,height:70}});
 // real tap on the switch
 if(MOB) await p.touchscreen.tap(before.rect.x+before.rect.w/2, before.rect.y+before.rect.h/2); else { await p.mouse.click(before.rect.x+before.rect.w/2, before.rect.y+before.rect.h/2); }
 await sleep(800);
 const afterTap=await p.evaluate(()=>({muted:A.muted, s:S.muted}));
 await p.screenshot({path:'mute-off-'+(MOB?'m':'d')+'.png', clip:{x:0,y:440,width:130,height:70}});
 // reload WITHOUT ?new=1: the choice must survive
 await p.goto('http://localhost:8945/'+FILE,{waitUntil:'load',timeout:120000});
 t0=Date.now(); while(Date.now()-t0<90000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 await p.evaluate(()=>{ S.story=null; S.started=true; S.introZoom=0; S.elderHush=1; S.mode='village'; S.dayT=0.4; });
 await sleep(500);
 const afterReload=await p.evaluate(()=>({muted:A.muted, s:S.muted}));
 // and back on
 const r2=await p.evaluate(()=>muteR());
 if(MOB) await p.touchscreen.tap(r2.x+r2.w/2, r2.y+r2.h/2); else { await p.mouse.click(r2.x+r2.w/2, r2.y+r2.h/2); }
 await sleep(800);
 const backOn=await p.evaluate(()=>({muted:A.muted, s:S.muted}));
 console.log(JSON.stringify({vp:MOB?'390x844':'1920x1080',before:{muted:before.muted,s:before.s},afterTap,afterReload,backOn,errs}));
 await b.close();
})().catch(e=>{console.log('ERR',e.message);process.exit(1);});
