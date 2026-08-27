const puppeteer=require('puppeteer-core');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',protocolTimeout:600000,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage();
 await p.setViewport({width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true});
 await p.goto('http://localhost:8945/index-v114.html?new=1',{waitUntil:'load',timeout:120000});
 let t0=Date.now(); while(Date.now()-t0<120000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 for(let i=0;i<5;i++){ await p.touchscreen.tap(195,422); await sleep(300); }
 const r={};
 r.expr=await p.evaluate(()=>{ const R=REGIONS.find(x=>x.id==='ratkin'); return JSON.stringify('RAID '+R.name.toUpperCase().replace('THE ','')); });
 await p.evaluate(()=>{ window.DRAWN=[]; const t=txt3; window.txt3=function(s){ if(typeof s==='string'&&s.indexOf('RAID')===0) DRAWN.push(s); return t.apply(null,arguments); };
  S.tut=QUESTS.length; S.war.troops=20; deskTap(warBtnR()); });
 await sleep(300);
 await p.evaluate(()=>{ const R=REGIONS.find(x=>x.id==='ratkin'); const q=mpt(R); handleTap3(q[0],q[1]); });
 await sleep(500);
 r.drawn=await p.evaluate(()=>DRAWN.slice());
 console.log(JSON.stringify(r));
 await b.close();
})().catch(e=>{ console.error('FATAL',e.message); process.exit(1); });
