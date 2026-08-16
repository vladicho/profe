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

const VIDEO_RALLY:{strike:V3;impact:V3;second:number}[] = [
  {strike:[2.7,1.1,15.5],impact:[-1.8,2.5,0],second:3},
  {strike:[-2.1,1.05,9.5],impact:[1.5,2.9,0],second:6},
  {strike:[2.2,1.2,14.5],impact:[-2.5,1.7,0],second:10},
  {strike:[-2.8,1.05,8.2],impact:[2.2,2.2,0],second:13},
  {strike:[3.1,.95,13.6],impact:[-1.2,1.35,0],second:18},
  {strike:[-1.5,1.2,9.1],impact:[2.8,2.65,0],second:20},
  {strike:[2.6,.9,14.2],impact:[-2.4,1.45,0],second:26},
  {strike:[-2.5,1.05,10.4],impact:[1.1,.78,0],second:29},
];

const LABELS = {
  es:{title:"Cancha 3D interactiva",help:"Arrastra para girar la cámara. El valor especial depende de dónde el jugador golpea.",video:"Jugada del video",videoHits:"8 GOLPES · 3–29 S",estimated:"RECONSTRUCCIÓN ESTIMADA",lata:"Lata",two:"Especial · 2",three:"Especial · 3",suncho:"Suncho",play:"Reproducir",replay:"Repetir",against:"PUNTO EN CONTRA",points:"PUNTOS",impact:"CONTACTO",strike:"GOLPE DEL JUGADOR",near:"ZONA 2",far:"ZONA 3",frontis:"FRONTIS",metal:"SONIDO METÁLICO"},
  pt:{title:"Quadra 3D interativa",help:"Arraste para girar a câmera. O valor especial depende de onde o jogador rebate.",video:"Lance do vídeo",videoHits:"8 REBATIDAS · 3–29 S",estimated:"RECONSTRUÇÃO ESTIMADA",lata:"Lata",two:"Especial · 2",three:"Especial · 3",suncho:"Suncho",play:"Reproduzir",replay:"Repetir",against:"PONTO CONTRA",points:"PONTOS",impact:"CONTATO",strike:"REBATIDA DO JOGADOR",near:"ZONA 2",far:"ZONA 3",frontis:"FRONTIS",metal:"SOM METÁLICO"},
};

export default function Fronton3D({lang}:{lang:Lang}){
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
      const elapsed=playing?Math.min(1,(now-start)/(scenario==="video"?12000:4200)):(run?1:0);
      drawScene(x,width,height,yaw,scenario,shot,elapsed,copy);
      if(scenario!=="video"&&playing&&elapsed>=.43&&!sounded){sounded=true;setStatus(shot.score==="against"?copy.against:`${shot.score} ${copy.points}`);if(shot.metal)metalSound(audio.current)}
      if(playing&&elapsed<1)animation=requestAnimationFrame(paint);else if(playing){setPlaying(false);animation=requestAnimationFrame(paint)}
    };
    animation=requestAnimationFrame(paint);
    return()=>cancelAnimationFrame(animation);
  },[copy,playing,run,scenario,shot,yaw]);

  function start(){
    if(!audio.current)audio.current=new AudioContext();
    audio.current.resume().catch(()=>{});setStatus(scenario==="video"?copy.videoHits:"");setRun(value=>value+1);setPlaying(true);
  }
  function choose(next:Scenario){setScenario(next);setPlaying(false);setRun(0);setStatus("")}
  function pointerDown(event:PointerEvent<HTMLCanvasElement>){event.currentTarget.setPointerCapture(event.pointerId);drag.current={x:event.clientX,yaw}}
  function pointerMove(event:PointerEvent<HTMLCanvasElement>){if(drag.current)setYaw(Math.max(-1.05,Math.min(1.05,drag.current.yaw+(event.clientX-drag.current.x)/260)))}
  function pointerUp(event:PointerEvent<HTMLCanvasElement>){event.currentTarget.releasePointerCapture(event.pointerId);drag.current=null}

  return <div className="fronton3d">
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
  const project=projector(width,height,yaw);
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
  label(x,project,[0,6.25,.03],`${copy.estimated} · 00:03 → 00:29`,"#c9ff36");
  const active=Math.min(VIDEO_RALLY.length-1,Math.floor(Math.min(.9999,time)*VIDEO_RALLY.length));
  VIDEO_RALLY.forEach((shot,index)=>{
    if(index>active)return;
    numberedMarker(x,project,shot.strike,index+1,index===active?"#075df8":"#54727f",`${shot.second}s`);
  });
  if(time<=0)return;
  const tail:V3[]=[];
  for(let i=Math.max(0,time-.035);i<=time;i+=.004)tail.push(videoBallPosition(i));
  for(let i=1;i<tail.length;i++)line(x,project,tail[i-1],tail[i],`rgba(201,255,54,${i/tail.length*.8})`,3);
  const ball=project(videoBallPosition(time));
  if(ball){x.shadowBlur=18;x.shadowColor="#c9ff36";x.fillStyle="#c9ff36";x.beginPath();x.arc(ball.x,ball.y,Math.max(4,8*ball.scale),0,Math.PI*2);x.fill();x.shadowBlur=0}
  const phase=Math.min(.9999,time)*VIDEO_RALLY.length-active;
  if(phase>=.46&&phase<=.62)marker(x,project,VIDEO_RALLY[active].impact,"#c9ff36",`${copy.impact} ${active+1}`);
}

function videoBallPosition(time:number):V3{
  const scaled=Math.min(.9999,Math.max(0,time))*VIDEO_RALLY.length,index=Math.min(VIDEO_RALLY.length-1,Math.floor(scaled)),phase=scaled-index,current=VIDEO_RALLY[index],next=VIDEO_RALLY[index+1];
  if(phase<=.5){const t=phase/.5,ease=t*t*(3-2*t);return[lerp(current.strike[0],current.impact[0],ease),lerp(current.strike[1],current.impact[1],ease)+Math.sin(Math.PI*t)*2.1,lerp(current.strike[2],0,ease)]}
  const end=next?.strike??([-3.4,.12,15.5] as V3),t=(phase-.5)/.5;return[lerp(current.impact[0],end[0],t),lerp(current.impact[1],end[1],t)+Math.sin(Math.PI*t)*1.9,lerp(0,end[2],t)];
}

function ballPosition(start:V3,impact:V3,time:number):V3{
  if(time<=.43){const t=time/.43,ease=t*t*(3-2*t);return[lerp(start[0],impact[0],ease),lerp(start[1],impact[1],ease)+Math.sin(Math.PI*t)*2.3,lerp(start[2],impact[2],ease)]}
  const t=Math.min(1,(time-.43)/.57),end:V3=[-2.2,.12,11.5];return[lerp(impact[0],end[0],t),lerp(impact[1],end[1],t)+Math.sin(Math.PI*t)*2.2,lerp(impact[2],end[2],t)];
}
function projector(width:number,height:number,yaw:number){
  const target:V3=[0,2.25,8],radius=24,pitch=.34,cam:V3=[target[0]+Math.sin(yaw)*Math.cos(pitch)*radius,target[1]+Math.sin(pitch)*radius,target[2]+Math.cos(yaw)*Math.cos(pitch)*radius];
  const forward=normalize(sub(target,cam)),right=normalize(cross(forward,[0,1,0])),up=cross(right,forward),f=Math.min(width,height)*1.42;
  return(point:V3)=>{const delta=sub(point,cam),depth=dot(delta,forward);if(depth<=.1)return null;return{x:width/2+dot(delta,right)*f/depth,y:height*.53-dot(delta,up)*f/depth,scale:f/depth/32}};
}
function polygon(x:CanvasRenderingContext2D,p:(v:V3)=>{x:number;y:number}|null,vertices:V3[],fill:string,stroke:string){const pts=vertices.map(p);if(pts.some(v=>!v))return;x.beginPath();pts.forEach((v,i)=>i?x.lineTo(v!.x,v!.y):x.moveTo(v!.x,v!.y));x.closePath();x.fillStyle=fill;x.fill();x.strokeStyle=stroke;x.lineWidth=1.2;x.stroke()}
function line(x:CanvasRenderingContext2D,p:(v:V3)=>{x:number;y:number}|null,a:V3,b:V3,color:string,width:number){const aa=p(a),bb=p(b);if(!aa||!bb)return;x.beginPath();x.moveTo(aa.x,aa.y);x.lineTo(bb.x,bb.y);x.strokeStyle=color;x.lineWidth=width;x.stroke()}
function marker(x:CanvasRenderingContext2D,p:(v:V3)=>{x:number;y:number;scale:number}|null,at:V3,color:string,text:string){const q=p(at);if(!q)return;x.fillStyle=color;x.beginPath();x.arc(q.x,q.y,7,0,Math.PI*2);x.fill();x.strokeStyle="#fff";x.lineWidth=2;x.stroke();x.fillStyle="#061420dd";x.fillRect(q.x+10,q.y-18,x.measureText(text).width+15,22);x.fillStyle="#fff";x.font="800 10px Arial";x.fillText(text,q.x+17,q.y-3)}
function numberedMarker(x:CanvasRenderingContext2D,p:(v:V3)=>{x:number;y:number}|null,at:V3,n:number,color:string,time:string){const q=p(at);if(!q)return;x.fillStyle=color;x.beginPath();x.arc(q.x,q.y,9,0,Math.PI*2);x.fill();x.strokeStyle="#fff";x.lineWidth=2;x.stroke();x.fillStyle="#fff";x.font="900 9px Arial";x.textAlign="center";x.fillText(String(n),q.x,q.y+3);x.fillStyle="#b8c8cf";x.font="800 9px Arial";x.fillText(time,q.x,q.y+22);x.textAlign="left"}
function label(x:CanvasRenderingContext2D,p:(v:V3)=>{x:number;y:number}|null,at:V3,text:string,color:string){const q=p(at);if(!q)return;x.fillStyle=color;x.font="800 10px Arial";x.textAlign="center";x.fillText(text,q.x,q.y);x.textAlign="left"}
function metalSound(context:AudioContext|null){if(!context)return;const now=context.currentTime,gain=context.createGain();gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.17,now+.01);gain.gain.exponentialRampToValueAtTime(.0001,now+.42);gain.connect(context.destination);[620,1030,1710].forEach((frequency,index)=>{const oscillator=context.createOscillator();oscillator.type="triangle";oscillator.frequency.setValueAtTime(frequency,now);oscillator.frequency.exponentialRampToValueAtTime(frequency*(.75-index*.04),now+.4);oscillator.connect(gain);oscillator.start(now);oscillator.stop(now+.43)})}
function sub(a:V3,b:V3):V3{return[a[0]-b[0],a[1]-b[1],a[2]-b[2]]}function dot(a:V3,b:V3){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}function cross(a:V3,b:V3):V3{return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}function normalize(a:V3):V3{const length=Math.hypot(...a)||1;return[a[0]/length,a[1]/length,a[2]/length]}function lerp(a:number,b:number,t:number){return a+(b-a)*t}
