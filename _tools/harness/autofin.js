// story auto-finish timing: how long does the cold open actually take headless, and does it land clean?
const puppeteer=require('puppeteer-core');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage();
 await p.setViewport({width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8945/index-v111.html?new=1',{waitUntil:'load',timeout:120000});
 let t0=Date.now(); while(Date.now()-t0<120000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 await p.touchscreen.tap(195,450); await sleep(500);
 const tStart=Date.now(), beats=[];
 let waited=0, done=false;
 while(waited<150000){ const s=await p.evaluate(()=>({story:!!S.story, beat:S.story?S.story.beat:-1, started:S.started, fps:+G.fps.toFixed(1)}));
   if(!beats.length||beats[beats.length-1].beat!==s.beat) beats.push({t:Math.round((Date.now()-tStart)/1000), beat:s.beat});
   if(!s.story&&s.started){ done=true; break; } await sleep(2000); waited+=2000; }
 console.log(JSON.stringify({done, waitedS:Math.round((Date.now()-tStart)/1000), beats, errs}));
 await b.close();
})().catch(e=>{console.log('ERR',e.message);process.exit(1);});
