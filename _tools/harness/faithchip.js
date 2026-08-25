// v107: faith joins the HUD chips once the village stockpiles it - shrine risen or faith held; hidden before
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
 await p.evaluate(()=>{ S.story=null; S.started=true; S.introZoom=0; S.elderHush=1; S.mode='village'; S.dayT=0.4; });
 await sleep(400);
 const before=await p.evaluate(()=>({faith:S.faith, shrine:hasShrine(), keyHasFaith:staticUIKey().split('|').length}));
 await p.screenshot({path:'faith-none-'+(MOB?'m':'d')+'.png', clip:{x:0,y:0,width:MOB?390:820,height:52}});
 // a shrine rises and faith accrues: the chip must appear on the next static render, no res tick needed
 await p.evaluate(()=>{ S.tut=QUESTS.length; S.res={food:9000,wood:9000,stone:9000,gold:9000};
   const b2=makeBuilding('shrine',20,20); b2.pop=1; b2.t=9; S.buildings.push(b2); S.faith=12.4; });
 let appeared=false;
 for(let i=0;i<20;i++){ await sleep(400); appeared=await p.evaluate(()=>staticUIKey().split('|').slice(-2).join('|')==='12|1'); if(appeared) break; }
 const after=await p.evaluate(()=>({shrine:hasShrine(), faith:Math.floor(S.faith)}));
 await p.screenshot({path:'faith-chip-'+(MOB?'m':'d')+'.png', clip:{x:0,y:0,width:MOB?390:820,height:52}});
 console.log(JSON.stringify({vp:MOB?'390x844':'1920x1080',before,appeared,after,errs}));
 await b.close();
})().catch(e=>{console.log('ERR',e.message);process.exit(1);});
