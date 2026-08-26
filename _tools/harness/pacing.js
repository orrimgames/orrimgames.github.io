// economy pacing audit: scripted first-time player, one full day cycle, sim stepped at 0.05s substeps (no render)
// harvest yield replicated from handleTap3 ground-tap block (+2, shroom consumed w/ regrow 14-26s, tapCombo++)
const puppeteer=require('puppeteer-core');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage();
 await p.setViewport({width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8945/'+(process.env.FILE||'index-v110.html')+'?new=1',{waitUntil:'load',timeout:120000});
 let t0=Date.now(); while(Date.now()-t0<120000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 const out=await p.evaluate(()=>{
  S.story=null; S.started=true; S.introZoom=0; S.elderHush=1; S.mode='village';
  const P={t:0,readT:5,tapT:0,taps:0,ev:[],samples:[],waits:[],curW:null,label:'reading'};
  const _spawn=spawnGob; spawnGob=function(...a){ const r=_spawn(...a); P.ev.push({t:P.t,ev:'spawn',gobs:S.gobs.length}); return r; };
  function harvest(pref){
   const order=pref==='food'?['shroom','tree','rock']:pref==='wood'?['tree','shroom','rock']:pref==='rock'?['rock','tree','shroom']:['tree','shroom','rock'];
   for(const k of order){
    const pred=k==='shroom'?(c=>c.deco==='shroom'):(k==='tree'?(c=>c.deco==='tree'):(c=>c.deco==='rock'||c.t===3));
    const t=findTile(pred,Math.round(CAM.tx),Math.round(CAM.ty));
    if(t){ const c=tiles[t[1]][t[0]];
     const kind2=c.deco==='tree'?'wood':(c.deco==='shroom'?'food':'stone');
     addRes(kind2,2);
     if(kind2==='food'){ c.deco=null; c.regrow=rnd(26,14); }
     S.tapCombo++; P.taps++; return kind2; } }
   return null; }
  function spot(w,h){ const hp=hallPos();
   for(let r=2;r<22;r++) for(let a=0;a<16;a++){ const tx=Math.round(hp[0]+Math.cos(a/16*6.283)*r-w/2), ty=Math.round(hp[1]+2+Math.sin(a/16*6.283)*r-h/2);
    if(areaOK(tx,ty,w,h)) return [tx,ty]; } return null; }
  function build(key){ const T=BT[key];
   if(!canPay(T.cost)) return 'cantpay';
   const s=spot(T.w,T.h); if(!s) return 'nospace';
   return placeBuilding(key,s[0],s[1])?'built':'fail'; }
  function think(dt){
   P.t+=dt;
   if(P.readT>0){ P.readT-=dt; return 'reading'; }
   P.tapT-=dt;
   if(S.tut<QUESTS.length){
    if(S.tut===0){ if(P.tapT<=0){ P.tapT=1.2; if(!harvest('any')) return 'wait:no tiles'; } return 'tap land'; }
    if(S.tut===1){ if(S.buildings.some(b=>b.key==='farm')) return 'read';
      const r=build('farm');
      if(r==='cantpay'){ if(P.tapT<=0){ P.tapT=1.2; harvest(S.res.wood<25?'wood':'food'); } return 'tap for farm'; }
      if(r==='built'){ P.readT=3; return 'built farm'; } return 'wait:'+r; }
    if(S.tut===2){ if(S.buildings.filter(b=>b.key==='hut').length>=3) return 'read';
      const r=build('hut');
      if(r==='cantpay'){ if(P.tapT<=0){ P.tapT=1.2; harvest('wood'); } return 'tap for hut'; }
      if(r==='built'){ P.readT=2; return 'built hut'; } return 'wait:'+r; }
    if(S.tut===3){ S.metGob=1; P.readT=4; return 'met goblin'; }
    if(S.tut===4){ S.sawMap=1; P.readT=4; return 'saw world'; } }
   const gi=goalIdx(); if(gi<0) return 'wait:goals done';
   const gk=gi;
   // goal-directed: build what the rail asks when affordable, tap when short, else wait with a reason
   if(gk===0){ // 8 goblins
     if(S.gobs.length>=8) return 'read';
     if(S.gobs.length>=S.popCap){ const r=build('hut');
       if(r==='cantpay'){ if(P.tapT<=0){ P.tapT=1.2; harvest('wood'); } return 'tap for hut'; }
       if(r==='built'){ P.readT=2; return 'built hut'; } return 'wait:'+r; }
     if(S.res.food<30){ if(P.tapT<=0){ P.tapT=1.2; if(!harvest('food')) return 'wait:no shrooms'; } return 'tap food'; }
     return 'wait:breeding'; }
   if(gk===1||gk===2){ const key=gk===1?'quarry':'mine';
     if(S.buildings.some(b=>b.key===key)) return 'read';
     const r=build(key);
     if(r==='cantpay'){ if(P.tapT<=0){ P.tapT=1.2; harvest(S.res.stone<BT[key].cost.stone?'rock':'wood'); } return 'tap for '+key; }
     if(r==='built'){ P.readT=3; return 'built '+key; } return 'wait:'+r; }
   if(gk===3){ if(S.res.food>=300) return 'read';
     if(!S.buildings.some(b=>b.key==='farm')){ const r=build('farm');
       if(r==='cantpay'){ if(P.tapT<=0){ P.tapT=1.2; harvest('wood'); } return 'tap for farm'; }
       if(r==='built'){ P.readT=3; return 'built farm'; } return 'wait:'+r; }
     if(P.tapT<=0){ P.tapT=1.2; if(!harvest('food')) return 'wait:no shrooms'; } return 'tap food'; }
   return 'wait:goal '+gk+' ('+GOALS[gk].short+')';
  }
  let lastTut=S.tut, lastGoal=S.goalDone||0, lastDay=S.day, stallStart=null;
  const dt=0.05; let steps=0, sampled=0;
  while(S.day<1 && steps<60000){
   tickClock(dt); updateWorld(dt);
   const label=think(dt);
   // wait-stretch tracking
   if(label.indexOf('wait:')===0){ if(!P.curW) P.curW={why:label.slice(5), t0:P.t}; }
   else if(P.curW){ if(P.t-P.curW.t0>10) P.waits.push({why:P.curW.why, t0:Math.round(P.curW.t0), dur:Math.round(P.t-P.curW.t0)}); P.curW=null; }
   if(S.tut!==lastTut){ P.ev.push({t:Math.round(P.t), ev:'quest '+(S.tut-1)+' done: '+QUESTS[S.tut-1].short}); lastTut=S.tut; }
   if((S.goalDone||0)!==lastGoal){ P.ev.push({t:Math.round(P.t), ev:'goal done: '+GOALS[lastGoal].short}); lastGoal=S.goalDone||0; }
   if(steps%300===0){ P.samples.push({t:Math.round(P.t), dayT:+S.dayT.toFixed(2), food:Math.round(S.res.food), wood:Math.round(S.res.wood), stone:Math.round(S.res.stone), gold:Math.round(S.res.gold), gobs:S.gobs.length, cap:S.popCap, tut:S.tut, goal:S._goal, doing:label}); }
   steps++;
  }
  if(P.curW) P.waits.push({why:P.curW.why+' (open)', t0:Math.round(P.curW.t0), dur:Math.round(P.t-P.curW.t0)});
  return {steps, simT:Math.round(P.t), taps:P.taps, ev:P.ev, waits:P.waits.filter(w=>w.dur>10), samples:P.samples.filter((s,i)=>i%4===0||s.doing.indexOf('wait')===0), nightSamples:P.samples.filter(s=>s.dayT<0.24||s.dayT>0.76).length};
 });
 console.log(JSON.stringify({out,errs}));
 await b.close();
})().catch(e=>{console.log('ERR',e.message);process.exit(1);});
