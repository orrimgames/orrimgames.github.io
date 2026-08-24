// which fixed-width pills can't hold the text they draw? measure with the same txtW3 the game draws with
const puppeteer=require('puppeteer-core');
const MOB=process.argv[2]==='m', FILE=process.env.FILE||'index-v104.html';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage();
 await p.setViewport(MOB?{width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true}:{width:1920,height:1080,deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8945/'+FILE+'?new=1',{waitUntil:'load',timeout:120000});
 let t0=Date.now(); while(Date.now()-t0<90000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 const r=await p.evaluate(()=>{
  const rows=[];
  const add=(name,rect,labels)=>{ let mx=0,worst=''; for(const l of labels){ const w=txtW3(l[0],l[1],l[2]); if(w>mx){mx=w;worst=l[0];} }
    rows.push({name,w:Math.round(rect.w),need:Math.round(mx),slackEachSide:Math.round((rect.w-mx)/2),worst,over:mx>rect.w-16}); };
  add('shareR',shareR(),[['SHARE BROOD',13,900]]);
  add('warBtnR',warBtnR(),[['WORLD',11.5,800],[(S.war.troops||0)+' warriors',10,600]]);
  add('walkBtnR',walkBtnR(),[['WALK IN',11.5,800],['first person',10,600]]);
  add('chronBtnR',chronBtnR(),[['CHRONICLE',11.5,800],['nothing yet',10,600],['42 written',10,600]]);
  add('backR',backR(),[['BACK',13,800]]);
  add('sendR',sendR(),[['SEND WARRIORS',13,800]]);
  add('rallyR',rallyR(),[['RALLY',15,900]]);
  add('fireR',fireR(),[['FIRE',15,900]]);
  add('retreatR',retreatR(),[['RETREAT',12,800]]);
  add('resultBtnR',resultBtnR(),[['CONTINUE',14,900]]);
  add('fightR',fightR(),[['FIGHT',14,900]]);
  add('sailBtnR',sailBtnR(),[['SAIL',13,800]]);
  add('cancelR',cancelR(),[['CANCEL',11,800]]);
  return rows;
 });
 console.log(JSON.stringify({vp:MOB?'390x844':'1920x1080',rows:r,errs},null,0));
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
