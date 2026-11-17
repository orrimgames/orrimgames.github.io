// usage: node gvprobe.js <evalfile.js> [screenshot.png] [query]
// Serves ~/goblin-build, loads the game headless, runs the eval file's body in-page (async fn body, may `return`), prints result + page errors.
const p=require('puppeteer-core'), http=require('http'), fs=require('fs'), path=require('path');
const root=process.env.GVROOT||path.join(process.env.HOME,'goblin-build');
const srv=http.createServer((q,r)=>{ const f=path.join(root,q.url.split('?')[0]==='/'?'index.html':q.url.split('?')[0]); fs.readFile(f,(e,d)=>{ if(e){r.statusCode=404;r.end();} else r.end(d); }); });
(async()=>{
  await new Promise(r=>srv.listen(8948,r));
  const b=await p.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader-webgl','--enable-webgl']});
  const page=await b.newPage(); await page.setViewport({width:1280,height:800});
  const errs=[]; page.on('pageerror',e=>errs.push(String(e)));
  await page.goto('http://127.0.0.1:8948/index.html?'+(process.argv[4]||'noshad&dpr1'),{waitUntil:'load',timeout:30000});
  await new Promise(r=>setTimeout(r,4000));
  const body=fs.readFileSync(process.argv[2],'utf8');
  const res=await page.evaluate(`(async()=>{${body}})()`);
  console.log('RESULT',typeof res==='string'?res:JSON.stringify(res));
  if(process.argv[3]){ await new Promise(r=>setTimeout(r,800)); await page.screenshot({path:process.argv[3]}); }
  console.log('ERRS',JSON.stringify(errs));
  await b.close(); srv.close();
})().catch(e=>{console.log('FAIL',e);process.exit(1);});
