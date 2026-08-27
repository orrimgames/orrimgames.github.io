// v115 verification: every enabled map pill fires its action through warTap's new mapPill() authority,
// every drawn string checked for 'undefined', every enabled pill label asserted to fit its widened sendR.
// Real touchscreen taps at sendR() center. Cheats (labeled): day/troops/banners/shrine/resources grants.
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
 const r={vp:'390x844',file:FILE};
 for(let i=0;i<5;i++){ await p.touchscreen.tap(195,422); await sleep(300); }
 await p.evaluate(()=>{ S.tut=QUESTS.length;
  window.UNDEF=0; const t=txt3; window.txt3=function(s){ if(s===undefined||s==='undefined') UNDEF++; return t.apply(null,arguments); };
  S.day=3; S.war.troops=20; S.war.banners=['ratkin','ironbeard'];   // cheat: grant all gates
  S.buildings.push({key:'shrine',tx:2,ty:2,pop:1,hp:1,t:0}); S.res.food=50; S.res.gold=20;
  deskTap(warBtnR()); });
 await sleep(400);
 const sel=async(id)=>{ await p.evaluate(rid=>{ const R=REGIONS.find(x=>x.id===rid); const q=mpt(R); handleTap3(q[0],q[1]); }, id); await sleep(300); };
 const tapPill=async()=>{ const s2=await p.evaluate(()=>sendR()); await p.touchscreen.tap(Math.round(s2.x+s2.w/2),Math.round(s2.y+s2.h/2)); await sleep(450); };
 const fit=async()=>p.evaluate(()=>{ const L=mapPill(); if(!L) return null; const s2=sendR();
  return {t:L.t, pillW:s2.w, labelW:Math.round(txtW3(L.t,L.sz,L.wt)), fits:txtW3(L.t,L.sz,L.wt)<=s2.w}; });
 r.pills={};
 // treaty
 await sel('karrow'); r.pills.karrow=await fit(); await tapPill();
 r.treatyFired=await p.evaluate(()=>S.war.treaty===true);
 // school
 await sel('vellum'); r.pills.vellum=await fit(); await tapPill();
 r.schoolFired=await p.evaluate(()=>({school:S.school, scholar:!!S.scholar}));
 // ogre offering
 await sel('ogre'); r.pills.ogre=await fit(); await tapPill();
 r.offerFired=await p.evaluate(()=>({fed:S.ogre.fed, food:Math.round(S.res.food), gold:Math.round(S.res.gold)}));
 // vanto contract
 await sel('vanto'); r.pills.vanto=await fit(); await tapPill();
 r.signFired=await p.evaluate(()=>S.vanto.signed===true);
 // raid (battle starts)
 await sel('ironbeard'); r.pills.ironbeard=await fit(); await tapPill();
 r.raidFired=await p.evaluate(()=>({mode:S.mode, foe:S.war.foe&&S.war.foe.id}));
 // cauldron status line + undefined watch
 await sel('cauldron'); await sleep(300);
 await p.screenshot({path:'v115-cauldron.png', clip:{x:0,y:584,width:390,height:260}});
 r.undefDrawn=await p.evaluate(()=>UNDEF);
 r.errs=errs;
 console.log(JSON.stringify(r));
 await b.close();
})().catch(e=>{ console.error('FATAL',e.message); process.exit(1); });
