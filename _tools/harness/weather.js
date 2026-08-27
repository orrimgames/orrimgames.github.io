// v116 weather verification: dawn rain roll now sets wx.left countdown (45-95), tickWeather decrements in
// updateWorld dt, want clears at 0, rain lerps down to 0. Reload resets (wx not in save pack).
// Stepper drives real tickClock/updateWorld; per-dawn heartbeats. No cheats except S.tut clear. 390x844.
const puppeteer=require('puppeteer-core');
const FILE=process.env.FILE||'index-v116.html';
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
  window.TOASTS=[]; const t2=toast2; window.toast2=function(m){ TOASTS.push(m); return t2(m); };
  window.W_step=function(n){ const dt=0.05; let i=0; while(i<n){ tickClock(dt); updateWorld(dt); i++; }
   return {day:S.day, want:S.wx.want, rain:+S.wx.rain.toFixed(3), left:(S.wx.left==null?null:+S.wx.left.toFixed(1))}; }; });
 r.dawns=[];
 let rolled=null;
 for(let d=0;d<12&&!rolled;d++){
  const st=await p.evaluate(()=>{ const d0=S.day; let guard=0, s;
   while(S.day===d0&&guard<40){ s=W_step(4000); guard++; } return s; });
  r.dawns.push(st); console.error('dawn',d,JSON.stringify(st));
  if(st.want===1) rolled=st;
 }
 r.rainRolled=rolled;
 if(rolled){
  r.toastSeen=await p.evaluate(()=>TOASTS.filter(m=>/rain/i.test(m)));
  r.leftInWindow=rolled.left>=45&&rolled.left<=95;
  let up=null;
  for(let i=0;i<20;i++){ const s=await p.evaluate(()=>W_step(400)); if(s.rain>0.3){ up=s; break; } }
  r.rainUp=up; console.error('up',JSON.stringify(up));
  await sleep(400); await p.screenshot({path:'weather-rain.png'});
  let down=null;
  for(let i=0;i<120;i++){ const s=await p.evaluate(()=>W_step(400)); if(s.want===0&&s.rain===0){ down=s; break; } }
  r.rainDown=down; console.error('down',JSON.stringify(down));
 }
 await p.evaluate(()=>saveGame());
 await p.goto('http://localhost:8945/'+FILE,{waitUntil:'load',timeout:120000});
 t0=Date.now(); while(Date.now()-t0<120000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 r.afterReload=await p.evaluate(()=>({want:S.wx.want, rain:S.wx.rain, left:S.wx.left}));
 r.errs=errs;
 console.log(JSON.stringify(r));
 await b.close();
})().catch(e=>{ console.error('FATAL',e.message); process.exit(1); });
