const puppeteer=require('puppeteer-core');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage();
 const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 for(const vp of [{w:390,h:844,d:2,t:true,n:'m'},{w:1920,h:1080,d:1,t:false,n:'d'}]){
  await p.setViewport({width:vp.w,height:vp.h,deviceScaleFactor:vp.d,isMobile:vp.t,hasTouch:vp.t});
  await p.goto('http://localhost:8945/index-v110.html?new=1',{waitUntil:'load',timeout:120000});
  let t0=Date.now(); while(Date.now()-t0<90000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
  await p.evaluate(()=>{ S.story=null; S.started=true; S.introZoom=0; S.tut=QUESTS.length; S.elderHush=1; S.mode='village'; S.dayT=0.4; S.res={food:9000,wood:9000,stone:9000,gold:9000}; });
  await sleep(2500);
  await p.screenshot({path:'bar109-'+vp.n+'.png', clip:{x:0,y:vp.h-130,width:vp.w,height:130}});
 }
 console.log(JSON.stringify({errs}));
 await b.close();
})().catch(e=>{console.log('ERR',e.message);process.exit(1);});
