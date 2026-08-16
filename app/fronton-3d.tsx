"use client";

import { PointerEvent, useEffect, useRef, useState } from "react";

type Lang = "es" | "pt";
type ScoringScenario = "lata" | "special2" | "special3" | "suncho";
type Scenario = "video" | ScoringScenario;
type V3 = [number, number, number];

const SCENARIOS: Record<ScoringScenario,{strike:V3;impact:V3;score:"against"|"1"|"2"|"3";metal:boolean}> = {
  lata:{strike:[2.1,1.15,9],impact:[-1.25,.15,0],score:"against",metal:true},
  special2:{strike:[2.1,1.15,7.5],impact:[-1.25,.45,0],score:"2",metal:false},
  special3:{strike:[2.1,1.15,14.5],impact:[-1.25,.45,0],score:"3",metal:false},
  suncho:{strike:[2.1,1.15,10.5],impact:[-1.25,.625,0],score:"1",metal:true},
};

const VIDEO_PLAY = {
  strike:[-2.15,1.05,8.4] as V3,
  impact:[1.05,.41,0] as V3,
  bounce1:[-.8,.03,7.2] as V3,
  bounce2:[1.45,.03,12.3] as V3,
  opponent:[2.65,1.05,13.9] as V3,
};

const LABELS = {
  es:{title:"Cancha 3D interactiva",help:"Arrastra para girar la cámara. El valor especial depende de dónde el jugador golpea.",video:"Jugada 25–30 s",videoHits:"FINAL · 25–30 S",estimated:"RECONSTRUCCIÓN ESTIMADA",firstBounce:"1.er PIQUE",secondBounce:"2.º PIQUE",missed:"NO LLEGÓ",almostLata:"CASI TOCA LA LATA",adversary:"ADVERSARIO",lata:"Lata",two:"Especial · 2",three:"Especial · 3",suncho:"Suncho",play:"Reproducir",replay:"Repetir",against:"PUNTO EN CONTRA",points:"PUNTOS",impact:"CONTACTO",strike:"GOLPE DEL JUGADOR",near:"ZONA 2",far:"ZONA 3",frontis:"FRONTIS",metal:"SONIDO METÁLICO"},
  pt:{title:"Quadra 3D interativa",help:"Arraste para girar a câmera. O valor especial depende de onde o jogador rebate.",video:"Lance 25–30 s",videoHits:"FINAL · 25–30 S",estimated:"RECONSTRUÇÃO ESTIMADA",firstBounce:"1.º QUIQUE",secondBounce:"2.º QUIQUE",missed:"NÃO ALCANÇOU",almostLata:"QUASE NA LATA",adversary:"ADVERSÁRIO",lata:"Lata",two:"Especial · 2",three:"Especial · 3",suncho:"Suncho",play:"Reproduzir",replay:"Repetir",against:"PONTO CONTRA",points:"PONTOS",impact:"CONTATO",strike:"REBATIDA DO JOGADOR",near:"ZONA 2",far:"ZONA 3",frontis:"FRONTIS",metal:"SOM METÁLICO"},
};

export default function Fronton3D({lang}:{lang:Lang}){
  const container=useRef<HTMLDivElement>(null);
  const canvas=useRef<HTMLCanvasElement>(null);
  const audio=useRef<AudioContext|null>(null);
  const drag=useRef<{x:number;yaw:number}|null>(null);
  const [scenario,setScenario]=useState<Scenario>("video");
  const [run,setRun]=useState(0);
  const [yaw,setYaw]=useState(.56);
  const [playing,setPlaying]=useState(false);
  const [status,setStatus]=useState("");
  const copy=LABELS[lang],shot=SCENARIOS[scenario==="video"?"special3":scenario];

  useEffect(()=>{
    const node=canvas.current;if(!node)return;
    let animation=0,sounded=false;const start=performance.now();
    const paint=(now:number)=>{
      const box=node.getBoundingClientRect(),ratio=Math.min(2,window.devicePixelRatio||1);
      const width=Math.max(320,box.width),height=Math.max(310,box.height);
      if(node.width!==Math.round(width*ratio)||node.height!==Math.round(height*ratio)){node.width=Math.round(width*ratio);node.height=Math.round(height*ratio)}
      const x=node.getContext("2d")!;x.setTransform(ratio,0,0,ratio,0,0);x.clearRect(0,0,width,height);
      const elapsed=playing?Math.min(1,(now-start)/(scenario==="video"?9000:4200)):(run?1:0);
      drawScene(x,width,height,yaw,scenario,shot,elapsed,copy);
      if(scenario==="video"&&playing&&elapsed>=.88&&!sounded){sounded=true;setStatus(`2 ${copy.points}`)}
      if(scenario!=="video"&&playing&&elapsed>=.43&&!sounded){sounded=true;setStatus(shot.score==="against"?copy.against:`${shot.score} ${copy.points}`);if(shot.metal)metalSound(audio.current)}
      if(playing&&elapsed<1)animation=requestAnimationFrame(paint);else if(playing){setPlaying(false);animation=requestAnimationFrame(paint)}
    };
    animation=requestAnimationFrame(paint);
    return()=>cancelAnimationFrame(animation);
  },[copy,playing,run,scenario,shot,yaw]);

  function start(){
    if(!audio.current)audio.current=new AudioContext();
    if(scenario==="video")container.current?.requestFullscreen?.().catch(()=>{});
    audio.current.resume().catch(()=>{});setStatus(scenario==="video"?copy.videoHits:"");setRun(value=>value+1);setPlaying(true);
  }
  function choose(next:Scenario){setScenario(next);setPlaying(false);setRun(0);setStatus("")}
  function pointerDown(event:PointerEvent<HTMLCanvasElement>){event.currentTarget.setPointerCapture(event.pointerId);drag.current={x:event.clientX,yaw}}
  function pointerMove(event:PointerEvent<HTMLCanvasElement>){if(drag.current)setYaw(Math.max(-1.05,Math.min(1.05,drag.current.yaw+(event.clientX-drag.current.x)/260)))}
  function pointerUp(event:PointerEvent<HTMLCanvasElement>){event.currentTarget.releasePointerCapture(event.pointerId);drag.current=null}

  return <div className="fronton3d" ref={container}>
    <div className="fronton3dHead"><div><strong>{copy.title}</strong><small>{copy.help}</small></div><output className={scenario!=="video"&&shot.score==="against"?"against":""}>{status||"3D"}</output></div>
    <canvas ref={canvas} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={()=>{drag.current=null}} aria-label={copy.title}/>
    <div className="fronton3dControls">
      <div className="scenarioButtons">
        <button className={scenario==="video"?"on video":"video"} onClick={()=>choose("video")}>▶ {copy.video}</button>
        <button className={scenario==="lata"?"on":""} onClick={()=>choose("lata")}>{copy.lata}</button>
        <button className={scenario==="special2"?"on":""} onClick={()=>choose("special2")}>{copy.two}</button>
        <button className={scenario==="special3"?"on":""} onClick={()=>choose("special3")}>{copy.three}</button>
        <button className={scenario==="suncho"?"on":""} onClick={()=>choose("suncho")}>{copy.suncho}</button>
      </div>
      <button className="play3d" onClick={start}>▶ {run?copy.replay:copy.play}</button>
    </div>
  </div>
}

function drawScene(x:CanvasRenderingContext2D,width:number,height:number,yaw:number,scenario:Scenario,shot:(typeof SCENARIOS)[ScoringScenario],time:number,copy:(typeof LABELS)[Lang]){
  x.fillStyle="#06131c";x.fillRect(0,0,width,height);
  const zoom=scenario==="video"?videoZoom(time):0;
  const target:V3=[0,lerp(2.25,.43,zoom),lerp(8,.12,zoom)],radius=lerp(24,2.25,zoom);
  const project=projector(width,height,lerp(yaw,.18,zoom),target,radius);
  polygon(x,project,[[-5,0,0],[5,0,0],[5,0,18],[-5,0,18]],"#164d42","#7e9c91");
  polygon(x,project,[[-5,0,0],[-5,5.5,0],[-5,5.5,18],[-5,0,18]],"#0d3838cc","#69877f");
  polygon(x,project,[[5,0,0],[5,5.5,0],[5,5.5,18],[5,0,18]],"#0b3132aa","#69877f");
  polygon(x,project,[[-5,0,0],[5,0,0],[5,7,0],[-5,7,0]],"#174b43","#a5bab2");
  polygon(x,project,[[-5,0,0],[5,0,0],[5,.3,0],[-5,.3,0]],"#7b2c2c","#e6b9a5");
  polygon(x,project,[[-5,.3,0],[5,.3,0],[5,.6,0],[-5,.6,0]],"#d58b22","#ffcc62");
  polygon(x,project,[[-5,.6,0],[5,.6,0],[5,.65,0],[-5,.65,0]],"#c7d0d3","#ffffff");
  for(const z of [6,12]){
    line(x,project,[-5,.012,z],[5,.012,z],z===6?"#f9d74a":"#62b7ff",3);
    line(x,project,[-4.99,0,z],[-4.99,5.5,z],z===6?"#f9d74a":"#62b7ff",2);
    line(x,project,[4.99,0,z],[4.99,5.5,z],z===6?"#f9d74a":"#62b7ff",2);
  }
  label(x,project,[0,6.65,.02],copy.frontis,"#d6e2df");
  label(x,project,[3.8,.05,8.8],copy.near,"#f9d74a");label(x,project,[3.8,.05,15],copy.far,"#62b7ff");
  label(x,project,[-3.7,.14,.02],"LATA","#fff");label(x,project,[3.1,.47,.02],"2 / 3","#111");label(x,project,[-3.5,.64,.02],"SUNCHO","#111");
  if(scenario==="video"){drawVideoRally(x,project,time,copy);return}
  const strike=shot.strike,impact=shot.impact;
  marker(x,project,strike,"#075df8",copy.strike);
  if(time>0){
    const ball=ballPosition(strike,impact,time),tail:V3[]=[];
    for(let i=Math.max(0,time-.18);i<=time;i+=.025)tail.push(ballPosition(strike,impact,i));
    for(let i=1;i<tail.length;i++)line(x,project,tail[i-1],tail[i],`rgba(201,255,54,${i/tail.length*.72})`,3);
    const p=project(ball);if(p){x.shadowBlur=18;x.shadowColor="#c9ff36";x.fillStyle="#c9ff36";x.beginPath();x.arc(p.x,p.y,Math.max(4,8*p.scale),0,Math.PI*2);x.fill();x.shadowBlur=0}
    if(time>=.43){marker(x,project,impact,shot.score==="against"?"#ff493d":"#c9ff36",copy.impact);if(shot.metal)label(x,project,[impact[0]+1.5,impact[1]+.35,.02],copy.metal,"#fff")}
  }
}

function drawVideoRally(x:CanvasRenderingContext2D,project:(v:V3)=>{x:number;y:number;scale:number}|null,time:number,copy:(typeof LABELS)[Lang]){
  label(x,project,[0,6.25,.03],`${copy.estimated} · 00:25 → 00:30`,"#c9ff36");
  playerSketch(x,project,[VIDEO_PLAY.strike[0],0,VIDEO_PLAY.strike[2]],"#075df8",true,time<.3);
  playerSketch(x,project,[VIDEO_PLAY.opponent[0],0,VIDEO_PLAY.opponent[2]],time>=.84?"#ff493d":"#9eafb7",false,time>=.76);
  marker(x,project,VIDEO_PLAY.strike,"#075df8",copy.strike);
  marker(x,project,VIDEO_PLAY.opponent,time>=.84?"#ff493d":"#54727f",time>=.84?copy.missed:copy.adversary);
  if(time<=0)return;
  const tail:V3[]=[];
  for(let i=Math.max(0,time-.08);i<=time;i+=.008)tail.push(videoBallPosition(i));
  for(let i=1;i<tail.length;i++)line(x,project,tail[i-1],tail[i],`rgba(201,255,54,${i/tail.length*.8})`,3);
  const ball=project(videoBallPosition(time));
  if(ball){x.shadowBlur=18;x.shadowColor="#c9ff36";x.fillStyle="#c9ff36";x.beginPath();x.arc(ball.x,ball.y,Math.max(4,8*ball.scale),0,Math.PI*2);x.fill();x.shadowBlur=0}
  if(time>=.26){marker(x,project,VIDEO_PLAY.impact,"#ffcc62",copy.almostLata);impactRing(x,project,VIDEO_PLAY.impact)}
  if(time>=.62)marker(x,project,VIDEO_PLAY.bounce1,"#c9ff36",copy.firstBounce);
  if(time>=.84)marker(x,project,VIDEO_PLAY.bounce2,"#c9ff36",copy.secondBounce);
}

function videoBallPosition(time:number):V3{
  const t=Math.max(0,Math.min(1,time));
  if(t<=.28)return arc(VIDEO_PLAY.strike,VIDEO_PLAY.impact,t/.28,1.55);
  if(t<=.62)return arc(VIDEO_PLAY.impact,VIDEO_PLAY.bounce1,(t-.28)/.34,1.7);
  if(t<=.84)return arc(VIDEO_PLAY.bounce1,VIDEO_PLAY.bounce2,(t-.62)/.22,.82);
  return arc(VIDEO_PLAY.bounce2,[2.05,.02,13.4],(t-.84)/.16,.28);
}
function arc(a:V3,b:V3,t:number,height:number):V3{const ease=t*t*(3-2*t);return[lerp(a[0],b[0],ease),lerp(a[1],b[1],ease)+Math.sin(Math.PI*t)*height,lerp(a[2],b[2],ease)]}
function videoZoom(time:number){if(time<.12)return 0;if(time<.24)return smooth((time-.12)/.12);if(time<.38)return 1;if(time<.54)return 1-smooth((time-.38)/.16);return 0}
function smooth(t:number){return t*t*(3-2*t)}

function ballPosition(start:V3,impact:V3,time:number):V3{
  if(time<=.43){const t=time/.43,ease=t*t*(3-2*t);return[lerp(start[0],impact[0],ease),lerp(start[1],impact[1],ease)+Math.sin(Math.PI*t)*2.3,lerp(start[2],impact[2],ease)]}
  const t=Math.min(1,(time-.43)/.57),end:V3=[-2.2,.12,11.5];return[lerp(impact[0],end[0],t),lerp(impact[1],end[1],t)+Math.sin(Math.PI*t)*2.2,lerp(impact[2],end[2],t)];
}
function projector(width:number,height:number,yaw:number,target:V3=[0,2.25,8],radius=24){
  const pitch=.34,cam:V3=[target[0]+Math.sin(yaw)*Math.cos(pitch)*radius,target[1]+Math.sin(pitch)*radius,target[2]+Math.cos(yaw)*Math.cos(pitch)*radius];
  const forward=normalize(sub(target,cam)),right=normalize(cross(forward,[0,1,0])),up=cross(right,forward),f=Math.min(width,height)*1.42;
  return(point:V3)=>{const delta=sub(point,cam),depth=dot(delta,forward);if(depth<=.1)return null;return{x:width/2+dot(delta,right)*f/depth,y:height*.53-dot(delta,up)*f/depth,scale:f/depth/32}};
}
function polygon(x:CanvasRenderingContext2D,p:(v:V3)=>{x:number;y:number}|null,vertices:V3[],fill:string,stroke:string){const pts=vertices.map(p);if(pts.some(v=>!v))return;x.beginPath();pts.forEach((v,i)=>i?x.lineTo(v!.x,v!.y):x.moveTo(v!.x,v!.y));x.closePath();x.fillStyle=fill;x.fill();x.strokeStyle=stroke;x.lineWidth=1.2;x.stroke()}
function line(x:CanvasRenderingContext2D,p:(v:V3)=>{x:number;y:number}|null,a:V3,b:V3,color:string,width:number){const aa=p(a),bb=p(b);if(!aa||!bb)return;x.beginPath();x.moveTo(aa.x,aa.y);x.lineTo(bb.x,bb.y);x.strokeStyle=color;x.lineWidth=width;x.stroke()}
function marker(x:CanvasRenderingContext2D,p:(v:V3)=>{x:number;y:number;scale:number}|null,at:V3,color:string,text:string){const q=p(at);if(!q)return;x.fillStyle=color;x.beginPath();x.arc(q.x,q.y,7,0,Math.PI*2);x.fill();x.strokeStyle="#fff";x.lineWidth=2;x.stroke();x.fillStyle="#061420dd";x.fillRect(q.x+10,q.y-18,x.measureText(text).width+15,22);x.fillStyle="#fff";x.font="800 10px Arial";x.fillText(text,q.x+17,q.y-3)}
function impactRing(x:CanvasRenderingContext2D,p:(v:V3)=>{x:number;y:number;scale:number}|null,at:V3){const q=p(at);if(!q)return;x.strokeStyle="#ff493d";x.lineWidth=3;x.beginPath();x.arc(q.x,q.y,18,0,Math.PI*2);x.stroke();x.strokeStyle="#ffffffaa";x.lineWidth=1;x.beginPath();x.arc(q.x,q.y,28,0,Math.PI*2);x.stroke()}
function playerSketch(x:CanvasRenderingContext2D,p:(v:V3)=>{x:number;y:number;scale:number}|null,base:V3,color:string,left:boolean,action:boolean){
  const side=left?-1:1,point=(dx:number,dy:number,dz=0)=>p([base[0]+dx*side,base[1]+dy,base[2]+dz]);
  const head=point(0,1.72),neck=point(0,1.43),hip=point(0,.78),shoulderA=point(-.24,1.34),shoulderB=point(.24,1.34),footA=point(-.28,0,.08),footB=point(.3,0,-.08),handA=point(action?-.65:-.42,action?1.6:1.02,-.12),handB=point(action?.72:.42,action?1.5:1.02,-.08);
  const pairs=[[neck,hip],[shoulderA,shoulderB],[hip,footA],[hip,footB],[shoulderA,handA],[shoulderB,handB]];
  x.strokeStyle=color;x.lineWidth=5;x.lineCap="round";for(const [a,b] of pairs){if(!a||!b)continue;x.beginPath();x.moveTo(a.x,a.y);x.lineTo(b.x,b.y);x.stroke()}
  if(head){x.fillStyle=color;x.beginPath();x.arc(head.x,head.y,8,0,Math.PI*2);x.fill()}
  const racketCenter=point(action?1.04:.66,action?1.78:1.12,-.18),racketHandle=handB;if(racketCenter&&racketHandle){x.strokeStyle="#e7eef0";x.lineWidth=3;x.beginPath();x.moveTo(racketHandle.x,racketHandle.y);x.lineTo(racketCenter.x,racketCenter.y);x.stroke();x.beginPath();x.ellipse(racketCenter.x,racketCenter.y,11,16,.35,0,Math.PI*2);x.stroke()}
}
function label(x:CanvasRenderingContext2D,p:(v:V3)=>{x:number;y:number}|null,at:V3,text:string,color:string){const q=p(at);if(!q)return;x.fillStyle=color;x.font="800 10px Arial";x.textAlign="center";x.fillText(text,q.x,q.y);x.textAlign="left"}
function metalSound(context:AudioContext|null){if(!context)return;const now=context.currentTime,gain=context.createGain();gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.17,now+.01);gain.gain.exponentialRampToValueAtTime(.0001,now+.42);gain.connect(context.destination);[620,1030,1710].forEach((frequency,index)=>{const oscillator=context.createOscillator();oscillator.type="triangle";oscillator.frequency.setValueAtTime(frequency,now);oscillator.frequency.exponentialRampToValueAtTime(frequency*(.75-index*.04),now+.4);oscillator.connect(gain);oscillator.start(now);oscillator.stop(now+.43)})}
function sub(a:V3,b:V3):V3{return[a[0]-b[0],a[1]-b[1],a[2]-b[2]]}function dot(a:V3,b:V3){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}function cross(a:V3,b:V3):V3{return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}function normalize(a:V3):V3{const length=Math.hypot(...a)||1;return[a[0]/length,a[1]/length,a[2]/length]}function lerp(a:number,b:number,t:number){return a+(b-a)*t}
