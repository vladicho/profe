"use client";

import { PointerEvent, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { REAL_POSE_FRAMES } from "./real-pose-data";

type Lang = "es" | "pt";
type ScoringScenario = "lata" | "special2" | "special3" | "suncho";
type Scenario = "video" | ScoringScenario;
type V3 = [number, number, number];
type PoseKeypoint = readonly [number,number,number];
type PoseDetection = { k:readonly PoseKeypoint[] };
type Shot = {strike:V3;impact:V3;score:"against"|"1"|"2"|"3";metal:boolean};
type Player3D = {root:THREE.Group;parts:Record<string,THREE.Object3D>;racket:THREE.Group};
type Runtime = {renderer:THREE.WebGLRenderer;scene:THREE.Scene;camera:THREE.PerspectiveCamera;players:Player3D[];ball:THREE.Mesh;trail:THREE.Line;impact:THREE.Mesh;bounce1:THREE.Mesh;bounce2:THREE.Mesh;ready:boolean};

const POSE_FRAMES=REAL_POSE_FRAMES as unknown as readonly {t:number;p:readonly PoseDetection[]}[];
const SCENARIOS:Record<ScoringScenario,Shot>={
  lata:{strike:[2.1,1.15,9],impact:[-1.25,.15,0],score:"against",metal:true},
  special2:{strike:[2.1,1.15,7.5],impact:[-1.25,.45,0],score:"2",metal:false},
  special3:{strike:[2.1,1.15,14.5],impact:[-1.25,.45,0],score:"3",metal:false},
  suncho:{strike:[2.1,1.15,10.5],impact:[-1.25,.625,0],score:"1",metal:true},
};
const VIDEO_PLAY={
  impact:[-4.7,.41,.06] as V3,
  bounce1:[-4.67,.05,.52] as V3,
  bounce2:[-4.67,.05,.82] as V3,
};
const LABELS={
  es:{title:"Replay 3D profesional",help:"Jugadores y raquetas GLB · arrastra para girar la cámara",video:"Jugada 25–30 s",videoHits:"FINAL · 25–30 S",lata:"Lata",two:"Especial · 2",three:"Especial · 3",suncho:"Suncho",play:"Reproducir",replay:"Repetir",against:"PUNTO EN CONTRA",points:"PUNTOS",loading:"CARGANDO GLB",unavailable:"WEBGL NO DISPONIBLE"},
  pt:{title:"Replay 3D profissional",help:"Jogadores e raquetes GLB · arraste para girar a câmera",video:"Lance 25–30 s",videoHits:"FINAL · 25–30 S",lata:"Lata",two:"Especial · 2",three:"Especial · 3",suncho:"Suncho",play:"Reproduzir",replay:"Repetir",against:"PONTO CONTRA",points:"PONTOS",loading:"CARREGANDO GLB",unavailable:"WEBGL INDISPONÍVEL"},
};

export default function Fronton3D({lang}:{lang:Lang}){
  const container=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null),runtime=useRef<Runtime|null>(null);
  const audio=useRef<AudioContext|null>(null),drag=useRef<{x:number;yaw:number}|null>(null),started=useRef(0),notified=useRef(false);
  const scenarioRef=useRef<Scenario>("video"),playingRef=useRef(false),yawRef=useRef(.56),runRef=useRef(0),langRef=useRef(lang);
  const [scenario,setScenario]=useState<Scenario>("video"),[run,setRun]=useState(0),[yaw,setYaw]=useState(.56),[playing,setPlaying]=useState(false),[status,setStatus]=useState(""),[ready,setReady]=useState(false),[engineError,setEngineError]=useState(false);
  const copy=LABELS[lang],shot=SCENARIOS[scenario==="video"?"special3":scenario];
  useEffect(()=>{scenarioRef.current=scenario},[scenario]);
  useEffect(()=>{playingRef.current=playing},[playing]);
  useEffect(()=>{yawRef.current=yaw},[yaw]);
  useEffect(()=>{runRef.current=run},[run]);
  useEffect(()=>{langRef.current=lang},[lang]);

  useEffect(()=>{
    const node=canvas.current;if(!node)return;
    let frame=0,disposed=false,observer:ResizeObserver|null=null;
    try{
      const renderer=new THREE.WebGLRenderer({canvas:node,antialias:true,powerPreference:"high-performance"});
      renderer.setPixelRatio(Math.min(1.6,window.devicePixelRatio||1));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
      const scene=new THREE.Scene();scene.background=new THREE.Color(0x06131c);scene.fog=new THREE.Fog(0x06131c,20,42);
      const camera=new THREE.PerspectiveCamera(42,1,.04,80);buildCourt(scene);
      scene.add(new THREE.HemisphereLight(0xd9f4ff,0x15352d,2.1));
      const key=new THREE.DirectionalLight(0xffffff,4.2);key.position.set(-4,10,10);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-12;key.shadow.camera.right=12;key.shadow.camera.top=15;key.shadow.camera.bottom=-8;scene.add(key);
      const rim=new THREE.DirectionalLight(0x79bfff,2.5);rim.position.set(7,5,2);scene.add(rim);
      const ball=new THREE.Mesh(new THREE.SphereGeometry(.1,18,14),new THREE.MeshStandardMaterial({color:0xd8ff54,emissive:0x5f7800,emissiveIntensity:1.5,roughness:.4}));ball.castShadow=true;ball.visible=false;scene.add(ball);
      const trail=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0xc9ff36,transparent:true,opacity:.85}));scene.add(trail);
      const impact=eventRing(0xffcc62),bounce1=eventRing(0xc9ff36),bounce2=eventRing(0xc9ff36);scene.add(impact,bounce1,bounce2);
      const active:Runtime={renderer,scene,camera,players:[],ball,trail,impact,bounce1,bounce2,ready:false};runtime.current=active;
      const loader=new GLTFLoader();
      Promise.all([loader.loadAsync("/models/profe-athlete.glb"),loader.loadAsync("/models/fronton-racket.glb")]).then(([athlete,racket])=>{
        if(disposed)return;active.players=[makePlayer(athlete.scene,racket.scene,0x075df8),makePlayer(athlete.scene,racket.scene,0x8c9ba3)];active.players.forEach(player=>scene.add(player.root));active.ready=true;setReady(true);
      }).catch(()=>setEngineError(true));
      observer=new ResizeObserver(()=>resize(active,node));observer.observe(node);resize(active,node);
      const render=(now:number)=>{
        const current=scenarioRef.current,isPlaying=playingRef.current,duration=current==="video"?9000:4200;
        const elapsed=isPlaying?clamp((now-started.current)/duration,0,1):(runRef.current?1:0);
        updateCamera(active,yawRef.current,current,elapsed);updateScene(active,current,elapsed);active.renderer.render(active.scene,active.camera);
        if(isPlaying&&!notified.current&&((current==="video"&&elapsed>=.88)||(current!=="video"&&elapsed>=.43))){notified.current=true;const selected=SCENARIOS[current==="video"?"special2":current],labels=LABELS[langRef.current];setStatus(selected.score==="against"?labels.against:`${selected.score} ${labels.points}`);if(selected.metal)metalSound(audio.current)}
        if(isPlaying&&elapsed>=1){playingRef.current=false;setPlaying(false)}frame=requestAnimationFrame(render);
      };frame=requestAnimationFrame(render);
    }catch{queueMicrotask(()=>setEngineError(true))}
    return()=>{disposed=true;if(frame)cancelAnimationFrame(frame);observer?.disconnect();if(runtime.current){disposeScene(runtime.current.scene);runtime.current.renderer.dispose();runtime.current=null}}
  },[]);

  function start(){if(!ready||engineError)return;if(!audio.current)audio.current=new AudioContext();audio.current.resume().catch(()=>{});if(scenario==="video")container.current?.requestFullscreen?.().catch(()=>{});started.current=performance.now();notified.current=false;playingRef.current=true;setStatus(scenario==="video"?copy.videoHits:"");setRun(value=>value+1);setPlaying(true)}
  function choose(next:Scenario){scenarioRef.current=next;playingRef.current=false;runRef.current=0;setScenario(next);setPlaying(false);setRun(0);setStatus("")}
  function pointerDown(event:PointerEvent<HTMLCanvasElement>){event.currentTarget.setPointerCapture(event.pointerId);drag.current={x:event.clientX,yaw}}
  function pointerMove(event:PointerEvent<HTMLCanvasElement>){if(drag.current){const next=clamp(drag.current.yaw+(event.clientX-drag.current.x)/260,-1.05,1.05);yawRef.current=next;setYaw(next)}}
  function pointerUp(event:PointerEvent<HTMLCanvasElement>){event.currentTarget.releasePointerCapture(event.pointerId);drag.current=null}

  return <div className="fronton3d" ref={container}>
    <div className="fronton3dHead"><div><strong>{copy.title}</strong><small>{copy.help}</small></div><output className={scenario!=="video"&&shot.score==="against"?"against":""}>{engineError?copy.unavailable:status||(ready?"THREE.JS · GLB":copy.loading)}</output></div>
    <div className="threeStage"><canvas ref={canvas} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={()=>{drag.current=null}} aria-label={copy.title}/><div className="threeBadge"><span>WEBGL</span><b>GLB</b><span>POSE MOTION</span><strong>↔ 0,30 M</strong></div></div>
    <div className="fronton3dControls"><div className="scenarioButtons"><button className={scenario==="video"?"on video":"video"} onClick={()=>choose("video")}>▶ {copy.video}</button><button className={scenario==="lata"?"on":""} onClick={()=>choose("lata")}>{copy.lata}</button><button className={scenario==="special2"?"on":""} onClick={()=>choose("special2")}>{copy.two}</button><button className={scenario==="special3"?"on":""} onClick={()=>choose("special3")}>{copy.three}</button><button className={scenario==="suncho"?"on":""} onClick={()=>choose("suncho")}>{copy.suncho}</button></div><button className="play3d" disabled={!ready||engineError} onClick={start}>▶ {run?copy.replay:copy.play}</button></div>
  </div>
}

function buildCourt(scene:THREE.Scene){
  const floor=plane(10,18,0x174b43);floor.rotation.x=-Math.PI/2;floor.position.set(0,0,9);floor.receiveShadow=true;scene.add(floor);
  const front=plane(10,5.5,0x164d42);front.position.set(0,2.75,0);front.receiveShadow=true;scene.add(front);
  const sideMaterial=new THREE.MeshStandardMaterial({color:0x0d3838,transparent:true,opacity:.56,side:THREE.DoubleSide,roughness:.85});
  for(const x of [-5,5]){const wall=new THREE.Mesh(new THREE.PlaneGeometry(18,5.5),sideMaterial);wall.rotation.y=x<0?Math.PI/2:-Math.PI/2;wall.position.set(x,2.75,9);wall.receiveShadow=true;scene.add(wall)}
  scene.add(box(10,.3,.08,0x8a3232,[0,.15,.045]),box(10,.3,.065,0xd99024,[0,.45,.04]),box(10,.055,.095,0xdbe4e7,[0,.627,.055]));
  for(const z of [6,12]){scene.add(box(10,.018,.035,z===6?0xf9d74a:0x62b7ff,[0,.018,z]));for(const x of [-4.97,4.97])scene.add(box(.035,5.5,.035,z===6?0xf9d74a:0x62b7ff,[x,2.75,z]))}
  scene.add(labelSprite("FRONTIS",0xdce9e5,[0,5.05,.08],.65),labelSprite("LATA",0xffffff,[-3.9,.16,.11],.38),labelSprite("2 / 3",0x171d1d,[3.6,.47,.11],.38),labelSprite("SUNCHO",0x10191a,[-3.7,.7,.11],.38));
  for(let z=1;z<18;z+=1){const tick=box(z%3===0?.24:.12,.012,.025,0xffffff,[0,.012,z]),material=tick.material as THREE.MeshStandardMaterial;material.transparent=true;material.opacity=.25;scene.add(tick)}
}
function plane(width:number,height:number,color:number){return new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshStandardMaterial({color,roughness:.88,metalness:.02,side:THREE.DoubleSide}))}
function box(width:number,height:number,depth:number,color:number,position:V3){const item=new THREE.Mesh(new THREE.BoxGeometry(width,height,depth),new THREE.MeshStandardMaterial({color,roughness:.65,metalness:height<.1?.65:.05}));item.position.set(...position);item.receiveShadow=true;return item}
function labelSprite(text:string,color:number,position:V3,scale:number){const canvas=document.createElement("canvas");canvas.width=512;canvas.height=128;const x=canvas.getContext("2d")!;x.font="900 58px Arial";x.textAlign="center";x.textBaseline="middle";x.fillStyle=`#${color.toString(16).padStart(6,"0")}`;x.fillText(text,256,64);const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map,transparent:true,depthTest:false}));sprite.position.set(...position);sprite.scale.set(4*scale,scale,1);sprite.renderOrder=5;return sprite}
function eventRing(color:number){const ring=new THREE.Mesh(new THREE.TorusGeometry(.22,.025,10,30),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.95,depthTest:false}));ring.visible=false;ring.renderOrder=4;return ring}

function makePlayer(source:THREE.Group,racketSource:THREE.Group,uniform:number):Player3D{const body=source.clone(true),racket=racketSource.clone(true),root=new THREE.Group(),parts:Record<string,THREE.Object3D>={};body.traverse(object=>{if(object.name)parts[object.name]=object;if(object instanceof THREE.Mesh){object.material=object.material.clone();object.castShadow=true;if(["Torso","UpperArmL","UpperArmR"].includes(object.name))(object.material as THREE.MeshStandardMaterial).color.setHex(uniform)}});racket.traverse(object=>{if(object instanceof THREE.Mesh){object.material=object.material.clone();object.castShadow=true}});racket.scale.setScalar(.68);root.add(body,racket);return{root,parts,racket}}
function updateScene(runtime:Runtime,scenario:Scenario,time:number){
  const video=scenario==="video",shot=SCENARIOS[video?"special2":scenario];runtime.ball.visible=time>0;runtime.impact.visible=video?time>=.26:time>=.43;runtime.bounce1.visible=video&&time>=.62;runtime.bounce2.visible=video&&time>=.84;
  if(video){if(runtime.players[0])updatePlayer(runtime.players[0],poseJoints(time,0));if(runtime.players[1]){updatePlayer(runtime.players[1],poseJoints(time,1));setUniform(runtime.players[1],time>=.84?0xb62b2b:0x8c9ba3)}setRing(runtime.impact,VIDEO_PLAY.impact,false);setRing(runtime.bounce1,VIDEO_PLAY.bounce1,true);setRing(runtime.bounce2,VIDEO_PLAY.bounce2,true)}
  else{const joints=poseJoints(.02,0),racket=poseRacketGeometry(.02,0),offset:V3=[shot.strike[0]-racket.head[0],0,shot.strike[2]-racket.head[2]];if(runtime.players[0])updatePlayer(runtime.players[0],joints,offset);if(runtime.players[1])runtime.players[1].root.visible=false;setRing(runtime.impact,[shot.impact[0],shot.impact[1],.06],false)}
  if(video&&runtime.players[1])runtime.players[1].root.visible=true;const ball=video?videoBallPosition(time):ballPosition(shot.strike,shot.impact,time);runtime.ball.position.set(...ball);
  const points:THREE.Vector3[]=[];for(let sample=Math.max(0,time-(video?.1:.18));sample<=time;sample+=(video?.01:.022)){const point=video?videoBallPosition(sample):ballPosition(shot.strike,shot.impact,sample);points.push(new THREE.Vector3(...point))}runtime.trail.geometry.dispose();runtime.trail.geometry=new THREE.BufferGeometry().setFromPoints(points);
}
function updatePlayer(player:Player3D,joints:V3[],offset:V3=[0,0,0]){player.root.visible=true;const j=joints.map(point=>[point[0]+offset[0],point[1]+offset[1],point[2]+offset[2]] as V3),mid=(a:V3,b:V3):V3=>[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2],shoulders=mid(j[5],j[6]),hips=mid(j[11],j[12]);placePoint(player.parts.Head,j[0]);placePoint(player.parts.Hair,[j[0][0],j[0][1]+.035,j[0][2]]);placeSegment(player.parts.Torso,shoulders,hips,.96,1);placeSegment(player.parts.Hips,j[11],j[12],.66,.9);placeSegment(player.parts.UpperArmL,j[5],j[7]);placeSegment(player.parts.LowerArmL,j[7],j[9]);placePoint(player.parts.HandL,j[9]);placeSegment(player.parts.UpperArmR,j[6],j[8]);placeSegment(player.parts.LowerArmR,j[8],j[10]);placePoint(player.parts.HandR,j[10]);placeSegment(player.parts.UpperLegL,j[11],j[13]);placeSegment(player.parts.LowerLegL,j[13],j[15]);placeShoe(player.parts.ShoeL,j[15]);placeSegment(player.parts.UpperLegR,j[12],j[14]);placeSegment(player.parts.LowerLegR,j[14],j[16]);placeShoe(player.parts.ShoeR,j[16]);const racket=poseRacketFromJoints(j);player.racket.position.set(...racket.hand);player.racket.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(racket.head[0]-racket.hand[0],racket.head[1]-racket.hand[1],racket.head[2]-racket.hand[2]).normalize())}
function placePoint(object:THREE.Object3D|undefined,point:V3){if(!object)return;object.position.set(...point);object.quaternion.identity();object.scale.setScalar(1)}
function placeShoe(object:THREE.Object3D|undefined,point:V3){if(!object)return;object.position.set(point[0],.075,point[2]+.08);object.rotation.set(0,0,0);object.scale.set(1,1,1)}
function placeSegment(object:THREE.Object3D|undefined,a:V3,b:V3,baseHeight=1,width=1){if(!object)return;const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),direction=end.clone().sub(start),length=Math.max(.04,direction.length());object.position.copy(start.add(end).multiplyScalar(.5));object.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());object.scale.set(width,length/baseHeight,width)}
function setUniform(player:Player3D,color:number){for(const name of ["Torso","UpperArmL","UpperArmR"]){const mesh=player.parts[name] as THREE.Mesh|undefined;if(mesh)(mesh.material as THREE.MeshStandardMaterial).color.setHex(color)}}
function setRing(ring:THREE.Mesh,position:V3,floor:boolean){ring.position.set(...position);ring.rotation.set(floor?-Math.PI/2:0,0,0);ring.scale.setScalar(1)}
function updateCamera(runtime:Runtime,yaw:number,scenario:Scenario,time:number){const zoom=scenario==="video"?videoZoom(time):0,ball=scenario==="video"?videoBallPosition(time):[0,.43,.12] as V3,target=new THREE.Vector3(lerp(0,ball[0],zoom),lerp(2.25,ball[1],zoom),lerp(8,ball[2],zoom)),radius=lerp(24,.52,zoom),pitch=lerp(.34,.08,zoom),angle=lerp(yaw,.08,zoom);runtime.camera.position.set(target.x+Math.sin(angle)*Math.cos(pitch)*radius,target.y+Math.sin(pitch)*radius,target.z+Math.cos(angle)*Math.cos(pitch)*radius);runtime.camera.lookAt(target)}
function resize(runtime:Runtime,node:HTMLCanvasElement){const box=node.getBoundingClientRect(),width=Math.max(1,box.width),height=Math.max(1,box.height);runtime.renderer.setSize(width,height,false);runtime.camera.aspect=width/height;runtime.camera.updateProjectionMatrix()}

function poseSample(time:number,player:number){const scaled=clamp(time,0,.9999)*(POSE_FRAMES.length-1),index=Math.floor(scaled),mix=scaled-index,a=POSE_FRAMES[index]?.p[player],b=POSE_FRAMES[Math.min(POSE_FRAMES.length-1,index+1)]?.p[player]??a;return{a,b,mix}}
function poseBase(time:number,player:number):V3{const {a,b,mix}=poseSample(time,player),points=a?.k??[],next=b?.k??points,hipX=lerp(((points[11]?.[0]??.5)+(points[12]?.[0]??.5))/2,((next[11]?.[0]??.5)+(next[12]?.[0]??.5))/2,mix),ankleY=lerp(Math.max(points[15]?.[1]??.7,points[16]?.[1]??.7),Math.max(next[15]?.[1]??.7,next[16]?.[1]??.7),mix);return[clamp((hipX-.5)*10,-4.3,4.3),0,clamp((ankleY-.34)/.44*18,1.2,17)]}
function poseJoints(time:number,player:number):V3[]{const {a,b,mix}=poseSample(time,player),points=a?.k??[],next=b?.k??points,base=poseBase(time,player),hipY=lerp(((points[11]?.[1]??.55)+(points[12]?.[1]??.55))/2,((next[11]?.[1]??.55)+(next[12]?.[1]??.55))/2,mix),hipX=lerp(((points[11]?.[0]??.5)+(points[12]?.[0]??.5))/2,((next[11]?.[0]??.5)+(next[12]?.[0]??.5))/2,mix),ankleY=lerp(Math.max(points[15]?.[1]??.7,points[16]?.[1]??.7),Math.max(next[15]?.[1]??.7,next[16]?.[1]??.7),mix),height=Math.max(.12,ankleY-lerp(points[0]?.[1]??.3,next[0]?.[1]??.3,mix)),depth=[0,0,0,0,0,.04,-.04,.07,-.07,.1,-.1,.035,-.035,.03,-.03,.02,-.02];return Array.from({length:17},(_,index)=>{const px=lerp(points[index]?.[0]??hipX,next[index]?.[0]??hipX,mix),py=lerp(points[index]?.[1]??hipY,next[index]?.[1]??hipY,mix);return[base[0]+(px-hipX)/height*1.75,Math.max(.03,(ankleY-py)/height*1.75),base[2]+depth[index]] as V3})}
function poseRacketGeometry(time:number,player:number){return poseRacketFromJoints(poseJoints(time,player))}
function poseRacketFromJoints(joints:V3[]){const left=Math.hypot(joints[9][0]-joints[5][0],joints[9][1]-joints[5][1]),right=Math.hypot(joints[10][0]-joints[6][0],joints[10][1]-joints[6][1]),wrist=left>right?9:10,elbow=left>right?7:8,hand=joints[wrist],arm=[hand[0]-joints[elbow][0],hand[1]-joints[elbow][1],hand[2]-joints[elbow][2]] as V3,length=Math.hypot(...arm)||1,head=[hand[0]+arm[0]/length*.69,hand[1]+arm[1]/length*.69,hand[2]+arm[2]/length*.69] as V3;return{hand,head}}
function videoBallPosition(time:number):V3{const t=clamp(time,0,1);if(t<=.28)return arc(poseRacketGeometry(0,0).head,VIDEO_PLAY.impact,t/.28,1.35);if(t<=.62)return arc(VIDEO_PLAY.impact,VIDEO_PLAY.bounce1,(t-.28)/.34,.48);if(t<=.84)return arc(VIDEO_PLAY.bounce1,VIDEO_PLAY.bounce2,(t-.62)/.22,.14);return arc(VIDEO_PLAY.bounce2,[-4.67,.05,1],(t-.84)/.16,.08)}
function ballPosition(start:V3,impact:V3,time:number):V3{if(time<=.43)return arc(start,[impact[0],impact[1],.06],time/.43,2.3);return arc([impact[0],impact[1],.06],[-2.2,.08,11.5],clamp((time-.43)/.57,0,1),2.2)}
function arc(a:V3,b:V3,t:number,height:number):V3{const ease=t*t*(3-2*t);return[lerp(a[0],b[0],ease),lerp(a[1],b[1],ease)+Math.sin(Math.PI*t)*height,lerp(a[2],b[2],ease)]}
function videoZoom(time:number){if(time<.12)return 0;if(time<.24)return smooth((time-.12)/.12);if(time<.38)return 1;if(time<.54)return 1-smooth((time-.38)/.16);return 0}
function smooth(t:number){return t*t*(3-2*t)}function lerp(a:number,b:number,t:number){return a+(b-a)*t}function clamp(value:number,min:number,max:number){return Math.max(min,Math.min(max,value))}
function metalSound(context:AudioContext|null){if(!context)return;const now=context.currentTime,gain=context.createGain();gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.17,now+.01);gain.gain.exponentialRampToValueAtTime(.0001,now+.42);gain.connect(context.destination);[620,1030,1710].forEach((frequency,index)=>{const oscillator=context.createOscillator();oscillator.type="triangle";oscillator.frequency.setValueAtTime(frequency,now);oscillator.frequency.exponentialRampToValueAtTime(frequency*(.75-index*.04),now+.4);oscillator.connect(gain);oscillator.start(now);oscillator.stop(now+.43)})}
function disposeScene(scene:THREE.Scene){scene.traverse(object=>{if(object instanceof THREE.Mesh||object instanceof THREE.Line){object.geometry?.dispose();const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach(material=>{if(material instanceof THREE.SpriteMaterial&&material.map)material.map.dispose();material.dispose()})}})}
