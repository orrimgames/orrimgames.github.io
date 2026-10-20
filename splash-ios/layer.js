/* Splash iOS layer: PWA polish, audio unlock, run tracker, shards, armory. No game internals touched. */
(function(){
'use strict';
var ua=navigator.userAgent, isIOS=/iPhone|iPad|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
var standalone=!!(navigator.standalone||matchMedia('(display-mode:standalone)').matches);
var $=function(s,r){return (r||document).querySelector(s)};
var store={get:function(k,d){try{var v=localStorage.getItem('splashios.'+k);return v==null?d:JSON.parse(v)}catch(e){return d}},set:function(k,v){try{localStorage.setItem('splashios.'+k,JSON.stringify(v))}catch(e){}}};

/* ---- audio unlock (WebAudio + iOS silent-switch workaround) ---- */
var ctxs=[];
['AudioContext','webkitAudioContext'].forEach(function(n){var A=window[n];if(!A)return;
  var W=function(){var c=new (Function.prototype.bind.apply(A,[null].concat([].slice.call(arguments))))();ctxs.push(c);return c};
  W.prototype=A.prototype;try{window[n]=W}catch(e){}});
function unlockAudio(){
  try{if(navigator.audioSession)navigator.audioSession.type='playback'}catch(e){}
  ctxs.forEach(function(c){if(c.state!=='running'){try{c.resume()}catch(e){}}
    try{var b=c.createBuffer(1,1,22050),s=c.createBufferSource();s.buffer=b;s.connect(c.destination);s.start(0)}catch(e){}});
}
['touchend','pointerup','click','keydown'].forEach(function(ev){document.addEventListener(ev,unlockAudio,{passive:true})});
document.addEventListener('visibilitychange',function(){if(!document.hidden)unlockAudio()});

/* ---- no rubber-band, no pinch/double-tap zoom, no long-press menu ---- */
['gesturestart','gesturechange','gestureend'].forEach(function(e){document.addEventListener(e,function(x){x.preventDefault()})});
var lastT=0;document.addEventListener('touchend',function(e){var n=Date.now();if(n-lastT<300&&!e.target.closest('input,textarea,#touch-controls'))e.preventDefault();lastT=n},{passive:false});
document.addEventListener('contextmenu',function(e){e.preventDefault()});
document.addEventListener('touchmove',function(e){if(!e.target.closest('.panel,#touch-extra,#ios-card,#ios-armory'))e.preventDefault()},{passive:false});

/* ---- screen wake lock while playing ---- */
var wl=null;function wake(){if(navigator.wakeLock&&!wl){navigator.wakeLock.request('screen').then(function(l){wl=l;l.addEventListener('release',function(){wl=null})}).catch(function(){})}}
document.addEventListener('visibilitychange',function(){if(!document.hidden&&playing)wake()});

/* ---- service worker (offline, network-first so updates are never stale) ---- */
if('serviceWorker' in navigator&&location.protocol!=='file:'){navigator.serviceWorker.register('sw.js').catch(function(){})}

/* ---- UI ---- */
var css=document.createElement('style');css.textContent=
'html,body{overscroll-behavior:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;position:fixed;width:100%;height:100%}'+
'#ios-rotate{position:fixed;inset:0;z-index:99999;background:#0e2a47;color:#fff;display:none;flex-direction:column;align-items:center;justify-content:center;font:800 22px "Baloo 2",system-ui,sans-serif;text-align:center;padding:24px}'+
'#ios-rotate i{display:block;font-style:normal;font-size:64px;animation:iosrot 2s ease-in-out infinite}@keyframes iosrot{0%,30%{transform:rotate(0)}60%,100%{transform:rotate(-90deg)}}'+
'@media (orientation:portrait){.touch-game #ios-rotate{display:flex}}'+
'.ios-box{margin:10px auto 0;max-width:520px;font:700 14px "Baloo 2",system-ui,sans-serif;color:#fff;background:rgba(10,40,70,.55);border:1px solid rgba(255,255,255,.3);border-radius:14px;padding:8px 12px;text-align:center}'+
'.ios-box b{color:#ffd23f}.ios-row{display:flex;gap:8px;justify-content:center;margin-top:6px;flex-wrap:wrap}'+
'.ios-btn{font:800 15px "Baloo 2",system-ui,sans-serif;color:#fff;background:#1f5fa8;border:2px solid rgba(255,255,255,.7);border-radius:12px;padding:6px 14px;min-height:40px;box-shadow:0 3px 0 #164a85}'+
'.ios-btn.gold{background:#d99a22;box-shadow:0 3px 0 #8a5d0e}.ios-btn:active{transform:translateY(2px)}'+
'#ios-card,#ios-armory{position:fixed;inset:0;z-index:9000;display:none;align-items:center;justify-content:center;background:rgba(5,15,30,.72);backdrop-filter:blur(4px);padding:max(10px,env(safe-area-inset-top)) max(10px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left))}'+
'#ios-card.on,#ios-armory.on{display:flex}'+
'.ios-sheet{color:#fff;margin:auto;font-family:"Baloo 2",system-ui,sans-serif;text-align:center;background:linear-gradient(#1c4f80,#12395e);border:2px solid rgba(255,255,255,.45);border-radius:22px;padding:14px 22px;max-width:min(560px,100%);max-height:100%;overflow:auto;box-shadow:0 18px 50px rgba(0,0,0,.5);touch-action:pan-y}'+
'.ios-sheet h2{margin:0;font-size:38px;line-height:1.05;background:linear-gradient(#fff6a8,#ffd23f 50%,#ff9a1f);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-stroke:1.5px #1f5fa8;paint-order:stroke fill}'+
'.ios-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0;font-size:13px;opacity:.95}.ios-stats b{display:block;font-size:24px;color:#ffd23f}'+
'.ios-shop{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px;text-align:left}.ios-item{background:rgba(255,255,255,.1);border:2px solid rgba(255,255,255,.25);border-radius:12px;padding:7px 10px;font-size:14px}.ios-item.eq{border-color:#ffd23f;background:rgba(255,210,63,.18)}.ios-item small{display:block;opacity:.8}'+
'#ios-toast{position:fixed;left:50%;top:max(60px,env(safe-area-inset-top));transform:translateX(-50%);z-index:9500;background:rgba(10,40,70,.9);color:#fff;border:2px solid #ffd23f;border-radius:14px;padding:6px 16px;font:800 16px "Baloo 2",system-ui,sans-serif;display:none;pointer-events:none}'+
'#ios-run{position:fixed;left:50%;transform:translateX(-50%);top:max(4px,env(safe-area-inset-top));z-index:20;font:800 12px "Baloo 2",system-ui,sans-serif;color:#fff;text-shadow:0 1px 3px #000;opacity:.9;pointer-events:none;display:none;margin-top:30px}'+
'.touch-game #ios-run{margin-top:30px}';
document.head.appendChild(css);

var el=function(h){var d=document.createElement('div');d.innerHTML=h;return d.firstChild};
var rot=el('<div id="ios-rotate"><i>\u{1F4F1}</i>Rotate your phone sideways<small style="font-size:14px;opacity:.8;margin-top:8px;font-weight:600">Splash plays in landscape</small></div>');
var card=el('<div id="ios-card"><div class="ios-sheet"></div></div>');
var armory=el('<div id="ios-armory"><div class="ios-sheet"></div></div>');
var toast=el('<div id="ios-toast"></div>');
var runbar=el('<div id="ios-run"></div>');
document.addEventListener('DOMContentLoaded',function(){[rot,card,armory,toast,runbar].forEach(function(n){document.body.appendChild(n)});initMenu()});

/* ---- meta state ---- */
var S=store.get('meta',{shards:0,floor:1,best:{kills:0,time:0,floor:1},runs:0,wins:0,owned:['look-classic','title-recruit'],look:'look-classic',title:'title-recruit',daily:{}});
function save(){store.set('meta',S)}
var LOOKS={'look-classic':{n:'Classic',c:0,f:''},'look-dusk':{n:'Dusk',c:60,f:'sepia(.35) hue-rotate(-18deg) saturate(1.25) brightness(.92)'},'look-ember':{n:'Ember',c:120,f:'sepia(.55) hue-rotate(-35deg) saturate(1.6) contrast(1.05)'},'look-frost':{n:'Frost',c:120,f:'hue-rotate(28deg) saturate(.9) brightness(1.06)'},'look-noir':{n:'Noir',c:200,f:'grayscale(1) contrast(1.15)'},'look-toon':{n:'Pop',c:150,f:'saturate(1.7) contrast(1.1)'}};
var TITLES={'title-recruit':{n:'Recruit',c:0},'title-warden':{n:'Bridge Warden',c:80},'title-breaker':{n:'Goblin Breaker',c:160},'title-lord':{n:'Tower Lord',c:320}};
function applyLook(){var g=$('#game');if(g)g.style.filter=(LOOKS[S.look]||LOOKS['look-classic']).f||''}
function say(t){toast.textContent=t;toast.style.display='block';clearTimeout(say.t);say.t=setTimeout(function(){toast.style.display='none'},2200)}

/* ---- menu additions ---- */
function today(){return new Date().toISOString().slice(0,10)}
var DAILY=[{t:'Defeat 12 goblins',k:12},{t:'Defeat 20 goblins',k:20},{t:'Defeat 8 goblins and clear a camp',k:8,c:1},{t:'Survive 6 minutes',m:360},{t:'Defeat 30 goblins',k:30}];
function dailyOf(d){var h=0;for(var i=0;i<d.length;i++)h=(h*31+d.charCodeAt(i))>>>0;return DAILY[h%DAILY.length]}
function initMenu(){
  applyLook();
  var panel=$('#menu .panel');if(!panel)return;
  var play=$('#play');
  var box=el('<div class="ios-box" id="ios-meta"></div>');
  play.parentNode.insertBefore(box,play.nextSibling);
  renderMeta();
  if(isIOS&&!standalone&&!store.get('hint',false)){
    var h=el('<div class="ios-box">For fullscreen: tap <b>Share</b> then <b>Add to Home Screen</b>. <button class="ios-btn" style="min-height:30px;padding:2px 10px;font-size:13px">OK</button></div>');
    h.querySelector('button').onclick=function(){store.set('hint',true);h.remove()};
    box.parentNode.insertBefore(h,box.nextSibling);
  }
  // hide the keyboard control legend on touch devices; it is useless there
  if(window.__M){var c=$('#menu .controls');if(c)c.style.display='none'}
  var wl=$('#menu a[href$=".msi"]');if(wl&&isIOS)wl.parentNode.style.display='none';
}
function renderMeta(){
  var b=$('#ios-meta');if(!b)return;var d=dailyOf(today()),done=S.daily[today()];
  b.innerHTML='<div><b>Tower floor '+S.floor+'</b> \u00B7 '+TITLES[S.title].n+' \u00B7 <b>'+S.shards+'</b> shards</div>'+
   '<div style="opacity:.9">Daily: '+d.t+(done?' \u2713':'')+'</div>'+
   '<div class="ios-row"><button class="ios-btn" id="ios-open-armory">Armory</button></div>';
  $('#ios-open-armory').onclick=openArmory;
}
function openArmory(){
  var h='<h2>Armory</h2><div style="margin-top:4px"><b style="color:#ffd23f">'+S.shards+'</b> shards \u00B7 cosmetic only</div><div class="ios-shop">';
  function item(id,o,kind){var own=S.owned.indexOf(id)>=0,eq=(kind==='look'?S.look:S.title)===id;
    return '<div class="ios-item'+(eq?' eq':'')+'" data-id="'+id+'" data-k="'+kind+'"><b>'+(kind==='look'?'Look: ':'Title: ')+o.n+'</b><small>'+(eq?'Equipped':own?'Tap to equip':'Tap to buy \u00B7 '+o.c+' shards')+'</small></div>'}
  Object.keys(LOOKS).forEach(function(k){h+=item(k,LOOKS[k],'look')});Object.keys(TITLES).forEach(function(k){h+=item(k,TITLES[k],'title')});
  h+='</div><div class="ios-row"><button class="ios-btn gold" id="ios-close-armory">Done</button></div>';
  var sh=$('.ios-sheet',armory);sh.innerHTML=h;armory.classList.add('on');
  [].forEach.call(sh.querySelectorAll('.ios-item'),function(n){n.onclick=function(){var id=n.dataset.id,k=n.dataset.k,o=(k==='look'?LOOKS:TITLES)[id];
    if(S.owned.indexOf(id)<0){if(S.shards<o.c){say('Need '+(o.c-S.shards)+' more shards');return}S.shards-=o.c;S.owned.push(id)}
    if(k==='look')S.look=id;else S.title=id;save();applyLook();renderMeta();openArmory()}});
  $('#ios-close-armory').onclick=function(){armory.classList.remove('on')};
}

/* ---- run tracker (reads the game's own HUD) ---- */
var playing=false,run=null,tick=null;
function num(re,s){var m=re.exec(s||'');return m?+m[1]:0}
function bar(sel){var i=$(sel+' .track i');return i?parseFloat(i.style.width)||0:null}
function startRun(){
  if(playing)return;playing=true;wake();
  run={t0:Date.now(),kills:0,camps:0,gold:0,ended:false,warned:false};
  runbar.style.display='block';
  tick=setInterval(poll,500);
}
function poll(){
  if(!run||run.ended)return;
  var k=$('#kills');if(k){run.kills=Math.max(run.kills,num(/Defeated:\s*(\d+)/,k.textContent));var m=/Camp:\s*(\d+)\s*left/.exec(k.textContent);if(m){if(run.camp0==null)run.camp0=+m[1];run.camps=Math.max(run.camps,run.camp0-(+m[1]))}}
  var g=$('#gold');if(g)run.gold=Math.max(run.gold,num(/(\d+)/,g.textContent));
  var secs=Math.floor((Date.now()-run.t0)/1000);
  runbar.textContent='Floor '+S.floor+' \u00B7 '+Math.floor(secs/60)+':'+('0'+secs%60).slice(-2)+' \u00B7 '+run.kills+' defeated';
  var home=bar('.obj.home'),tower=bar('.obj.tower');
  if(tower!==null&&tower>=99.5)endRun(true);
  else if(home!==null&&home<=0.5&&secs>5)endRun(false);
  else if($('#ko')&&!$('#ko').classList.contains('hidden')&&!run.warned){run.warned=true}
}
function shardsFor(win){return run.kills*3+run.camps*25+Math.floor((Date.now()-run.t0)/60000)*5+(win?60+S.floor*20:0)}
function endRun(win){
  if(run.ended)return;run.ended=true;clearInterval(tick);runbar.style.display='none';
  var secs=Math.floor((Date.now()-run.t0)/1000),earn=shardsFor(win),d=dailyOf(today()),dd=false;
  if(!S.daily[today()]&&((d.k&&run.kills>=d.k&&(!d.c||run.camps>=d.c))||(d.m&&secs>=d.m))){S.daily[today()]=1;earn+=100;dd=true}
  S.shards+=earn;S.runs++;var floorWas=S.floor;
  if(win){S.wins++;S.floor++}
  if(run.kills>S.best.kills)S.best.kills=run.kills;
  if(win&&(!S.best.time||secs<S.best.time))S.best.time=secs;
  S.best.floor=Math.max(S.best.floor,S.floor);save();
  var mm=Math.floor(secs/60)+':'+('0'+secs%60).slice(-2);
  var sh=$('.ios-sheet',card);
  sh.innerHTML='<h2>'+(win?'Floor '+floorWas+' cleared':'The bridge fell')+'</h2>'+
   '<div style="opacity:.9">'+(win?'The Dark Tower is yours. Another floor rises above it.':'The goblins crossed. Rebuild and hold it longer.')+'</div>'+
   '<div class="ios-stats"><div><b>'+run.kills+'</b>defeated</div><div><b>'+run.camps+'</b>camps</div><div><b>'+mm+'</b>time</div><div><b>+'+earn+'</b>shards</div></div>'+
   (dd?'<div style="color:#ffd23f">Daily challenge done, +100 shards</div>':'')+
   '<div style="font-size:13px;opacity:.85">Best: '+S.best.kills+' defeated \u00B7 floor '+S.floor+' \u00B7 '+S.shards+' shards banked</div>'+
   '<div class="ios-row"><button class="ios-btn gold" id="ios-again">Run again</button><button class="ios-btn" id="ios-arm">Armory</button><button class="ios-btn" id="ios-share">Share</button></div>';
  card.classList.add('on');
  $('#ios-again').onclick=function(){location.reload()};
  $('#ios-arm').onclick=function(){openArmory()};
  $('#ios-share').onclick=function(){var t='I '+(win?'cleared floor '+floorWas:'fell')+' in Splash: '+run.kills+' goblins defeated in '+mm+'. '+location.origin+'/splash-ios/';
    if(navigator.share)navigator.share({title:'Splash',text:t}).catch(function(){});else if(navigator.clipboard){navigator.clipboard.writeText(t);say('Copied')}};
  window.dispatchEvent(new CustomEvent('splash-run-end',{detail:{win:win,kills:run.kills,earn:earn}}));
}
document.addEventListener('DOMContentLoaded',function(){
  var hud=$('#hud');if(!hud)return;
  var chk=function(){if(!hud.classList.contains('hidden')&&!playing)startRun()};
  new MutationObserver(chk).observe(hud,{attributes:true,attributeFilter:['class','style']});chk();
});
/* auto-pause when the app is backgrounded */
document.addEventListener('visibilitychange',function(){if(document.hidden&&playing&&run&&!run.ended){var p=$('#touch-pause');if(p&&!window.__iosPaused){window.__iosPaused=1;p.click()}}else window.__iosPaused=0});
window.__splashIOS={S:S,endRun:endRun,get run(){return run}};
})();
