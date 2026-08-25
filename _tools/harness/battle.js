// battle smoke: real taps from the WORLD button to a won raid and home again - deploy, dragonfire, rally, result, stash restore, persistence
const puppeteer=require('puppeteer-core');
const MOB=process.argv[2]!=='d', FILE=process.env.FILE||'index-v110.html';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage();
 await p.setViewport(MOB?{width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true}:{width:1920,height:1080,deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push('console:'+m.text());});
 const tap=async(x,y)=>{ if(MOB) await p.touchscreen.tap(x,y); else await p.mouse.click(x,y); };
 await p.goto('http://localhost:8945/'+FILE+'?new=1',{waitUntil:'load',timeout:120000});
 let t0=Date.now(); while(Date.now()-t0<90000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 await p.evaluate(()=>{ S.story=null; S.started=true; S.introZoom=0; S.tut=QUESTS.length; S.elderHush=1; S.mode='village'; S.dayT=0.4;
   S.res={food:9000,wood:9000,stone:9000,gold:9000}; S.faith=30; S.war.troops=10;
   const bk=makeBuilding('barracks',22,22); bk.pop=1; bk.t=9; S.buildings.push(bk); });
 await sleep(600);
 // WORLD -> tap the ratkin region -> SEND (all real taps)
 const wb=await p.evaluate(()=>warBtnR()); await tap(wb.x+wb.w/2, wb.y+wb.h/2); await sleep(600);
 const rg=await p.evaluate(()=>{ const R=REGIONS.find(r=>r.rival==='ratkin'); const q=mpt(R); return {x:q[0],y:q[1]}; });
 await tap(rg.x, rg.y); await sleep(600);
 const sel=await p.evaluate(()=>mapSel);
 const sr=await p.evaluate(()=>sendR()); await tap(sr.x+sr.w/2, sr.y+sr.h/2); await sleep(1200);
 const inBattle=await p.evaluate(()=>({mode:S.mode, foe:S.war.foe&&S.war.foe.id, us:S.gobs.filter(g=>g.side==='us').length, them:S.gobs.filter(g=>g.side==='foe').length, towers:S.buildings.filter(b=>b.key==='tower').length, deployed:S.war.deployed}));
 // dragonfire: tap DRAGONFIRE then aim at the ground (real taps)
 const fr=await p.evaluate(()=>fireR()); await tap(fr.x+fr.w/2, fr.y+fr.h/2); await sleep(400);
 await p.evaluate(()=>{ let q=null;
   for(let y=Math.round(H*0.15);y<H*0.7&&!q;y+=24){ const t=rayGround(W/2,y); if(t) q=[W/2,y]; }   // first screen row that is real ground, north of the rail
   window.__aim=q; });
 const aim=await p.evaluate(()=>window.__aim);
 if(aim) await tap(aim[0],aim[1]); await sleep(600);
 const fire=await p.evaluate(()=>({faith:Math.floor(S.faith), fired:!!S.war.firedOnce}));
 // rally (real tap)
 const rr=await p.evaluate(()=>rallyR()); await tap(rr.x+rr.w/2, rr.y+rr.h/2); await sleep(300);
 const rallied=await p.evaluate(()=>!!S.war.rallyUsed);
 await p.screenshot({path:'battle-mid-'+(MOB?'m':'d')+'.png'});
 // make the win quick and certain, then wait for the result card
 await p.evaluate(()=>{ for(const g of S.gobs) if(g.side==='us'){ g.atk=500; g.hp=Math.max(g.hp,400); } });
 let result=null;
 for(let i=0;i<60;i++){ result=await p.evaluate(()=>S.war.result?{win:S.war.result.win,lost:S.war.result.lost,surv:S.war.result.survivors}:null); if(result) break; await sleep(1000); }
 await p.screenshot({path:'battle-result-'+(MOB?'m':'d')+'.png'});
 const afterWin=await p.evaluate(()=>({banners:S.war.banners.slice(), faith:Math.floor(S.faith), chron:S.chronicle.length, share:S._shareT>0}));
 // BACK HOME (real tap) -> village restored from the stash
 const br=await p.evaluate(()=>resultBtnR()); await tap(br.x+br.w/2, br.y+br.h/2); await sleep(1200);
 const home=await p.evaluate(()=>({mode:S.mode, buildings:S.buildings.length, gobs:S.gobs.filter(g=>!g.soldier).length, troops:S.war.troops}));
 // reload: the banner must survive
 await p.goto('http://localhost:8945/'+FILE,{waitUntil:'load',timeout:120000});
 t0=Date.now(); while(Date.now()-t0<90000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 const persisted=await p.evaluate(()=>({banners:(S.war&&S.war.banners)||[], mode:S.mode, buildings:S.buildings.length}));
 console.log(JSON.stringify({vp:MOB?'390x844':'1920x1080',sel,inBattle,fire,rallied,result,afterWin,home,persisted,errs}));
 await b.close();
})().catch(e=>{console.log('ERR',e.message);process.exit(1);});
