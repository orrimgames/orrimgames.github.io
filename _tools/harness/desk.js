// desktop harness: mouse + keys only, no direct calls to game input helpers
const puppeteer=require('puppeteer-core');
const W=+process.argv[2]||1920, H=+process.argv[3]||1080, TAG=process.argv[4]||'d';
const FILE=process.env.FILE||'index-v99.html';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage();
 await p.setViewport({width:W,height:H,deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push('console:'+m.text());});
 await p.goto('http://localhost:8945/'+FILE+'?new=1',{waitUntil:'load',timeout:120000});
 let t0=Date.now(); while(Date.now()-t0<90000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 const out={file:FILE,vp:W+'x'+H};
 for(let i=0;i<5;i++){ await p.evaluate(()=>{ S.story=null; S.started=true; S.introZoom=0; S.tut=QUESTS.length; S.elderHush=1; S.mode='village'; S.dayT=0.4; }); await sleep(300); }
 const cam=()=>p.evaluate(()=>({tx:+CAM.tx.toFixed(3),ty:+CAM.ty.toFixed(3),yaw:+CAM.yaw.toFixed(3),pitch:+CAM.pitch.toFixed(3),zoom:+CAM.zoom.toFixed(4),mode:S.mode}));
 out.cam={start:await cam()};
 // left-drag pan
 await p.mouse.move(W*0.5,H*0.5); await p.mouse.down(); await p.mouse.move(W*0.5-160,H*0.5-90,{steps:8}); await p.mouse.up(); await sleep(300);
 out.cam.afterLeft=await cam();
 // wheel zoom
 await p.mouse.move(W*0.5,H*0.5); await p.mouse.wheel({deltaY:-600}); await sleep(300); out.cam.wheelIn=await cam();
 await p.mouse.wheel({deltaY:900}); await sleep(300); out.cam.wheelOut=await cam();
 // right-drag rotate
 await p.mouse.move(W*0.5,H*0.5); await p.mouse.down({button:'right'}); await p.mouse.move(W*0.5+120,H*0.5+40,{steps:6}); await p.mouse.up({button:'right'}); await sleep(300);
 out.cam.rightDrag=await cam();
 await p.evaluate(()=>{ CAM.zoom=1; CAM.yaw=0.9; CAM.pitch=0.8; CAM.tx=29.5; CAM.ty=29.5; S.res={food:900,wood:900,stone:900,gold:900}; }); await sleep(300);
 // build card via key 1, hover ghost, place with double click
 await p.keyboard.press('1'); await sleep(250);
 out.sel1=await p.evaluate(()=>({sel:S.sel,barScroll:Math.round(barScroll)}));
 await p.mouse.move(W*0.42,H*0.46); await sleep(250);
 out.hoverGhost=await p.evaluate(()=>({show:S.ghost.show,tx:S.ghost.tx,ty:S.ghost.ty}));
 const before=await p.evaluate(()=>S.buildings.length);
 await p.mouse.click(W*0.42,H*0.46); await sleep(180); await p.mouse.click(W*0.42,H*0.46); await sleep(600);
 out.place={before,after:await p.evaluate(()=>S.buildings.length),sel:await p.evaluate(()=>S.sel)};
 await p.screenshot({path:'desk-village-'+TAG+'.png'});
 // war map and back
 await p.keyboard.press('m'); await sleep(900); out.mapMode=await p.evaluate(()=>S.mode);
 await p.screenshot({path:'desk-war-'+TAG+'.png'});
 await p.keyboard.press('Escape'); await sleep(900); out.backMode=await p.evaluate(()=>S.mode);
 // first person
 await p.keyboard.press('v'); await sleep(1200);
 out.fp={f0:await p.evaluate(()=>({on:FP.on,x:+FP.x.toFixed(2),y:+FP.y.toFixed(2),a:+FP.a.toFixed(3)}))};
 await p.keyboard.down('w'); await sleep(900); await p.keyboard.up('w'); await sleep(300);
 out.fp.f1=await p.evaluate(()=>({on:FP.on,x:+FP.x.toFixed(2),y:+FP.y.toFixed(2),a:+FP.a.toFixed(3)}));
 await p.screenshot({path:'desk-fp-'+TAG+'.png'});
 await p.keyboard.press('v'); await sleep(1100);
 out.fpExit=await p.evaluate(()=>({on:FP.on,mode:S.mode}));
 const f0=await p.evaluate(()=>G.frame); await sleep(3000);
 out.fps={frames:(await p.evaluate(()=>G.frame))-f0,over:'3s'};
 out.errs=errs;
 console.log(JSON.stringify(out,null,1));
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
