const puppeteer=require('puppeteer-core');
const MOB=process.argv[2]==='m', FILE=process.env.FILE||'index-v106.html';
(async()=>{
 const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage();
 await p.setViewport(MOB?{width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true}:{width:1920,height:1080,deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push('console:'+m.text());});
 const tag=MOB?'m':'d';
 await p.goto('http://localhost:8945/'+FILE+'?new=1',{waitUntil:'load',timeout:120000});
 let t0=Date.now(); while(Date.now()-t0<90000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await new Promise(r=>setTimeout(r,400)); }
 for(let i=0;i<5;i++){ await p.evaluate(()=>{ S.story=null; S.started=true; S.introZoom=0; S.tut=QUESTS.length; S.elderHush=1; S.mode='village'; CAM.zoom=1; CAM.pitch=0.8; CAM.tx=29.5; CAM.ty=29.5; S.dayT=0.4; }); await new Promise(r=>setTimeout(r,350)); }
 const emptyOpen=await p.evaluate(()=>{ S.chronicle=[]; toggleChron(); return {open:S.chronOpen, panel:chronPanel(), btn:chronBtnR()}; });
 await new Promise(r=>setTimeout(r,900));
 await p.screenshot({path:'chron-empty-'+tag+'.png'});
 await p.evaluate(()=>{ S.chronOpen=false; S.chronicle=[];
   const L=['The goblins drew breath, built, and dreamed bigger than their mud.',
     'The Ratkin fell. Their banner burns well.',
     'THE RATKIN HERESY: "There is no dragon. There is only weather, and weather does not want anything."',
     'They came home painted. The littlest goblins touched the marks and whispered.',
     'Rain day. The mud enjoyed it more than the goblins did.',
     'The mountain drummed, once, in approval. Exactly once.',
     'Vantomere delivered congratulations in triplicate. One of them was damp.'];
   for(let d=1;d<=6;d++) for(const l of L) S.chronicle.push({day:d,line:l});
   toggleChron(); });
 await new Promise(r=>setTimeout(r,1100));
 const st=await p.evaluate(()=>({open:S.chronOpen, scroll:Math.round(S._chronS), entries:S.chronicle.length}));
 await p.screenshot({path:'chron-bottom-'+tag+'.png'});
 await p.evaluate(()=>{ chronScroll(-99999); });
 await new Promise(r=>setTimeout(r,800));
 await p.screenshot({path:'chron-top-'+tag+'.png'});
 const topS=await p.evaluate(()=>Math.round(S._chronS||0));
 const closed=await p.evaluate(()=>{ handleTap3(5,5); return S.chronOpen; });
 const reopened=await p.evaluate(()=>{ const r=chronBtnR(); handleTap3(r.x+r.w/2,r.y+r.h/2); return S.chronOpen; });
 const closedX=await p.evaluate(()=>{ const c=chronCloseR(); handleTap3(c.x+c.w/2,c.y+c.h/2); return S.chronOpen; });
 await new Promise(r=>setTimeout(r,700));
 await p.screenshot({path:'chron-village-'+tag+'.png'});
 const tap=await p.evaluate(()=>{ const n0=S.buildings.length; S.res={food:900,wood:900,stone:900,gold:900}; const h=hallB(); const ok=placeBuilding('hut',h.tx+4,h.ty+4); return {n0,n1:S.buildings.length,ok}; });
 console.log(JSON.stringify({vp:MOB?'390x844':'1920x1080',emptyOpen,st,topS,closed,reopened,closedX,tap,errs}));
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
