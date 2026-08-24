const puppeteer=require('puppeteer-core');
(async()=>{
 const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage(); const bad=[]; const all=[];
 p.on('response',r=>{ all.push(r.status()+' '+r.url()); if(r.status()>=400) bad.push(r.status()+' '+r.url()); });
 await p.goto(process.argv[2],{waitUntil:'networkidle2',timeout:120000});
 await new Promise(r=>setTimeout(r,4000));
 console.log(JSON.stringify({bad,total:all.length,all:all.slice(0,20)},null,1));
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
