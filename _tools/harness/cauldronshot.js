// correct cauldron frame for v115: fresh boot, map open via real rail tap, cauldron selected via real tap,
// panel shot ONLY after asserting mode==='war' && mapSel==='cauldron' (the pilltap115 shot raced the raid battle).
const puppeteer=require('puppeteer-core');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',protocolTimeout:600000,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage();
 await p.setViewport({width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error'&&!/404/.test(m.text()))errs.push('console:'+m.text());});
 await p.goto('http://localhost:8945/index-v115.html?new=1',{waitUntil:'load',timeout:120000});
 let t0=Date.now(); while(Date.now()-t0<120000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 for(let i=0;i<5;i++){ await p.touchscreen.tap(195,422); await sleep(300); }
 await p.evaluate(()=>{ S.tut=QUESTS.length; });
 const wb=await p.evaluate(()=>warBtnR());
 await p.touchscreen.tap(wb.x+wb.w/2, wb.y+wb.h/2); await sleep(500);
 const pt=await p.evaluate(()=>{ const R=REGIONS.find(x=>x.id==='cauldron'); const q=mpt(R); return {x:q[0],y:q[1]}; });
 await p.touchscreen.tap(Math.round(pt.x),Math.round(pt.y)); await sleep(500);
 const st=await p.evaluate(()=>({mode:S.mode, sel:mapSel}));
 if(st.mode!=='war'||st.sel!=='cauldron'){ console.log(JSON.stringify({abort:'wrong state',st})); await b.close(); process.exit(1); }
 await p.screenshot({path:'v115-cauldron2.png', clip:{x:0,y:584,width:390,height:260}});
 console.log(JSON.stringify({ok:true,st,errs}));
 await b.close();
})().catch(e=>{ console.error('FATAL',e.message); process.exit(1); });
