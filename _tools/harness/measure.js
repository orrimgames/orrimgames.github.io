const puppeteer=require('puppeteer-core');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',protocolTimeout:600000,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage();
 await p.setViewport({width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true});
 await p.goto('http://localhost:8945/index-v114.html?new=1',{waitUntil:'load',timeout:120000});
 let t0=Date.now(); while(Date.now()-t0<120000){ if(await p.evaluate(()=>window.G&&G.frame>4).catch(()=>false)) break; await sleep(400); }
 const r=await p.evaluate(()=>{
  const IW=uiRail().w-16;
  const lines=[
   ['terms-school','send one goblin to study - back in 3 days, twice as bright',11.5,600],
   ['terms-treaty','his dead march beside you - 4 gold tithe at dawn',11.5,600],
   ['terms-ogre','leave one full: 10 food, 5 gold - the mountain eats daily',11.5,600],
   ['terms-vanto','20 food each dawn for 12 gold. Manners non-negotiable.',11.5,600],
   ['else-treaty','Ossimund will offer a treaty when you are worth talking to. Two banners make you worth talking to.',11.5,600],
   ['else-school','Send a goblin to study once you have a shrine.',11.5,600],
   ['scholar-away','Wibblenash is in the tower. Day 2 of 3.',11.5,700],
   ['school-done','One of yours studied there. The tower respects the Mudmouth now.',11.5,700],
   ['treaty-done','The Cold King keeps his word. The north road is open to you.',11.5,700],
   ['ogre-bowls','The ogres are gone. The bowls they carved remain.',12,800],
   ['ogre-bound','The mountain remembers you. Once, it will answer.',11.5,600],
   ['ogre-used','The debt is paid. The children sleep facing the mountain.',11.5,600],
   ['vanto-abridged','VANTOMERE answers. The contract, abridged:',12,800],
   ['vanto-trades','Deliveries: 2 of 3. The envoy is almost pleased.',11.5,600],
   ['vanto-main','The Warming Main hums. Warm hands carry half again.',11.5,600],
   ['rival-needs','needs 10 warriors   loot 150 gold, 90 stone, 60 food',12,700],
  ];
  const pills=[
   ['raid-ironbeard','RAID IRONBEARD DEEP',14,900],
   ['raid-choir','RAID BONE CHOIR',14,900],
   ['raid-warrens','RAID WARRENS',14,900],
   ['raid-bloom','RAID BLOOMFALL',14,900],
   ['treaty','ACCEPT THE COLD PEACE',12.5,800],
   ['scholar','SEND A SCHOLAR',13,800],
   ['offering','LEAVE AN OFFERING',12.5,800],
   ['ogre-today','the mountain eats once a day',12.5,800],
   ['ogre-need','need 10 food, 5 gold',12.5,800],
   ['sign','SIGN THE CONTRACT',12.5,800],
   ['resign','RE-SIGN THE CONTRACT',12.5,800],
   ['regroup','regrouping',12.5,800],
   ['need-warriors','need 10 warriors',12.5,800],
  ];
  return {IW, lines:lines.map(([k,s,sz,wt])=>({k,w:Math.round(txtW3(s,sz,wt)),sz,fits:txtW3(s,sz,wt)<=IW})),
          pills:pills.map(([k,s,sz,wt])=>({k,w:Math.round(txtW3(s,sz,wt)),sz,fits:txtW3(s,sz,wt)<=158}))};
 });
 console.log(JSON.stringify(r,null,1));
 await b.close();
})().catch(e=>{ console.error('FATAL',e.message); process.exit(1); });
