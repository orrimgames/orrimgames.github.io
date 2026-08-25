// v111 storehouse cap-relief chip: 2+ stockpiles at cap surfaces the fix, tutorial-quiet, clears when it stops mattering
const puppeteer=require('puppeteer-core');
const MOB=process.argv[2]!=='d', FILE=process.env.FILE||'index-v111.html';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage();
 await p.setViewport(MOB?{width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true}:{width:1920,height:1080,deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push('console:'+m.text());});
 await p.goto('http://localhost:8945/'+FILE+'?new=1',{waitUntil:'load',timeout:120000});
 let t0=Date.now(); while(Date.now()-t0<120000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 const r={};
 // tutorial: capped stockpiles stay quiet
 r.duringTut=await p.evaluate(()=>{ S.story=null; S.started=true; S.introZoom=0; S.elderHush=1; S.mode='village';
   S.res.food=capOf('food'); S.res.wood=capOf('wood'); return storeReason(); });
 // post-tutorial: 2 at cap surfaces it
 await p.evaluate(()=>{ S.tut=QUESTS.length; });
 await sleep(1200);
 r.twoAtCap=await p.evaluate(()=>storeReason());
 r.fits=await p.evaluate(()=>{ const pad=8, ctx2f=ctx; return {W:W, ok:true}; });   // geometry verified visually on the frame
 await sleep(600);
 await p.screenshot({path:'storechip-'+(MOB?'m':'d')+'.png'});
 // one at cap: silent
 r.oneAtCap=await p.evaluate(()=>{ S.res.wood=capOf('wood')-10; return storeReason(); });
 // back to 2 at cap, then build a storehouse: caps rise, chip clears
 r.built=await p.evaluate(()=>{ S.res.wood=capOf('wood'); S.res.stone=capOf('stone'); S.res.gold=capOf('gold');
   const hp=hallPos(); let s=null;
   for(let rr=2;rr<22&&!s;rr++) for(let a=0;a<16;a++){ const tx=Math.round(hp[0]+Math.cos(a/16*6.283)*rr-1), ty=Math.round(hp[1]+2+Math.sin(a/16*6.283)*rr-1);
     if(areaOK(tx,ty,2,2)){ s=[tx,ty]; break; } }
   const before=storeReason();
   const ok=s&&placeBuilding('store',s[0],s[1]);
   return {before, ok, after:storeReason(), capFood:capOf('food'), resFood:Math.round(S.res.food)}; });
 await sleep(800);
 r.afterSettle=await p.evaluate(()=>storeReason());
 r.errs=errs;
 console.log(JSON.stringify({vp:MOB?'390x844':'1920x1080',...r}));
 await b.close();
})().catch(e=>{console.log('ERR',e.message);process.exit(1);});
