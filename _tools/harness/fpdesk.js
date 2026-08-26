// desktop FP-battle rally-click repro: does the mouse path hit the same W*0.45 walk-stick shadow as touch?
const puppeteer=require('puppeteer-core');
const FILE=process.env.FILE||'index-v113.html';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',protocolTimeout:600000,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage();
 await p.setViewport({width:1920,height:1080,deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error'&&!/404/.test(m.text()))errs.push('console:'+m.text());});
 await p.goto('http://localhost:8945/'+FILE+'?new=1',{waitUntil:'load',timeout:120000});
 let t0=Date.now(); while(Date.now()-t0<120000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 const r={vp:'1920x1080'};
 await p.evaluate(()=>{ S.story=null; S.started=true; S.introZoom=0; S.tut=QUESTS.length; S.elderHush=1; S.mode='village';
  S.day=2; S.dayT=0.4; S.faith=60; S.war.troops=6; startBattle(RIVALS.find(x=>x.id==='ratkin')); });
 // Enter key enters FP battle on desktop (5491)
 await p.keyboard.press('Enter'); await sleep(800);
 r.fpEnter=await p.evaluate(()=>({on:FP.on, battle:FP.battle, hp:FP.hp}));
 const rr=await p.evaluate(()=>rallyR());
 r.rallyRect=rr; r.split=await p.evaluate(()=>W*0.45);
 await p.mouse.click(rr.x+rr.w/2, rr.y+rr.h/2); await sleep(400);
 r.rallyClick=await p.evaluate(()=>({rally:S.war.rally, used:S.war.rallyUsed}));
 const fr=await p.evaluate(()=>fireR());
 r.fireRect=fr;
 await p.mouse.click(fr.x+fr.w/2, fr.y+fr.h/2); await sleep(400);
 r.fireClick=await p.evaluate(()=>({faith:S.faith, firedOnce:S.war.firedOnce}));
 r.errs=errs;
 console.log(JSON.stringify(r));
 await b.close();
})().catch(e=>{ try{ console.log('PARTIAL',JSON.stringify(r)); }catch(_){ } console.log('ERR',e.message); process.exit(1); });
