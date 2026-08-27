// map interaction sweep: tap ALL 10 REGIONS nodes at 390x844 with real touchscreen taps (map opened via real rail tap).
// sweep A = fresh gates (day1, no troops/banners/shrine) - expect flavor lines + disabled pills.
// sweep B = cheat-granted gates (day3, 20 troops, 2 banners, shrine, rich) - expect every action pill enabled.
// probe cheats labeled inline below. Bottom-panel clips montaged per sweep for visual verification.
const puppeteer=require('puppeteer-core');
const FILE=process.env.FILE||'index-v115.html';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',protocolTimeout:600000,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage();
 await p.setViewport({width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error'&&!/404/.test(m.text()))errs.push('console:'+m.text());});
 await p.goto('http://localhost:8945/'+FILE+'?new=1',{waitUntil:'load',timeout:120000});
 let t0=Date.now(); while(Date.now()-t0<120000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 const r={vp:'390x844'};
 for(let i=0;i<5;i++){ await p.touchscreen.tap(195,422); await sleep(350); }   // through the story
 await p.evaluate(()=>{ S.tut=QUESTS.length; });   // cheat: clear the quest rail so it does not cover the map panel
 const wb=await p.evaluate(()=>warBtnR());
 await p.touchscreen.tap(wb.x+wb.w/2, wb.y+wb.h/2); await sleep(500);
 r.mapOpen=await p.evaluate(()=>S.mode);
 const sweep=async(tag)=>{
  const out={};
  for(const id of ['mud','cauldron','ironbeard','ratkin','bloom','karrow','choir','vellum','ogre','vanto']){
   const pt=await p.evaluate(rid=>{ const R=REGIONS.find(x=>x.id===rid); const q=mpt(R); return {x:q[0],y:q[1]}; }, id);
   await p.touchscreen.tap(Math.round(pt.x),Math.round(pt.y)); await sleep(400);
   out[id]=await p.evaluate(rid=>{ const R=REGIONS.find(x=>x.id===rid);
    return {sel:mapSel, ok:mapSel===rid}; }, id);
   await p.screenshot({path:'clips115/'+tag+'-'+id+'.png', clip:{x:0,y:584,width:390,height:260}});
  }
  return out; };
 r.sweepA=await sweep('A');
 // cheat: grant every gate - day 3, troops, 2 banners, a shrine, resources (probe cheats)
 await p.evaluate(()=>{ S.day=3; S.war.troops=20; S.war.banners=['ratkin','ironbeard'];
  S.buildings.push({key:'shrine',tx:2,ty:2,pop:1,hp:1,t:0}); S.res.food=50; S.res.gold=20; });
 r.sweepB=await sweep('B');
 r.errs=errs;
 console.log(JSON.stringify(r));
 await b.close();
})().catch(e=>{ console.error('FATAL',e.message); process.exit(1); });
