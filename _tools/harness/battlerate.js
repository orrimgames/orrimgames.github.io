// stalemate rate: 10x 5v9 ratkin raids, different RNG; capture the stuck state when a battle outlives 120 sim-seconds
const puppeteer=require('puppeteer-core');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage();
 await p.setViewport({width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8945/index-v111.html?new=1',{waitUntil:'load',timeout:120000});
 let t0=Date.now(); while(Date.now()-t0<120000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 const out=await p.evaluate(()=>{
  S.story=null; S.started=true; S.introZoom=0; S.elderHush=1; S.mode='village';
  const tries=[];
  for(let a=0;a<10;a++){
   // reset war state and run one raid
   S.war.troops=5; S.war.result=null; S.gobs=S.gobs.filter(g=>!g.side); S.buildings=S.buildings.filter(b=>!b._foe);
   startBattle(RIVALS[0]);
   let simT=0; const dt=0.05; let resolved=true;
   for(let i=0;i<2400;i++){ updateBattle(dt); simT+=dt; if(S.war.result) break; }
   if(!S.war.result){ resolved=false;
     tries.push({a, stuck:true, simT:Math.round(simT),
      units:S.gobs.map(g=>({side:g.side,hp:Math.round(g.hp),x:+g.x.toFixed(1),y:+g.y.toFixed(1),rout:!!g.rout,tgt:g.tgt?1:0,sw:!!g.sw})),
      bld:S.buildings.map(b=>({k:b.key,hp:Math.round(b.hp),tx:b.tx,ty:b.ty})).filter(b=>b.k==='wall'||b.k==='hall'||b.k==='tower')});
     // force-end so the next attempt can run
     endBattle(false);
   } else tries.push({a, stuck:false, simT:Math.round(simT), win:S.war.result.win});
   S.mode='village';
  }
  return tries;
 });
 console.log(JSON.stringify({out,errs}));
 await b.close();
})().catch(e=>{console.log('ERR',e.message);process.exit(1);});
