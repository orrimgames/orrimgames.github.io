// v115 weather bug demonstration: S.t is never assigned anywhere in the game (only read at 1770/2007).
// Dawn rain roll sets wx.until = S.t + rnd -> NaN; tickWeather expiry S.t > until -> always false.
// Expect: rain rolls, until is NaN, want stays 1 through 100 step chunks (rain never ends). 390x844.
const puppeteer=require('puppeteer-core');
const FILE=process.env.FILE||'index-v115.html';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',protocolTimeout:600000,timeout:180000,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage();
 await p.setViewport({width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error'&&!/404/.test(m.text()))errs.push('console:'+m.text());});
 await p.goto('http://localhost:8945/'+FILE+'?new=1',{waitUntil:'load',timeout:120000});
 let t0=Date.now(); while(Date.now()-t0<120000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 const r={vp:'390x844',file:FILE};
 for(let i=0;i<5;i++){ await p.touchscreen.tap(195,422); await sleep(300); }
 await p.evaluate(()=>{ S.tut=QUESTS.length; S.mode='village';
  window.W_step=function(n){ const dt=0.05; let i=0; while(i<n){ tickClock(dt); updateWorld(dt); i++; }
   return {day:S.day, St:String(S.t), want:S.wx.want, rain:+S.wx.rain.toFixed(3), until:String(S.wx.until)}; }; });
 r.StUndefinedAtBoot=await p.evaluate(()=>S.t===undefined);
 let rolled=null;
 for(let d=0;d<12&&!rolled;d++){
  const st=await p.evaluate(()=>{ const d0=S.day; let guard=0,s;
   while(S.day===d0&&guard<40){ s=W_step(4000); guard++; } return s; });
  console.error('dawn',d,JSON.stringify(st));
  if(st.want===1) rolled=st;
 }
 r.rainRolled=rolled;
 if(rolled){
  r.untilIsNaN=await p.evaluate(()=>Number.isNaN(S.wx.until));
  let stuck=null;
  for(let i=0;i<100;i++){ const s=await p.evaluate(()=>W_step(400)); if(s.want===0){ stuck=s; break; } }
  r.clearedWithin100Chunks=!!stuck;
  r.after100=await p.evaluate(()=>W_step(1));
  await p.screenshot({path:'wxbug-rain.png'});
 }
 r.errs=errs;
 console.log(JSON.stringify(r));
 await b.close();
})().catch(e=>{ console.error('FATAL',e.message); process.exit(1); });
