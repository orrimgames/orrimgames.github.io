S.started=true; S.dayT=0.5; const out={};
const realDay=glDay();
for(const mode of ['msg','bundle']){
  // force parity by overriding glDay
  const d0=realDay-(realDay%2); window.glDay=()=> mode==='msg'? d0+1 : d0;
  S.secrets.er_d=null; S.secrets.er_s=0; S.secrets.er_m=null; S.secrets.er_t=null; S.secrets.er_n=null; S.secrets.gt_d=null;
  const giver=errandGob();
  const others=S.gobs.filter(h=>!h.side&&h.name&&h!==giver);
  const tgt=others[0];
  S.gobs.forEach(h=>{ h.x=8;h.y=8;h.tx=8;h.ty=8; });
  FP.on=true;FP.battle=false;CAM.mode='fp';
  const place=(g,x,y)=>{g.x=x;g.y=y;g.tx=x;g.ty=y;};
  const stand=()=>{FP.x=30.5;FP.y=34.4;FP.a=0;FP.p=-0.05;fpSyncCam();};
  const o={giver:giver.name}; const r0=Object.assign({},S.res);
  place(giver,30.5,36); stand(); fpTap(900,300); o.s1=erStage(); o.mode=S.secrets.er_m; o.t=S.secrets.er_t; o.ask=S.toasts.slice(-1)[0].m;
  if(mode==='msg'){
    place(giver,8,8); place(tgt,30.5,36); stand(); fpTap(900,300); o.s2=erStage(); o.deliver=S.toasts.slice(-1)[0].m;
    place(tgt,8,8); place(giver,30.5,36); stand(); fpTap(900,300); o.s3=erStage(); o.banner=S.banner&&S.banner.t;
  } else {
    const it=PROPS.find(p=>p.errandItem!=null&&p.cond()); o.item=!!it;
    if(it){ FP.x=it.x;FP.y=it.y; fpUpdate(0.016); o.s2=erStage(); }
    place(giver,30.5,36); stand(); fpTap(900,300); o.s3=erStage(); o.banner=S.banner&&S.banner.t;
  }
  o.gold=[r0.gold,S.res.gold]; out[mode]=o;
}
return JSON.stringify(out);
