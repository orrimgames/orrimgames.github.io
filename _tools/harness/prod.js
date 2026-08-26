// production loops audit: farm->farmer->food, lumber->woodcutter->tree->stump->regrow, quarry->miner->rock->stone, mine->digger->gold. Job auto-assign, haul income, persistence. 390x844, village-mode updateWorld stepper.
const puppeteer=require('puppeteer-core');
const FILE=process.env.FILE||'index-v113.html';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',protocolTimeout:600000,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage();
 await p.setViewport({width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error'&&!/404/.test(m.text()))errs.push('console:'+m.text());});
 await p.goto('http://localhost:8945/'+FILE+'?new=1',{waitUntil:'load',timeout:120000});
 let t0=Date.now(); while(Date.now()-t0<120000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 const r={vp:'390x844'};
 r.setup=await p.evaluate(()=>{ S.story=null; S.started=true; S.introZoom=0; S.tut=QUESTS.length; S.elderHush=1; S.mode='village'; S.dayT=0.4;
  S.res.food=200; S.res.wood=300; S.res.stone=200; S.res.gold=50;
  const ok={}; let placed=false;
  for(const key of ['farm','lumber','quarry','mine']){ placed=false;
   for(let x=6;x<26&&!placed;x+=2) for(let y=6;y<26&&!placed;y+=2) placed=placeBuilding(key,x,y);
   ok[key]=placed; }
  while(S.gobs.length<9) spawnGob(SITE.x+Math.random()*4-2, SITE.y+3+Math.random()*2, true);
  return {placed:ok, gobs:S.gobs.length, buildings:S.buildings.map(b=>b.key), hall:!!S.buildings.some(b=>b.key==='hall')}; });
 // let buildings finish (pop<1 -> 1) and job manager assign, real time briefly
 await sleep(2500);
 r.jobs=await p.evaluate(()=>{ const c={}; for(const g of S.gobs) c[g.job]=(c[g.job]||0)+1;
  return {jobs:c, pops:S.buildings.map(b=>b.key+':'+(+b.pop.toFixed(2)))}; });
 // production sim: chunked updateWorld, sample states + resources
 await p.evaluate(()=>{ window.PRD_step=function(n){ const dt=0.05; const seen={};
  for(let i=0;i<n;i++){ updateWorld(dt);
   for(const g of S.gobs){ if(g.state==='dig'||g.state==='mine'||g.state==='chop'||g.state==='sow'||g.state==='reap'||g.state==='tend') seen[g.state]=(seen[g.state]||0)+1; } }
  return {seen, res:{food:Math.round(S.res.food),wood:Math.round(S.res.wood),stone:Math.round(S.res.stone),gold:Math.round(S.res.gold)},
   stumps:(()=>{let c=0;for(let y=0;y<MAP;y++)for(let x=0;x<MAP;x++)if(tiles[y][x].deco==='stump')c++;return c;})(),
   regrowing:(()=>{let c=0;for(let y=0;y<MAP;y++)for(let x=0;x<MAP;x++)if(tiles[y][x].regrow)c++;return c;})()}; };
  return true; });
 r.res0=await p.evaluate(()=>({food:Math.round(S.res.food),wood:Math.round(S.res.wood),stone:Math.round(S.res.stone),gold:Math.round(S.res.gold)}));
 r.sim=await p.evaluate(()=>PRD_step(2400));   // 120 sim-seconds
 r.income={wood:r.sim.res.wood-r.res0.wood, stone:r.sim.res.stone-r.res0.stone, gold:r.sim.res.gold-r.res0.gold, food:r.sim.res.food-r.res0.food};
 // persistence: resources + buildings survive; jobs reassign after reload
 await p.evaluate(()=>saveGame());
 await p.goto('http://localhost:8945/'+FILE,{waitUntil:'load',timeout:120000});
 t0=Date.now(); while(Date.now()-t0<120000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 r.afterReload=await p.evaluate(()=>({res:{food:Math.round(S.res.food),wood:Math.round(S.res.wood),stone:Math.round(S.res.stone),gold:Math.round(S.res.gold)},
  buildings:S.buildings.length, mines:S._mines&&S._mines.length}));
 await sleep(2000);
 r.jobsAfter=await p.evaluate(()=>{ const c={}; for(const g of S.gobs) c[g.job]=(c[g.job]||0)+1; return c; });
 r.errs=errs;
 console.log(JSON.stringify(r));
 await b.close();
})().catch(e=>{ try{ console.log('PARTIAL',JSON.stringify(r)); }catch(_){ } console.log('ERR',e.message); process.exit(1); });
