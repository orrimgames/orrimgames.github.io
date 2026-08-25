// pacing audit 5: tier-4 probe - THREE barracks, raid at FULL 24-troop cap with fire+rally. Based on pacing4. - first raid through day 3. Scripted, sim-stepped 0.05s, chunked.
// battles run real updateBattle substeps; training is updateWar (auto, barracks); ogre via offerSteps; vanto signing needs map taps - recorded as wait, not played.
const puppeteer=require('puppeteer-core');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage();
 await p.setViewport({width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 const FILE=process.env.FILE||'index-v112.html';
 await p.goto('http://localhost:8945/'+FILE+'?new=1',{waitUntil:'load',timeout:120000});
 let t0=Date.now(); while(Date.now()-t0<120000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 await p.evaluate(()=>{
  S.story=null; S.started=true; S.introZoom=0; S.elderHush=1; S.mode='village';
  const P={t:0,readT:5,tapT:0,taps:0,ev:[],samples:[],waits:[],curW:null,lastTut:0,lastGoal:0,lastBanners:0,raids:0,lostRaids:0};
  window.PACE=P;
  P.spawn=spawnGob; spawnGob=function(...a){ const r=P.spawn(...a); P.ev.push({t:Math.round(P.t),ev:'spawn',gobs:S.gobs.length}); return r; };
  P.harvest=function(pref){
   const order=pref==='food'?['shroom','tree','rock']:pref==='wood'?['tree','shroom','rock']:pref==='rock'?['rock','tree','shroom']:['tree','shroom','rock'];
   for(const k of order){
    const pred=k==='shroom'?(c=>c.deco==='shroom'):(k==='tree'?(c=>c.deco==='tree'):(c=>c.deco==='rock'||c.t===3));
    const t=findTile(pred,Math.round(CAM.tx),Math.round(CAM.ty));
    if(t){ const c=tiles[t[1]][t[0]];
     const kind2=c.deco==='tree'?'wood':(c.deco==='shroom'?'food':'stone');
     addRes(kind2,2);
     if(kind2==='food'){ c.deco=null; c.regrow=rnd(26,14); }
     S.tapCombo++; P.taps++; return kind2; } }
   return null; };
  P.spot=function(w,h){ const hp=hallPos();
   for(let r=2;r<22;r++) for(let a=0;a<16;a++){ const tx=Math.round(hp[0]+Math.cos(a/16*6.283)*r-w/2), ty=Math.round(hp[1]+2+Math.sin(a/16*6.283)*r-h/2);
    if(areaOK(tx,ty,w,h)) return [tx,ty]; } return null; };
  P.build=function(key){ const T=BT[key];
   if(!canPay(T.cost)) return 'cantpay';
   const s=P.spot(T.w,T.h); if(!s) return 'nospace';
   return placeBuilding(key,s[0],s[1])?'built':'fail'; };
  P.buildOrTap=function(key,tapKind){ const r=P.build(key);
   if(r==='cantpay'){ if(P.tapT<=0){ P.tapT=1.2; P.harvest(tapKind||(S.res.wood<(BT[key].cost.wood||0)?'wood':'rock')); } return 'tap for '+key; }
   if(r==='built'){ P.readT=2; P.ev.push({t:Math.round(P.t),ev:'built '+key}); return 'built '+key; }
   return 'wait:'+r; };
  P.think=function(dt){
   P.t+=dt;
   if(P.readT>0){ P.readT-=dt; return 'reading'; }
   P.tapT-=dt;
   if(S.mode==='battle'){ if(S.war.result){ if(P._resT===undefined) P._resT=P.t;
     if(P.t-P._resT>2){ const w=S.war.result&&S.war.result.win; leaveBattle(); P._resT=undefined; P.battleT=0;
      if(w) P.ev.push({t:Math.round(P.t),ev:'RAID WON - banner '+S.war.banners[S.war.banners.length-1]});
      else { P.lostRaids++; P.ev.push({t:Math.round(P.t),ev:'raid LOST'}); }
      P.ev.push({t:Math.round(P.t),ev:'result dismissed'}); return 'dismiss result'; } return 'reading result'; }
    P._resT=undefined; return 'battle'; }
   if(S.tut<QUESTS.length){
    if(S.tut===0){ if(P.tapT<=0){ P.tapT=1.2; if(!P.harvest('any')) return 'wait:no tiles'; } return 'tap land'; }
    if(S.tut===1){ if(S.buildings.some(b=>b.key==='farm')) return 'read'; return P.buildOrTap('farm','wood'); }
    if(S.tut===2){ if(S.buildings.filter(b=>b.key==='hut').length>=3) return 'read'; return P.buildOrTap('hut','wood'); }
    if(S.tut===3){ S.metGob=1; P.readT=4; return 'met goblin'; }
    if(S.tut===4){ S.sawMap=1; P.readT=4; return 'saw world'; } }
   // war-leaning post-tutorial: keep the brood growing, raid in order, shrine when asked, feed the ogre each dawn
   if(S.gobs.length<S.popCap&&S.res.food<30){ if(P.tapT<=0){ P.tapT=1.2; if(!P.harvest('food')) return 'wait:no shrooms'; } return 'tap food'; }
   if(S.gobs.length>=S.popCap&&S.gobs.length<10&&S.res.wood>=20){ const r=P.build('hut'); if(r==='built'){ P.ev.push({t:Math.round(P.t),ev:'built hut'}); return 'built hut'; } }
   if(S.day>=2&&S.ogre&&!S.ogre.bound&&S.ogre.fed<3&&(S.ogre.lastDay||0)<S.day&&S.res.food>=10&&S.res.gold>=5){ offerSteps(); P.ev.push({t:Math.round(P.t),ev:'ogre bowl '+S.ogre.fed}); return 'fed ogre'; }
   const gi=goalIdx();
   if(gi===5&&!S.buildings.some(b=>b.key==='shrine')) return P.buildOrTap('shrine','rock');
   // war machine: one barracks first, a second before tier-2 raids
   const next=RIVALS.find(r=>S.war.banners.indexOf(r.id)<0);
   if(next){
    const nb=warBuildings();
    const wantB=3;
    if(nb<wantB) return P.buildOrTap('barracks','rock');
    if(S.war.troops>=24){ P.raids++; P.ev.push({t:Math.round(P.t),ev:'raid '+next.id+' (tier '+next.tier+', '+S.war.troops+' troops)'});
      const b0=S.war.banners.length; startBattle(next); P._raidB0=b0; P.battleT=0; return 'battle'; }
    return 'wait:training '+S.war.troops+'/'+(next.cost+2); }
   if(gi>=0) return 'wait:goal '+gi+' ('+GOALS[gi].short+')';
   return 'wait:goals done';
  };
  window.PACE_run=function(maxSteps){
   const dt=0.05; let n=0;
   while(S.day<3 && n<maxSteps){
    tickClock(dt);
    if(S.mode==='battle'){ const b0=S.war.banners.length;
     if(!S.war.result){ if(!S.war.rallyUsed&&(P.battleT||0)>1){ S.war.rallyUsed=true; S.war.rally=6; }
      if(S.faith>=25&&!S.war.firedOnce){ const h=S.buildings.find(b=>b.key==='hall'); if(h) dragonfireAtWorld(h.tx+0.5,h.ty+0.5); } }
     updateBattle(dt); P.battleT=(P.battleT||0)+dt;
      if(P.battleT>60&&!P.stuckDump){ P.stuckDump={t:Math.round(P.t),
        units:S.gobs.map(g=>({side:g.side,hp:Math.round(g.hp),x:+g.x.toFixed(1),y:+g.y.toFixed(1),rout:!!g.rout,die:g.die||0})),
        bld:S.buildings.map(b=>({k:b.key,hp:Math.round(b.hp),tx:b.tx,ty:b.ty}))}; P.ev.push({t:Math.round(P.t),ev:'BATTLE STUCK 60s - state dumped'}); }
      if(S.mode!=='battle'){ P.battleT=0; if(S.war.banners.length>b0) P.ev.push({t:Math.round(P.t),ev:'RAID WON - banner '+S.war.banners[S.war.banners.length-1]});
        else { P.lostRaids++; P.ev.push({t:Math.round(P.t),ev:'raid LOST'}); } } }
    else updateWorld(dt);
    const label=P.think(dt);
    if(label.indexOf('wait:')===0){ if(!P.curW) P.curW={why:label.slice(5),t0:P.t}; }
    else if(P.curW){ if(P.t-P.curW.t0>10) P.waits.push({why:P.curW.why,t0:Math.round(P.curW.t0),dur:Math.round(P.t-P.curW.t0)}); P.curW=null; }
    if(S.tut!==P.lastTut){ P.ev.push({t:Math.round(P.t),ev:'quest '+(S.tut-1)+' done: '+QUESTS[S.tut-1].short}); P.lastTut=S.tut; }
    if((S.goalDone||0)!==P.lastGoal){ P.ev.push({t:Math.round(P.t),ev:'goal done: '+GOALS[P.lastGoal].short}); P.lastGoal=S.goalDone||0; }
    if(n%600===0) P.samples.push({t:Math.round(P.t),day:S.day,dayT:+S.dayT.toFixed(2),food:Math.round(S.res.food),wood:Math.round(S.res.wood),stone:Math.round(S.res.stone),gold:Math.round(S.res.gold),gobs:S.gobs.length,troops:S.war.troops,banners:S.war.banners.length,doing:label});
    n++; }
   return {t:Math.round(P.t),day:S.day,done:S.day>=3};
  };
 });
 let prog={done:false}, guard=0;
 while(!prog.done&&guard<90){ prog=await p.evaluate(()=>PACE_run(2400)); guard++; }
 const out=await p.evaluate(()=>{ const P=PACE;
  if(P.curW) P.waits.push({why:P.curW.why+' (open)',t0:Math.round(P.curW.t0),dur:Math.round(P.t-P.curW.t0)});
  return {simT:Math.round(P.t),day:S.day,taps:P.taps,raids:P.raids,lostRaids:P.lostRaids,stuckDump:P.stuckDump||null,banners:S.war.banners,ogre:S.ogre,vanto:{signed:S.vanto.signed,trades:S.vanto.trades,main:S.vanto.main},treaty:S.war.treaty,school:S.school,ev:P.ev,waits:P.waits,samples:P.samples.filter((s,i)=>i%2===0||s.doing.indexOf('wait')===0||s.doing==='battle')}; });
 console.log(JSON.stringify({out,errs}));
 await b.close();

})().catch(e=>{console.log('ERR',e.message);process.exit(1);});
