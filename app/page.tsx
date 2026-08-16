"use client";

import { ChangeEvent, MouseEvent, useEffect, useRef, useState } from "react";

type P = { x:number; y:number; t:number };
type Stage = "court" | "ball" | "ready" | "tracking" | "done";
type Lang = "es" | "pt";
type Sport = "fronton" | "racquetball";
type MotionSample = { time:number; score:number };
type RallyClip = { id:number; start:number; end:number; confidence:number };

const COPY = {
  es: {
    private:"análisis local y privado", eyebrow:"VISIÓN COMPUTACIONAL PARA DEPORTES DE PARED",
    headline:<>La jugada<br/>no miente.</>, hero:"Sube una grabación, calibra la cancha y observa la trayectoria estimada, el rebote y el impacto de la pelota.",
    center:"CENTRO DE ANÁLISIS", review:"Revisa la jugada.", time:"3 pasos · cerca de 1 minuto",
    choose:"Elige el deporte", fronton:"Frontón", frontonText:"Frontis, suelo y zona válida", racquetball:"Ráquetbol", racquetText:"Pared frontal, laterales, techo y suelo",
    upload:"Subir video", uploadHelp:"MP4, MOV o WebM · procesado en tu dispositivo", videoLink:"Enlace del video", useLink:"Usar enlace",
    linkHelp:"La importación directa se integrará con las API oficiales.", calibrate:"Calibrar cancha", calibrateHelp:"Marca las cuatro esquinas en el orden indicado.",
    selectBall:"Seleccionar pelota", selectHelp:"Pausa y toca el centro de la pelota.", tracking:"Rastrear trayectoria", trackingHelp:"Analiza hasta 12 segundos de la jugada.",
    analyzing:"Analizando…", start:"Iniciar rastreo", restart:"Repetir calibración", another:"Elegir otro video",
    result:"RESULTADO ESTIMADO", bounce:"Mapa del impacto.", inside:"DENTRO", outside:"FUERA", points:"PUNTOS RASTREADOS",
    position:"POSICIÓN EN LA CANCHA", confidence:"CONFIANZA", good:"Buena", reviewConfidence:"Revisar",
    disclaimer:"Estimación con una sola cámara. No sustituye el arbitraje oficial. Puedes pausar y tocar el video para corregir puntos.",
    how:"CÓMO FUNCIONA", perspective:"Perspectiva", perspectiveText:"Cuatro puntos definen los límites visibles de la cancha.",
    trackingTitle:"Rastreo", trackingText:"El color y el movimiento orientan la búsqueda de la pelota cuadro a cuadro.",
    projection:"Proyección", projectionText:"La trayectoria, el rebote y el impacto se dibujan para revisión.",
    footer:"Herramienta experimental de análisis deportivo · 2026",
    initial:"Sube un video para comenzar", corners:"1. Marca las cuatro esquinas: fondo izquierdo, fondo derecho, frente derecho y frente izquierdo.",
    ball:"2. Pausa al comienzo de la jugada y toca el centro de la pelota.", selected:"Pelota seleccionada. Ahora inicia el rastreo.",
    corrected:"Punto corregido manualmente.", tracing:"Rastreando la pelota…", complete:"Análisis terminado. Revisa el mapa del impacto.",
    again:"Marca nuevamente las cuatro esquinas.", linkMessage:"Los enlaces directos requieren autorización de las plataformas. Descarga un video permitido y sube el archivo.",
    changeSport:"Cambiar deporte", detect:"Detectar finales", detectHelp:"Busca pausas y cambios de movimiento entre los puntos.", detecting:"Buscando finales…",
    detected:"finales encontrados", noClips:"No se encontraron finales claros. Puedes analizar el video desde el punto actual.",
    finalizations:"FINALES DE CADA PUNTO", finalizationsTitle:"Elige una jugada.", play:"Ver", analyzeClip:"Analizar", clipSelected:"Jugada seleccionada. Pausa y toca el centro de la pelota.",
    estimate:"Detección automática: confirma cada recorte antes del análisis.", markFinal:"Marcar final ahora", marked:"Final marcado manualmente.",
    downloadShort:"Descargar short", exportingShort:"Creando short…", shortReady:"Short guardado en tu dispositivo.", exportUnsupported:"Este navegador no permite crear el short. Prueba con Edge o Chrome actualizado.", rally:"JUGADA",
    tutorial:"TUTORIAL EN VIDEO", tutorialTitle:"Mira el proceso completo.", tutorialIntro:"Un recorrido visual, sin saltos, desde el video original hasta la trayectoria y el short.", tutorialPlay:"Reproducir tutorial de Frontón",
    tutorialSteps:["Elige Frontón y sube un archivo permitido.","Pulsa Detectar finales y espera el análisis.","Elige una jugada y pulsa Analizar.","Marca las cuatro esquinas en el orden indicado.","Pausa y toca exactamente el centro de la pelota.","Inicia el rastreo, revisa la línea y descarga el short."],
    example:"EJEMPLO REAL + SIMULACIÓN", exampleTitle:"Así se ve una jugada analizada.", originalVideo:"Video original", simulation:"Simulación de trayectoria", replay:"Repetir simulación",
    exampleCredit:"Video reproducido por el player oficial de YouTube · El Negrito del Frontón", illustrative:"Trayectoria ilustrativa para explicar el proceso; no es una medición oficial del Short.", hit:"GOLPE", frontisLabel:"FRONTIS", bounceLabel:"PIQUE", returnLabel:"RETORNO"
  },
  pt: {
    private:"análise local e privada", eyebrow:"VISÃO COMPUTACIONAL PARA ESPORTES DE PAREDE",
    headline:<>A jogada<br/>não mente.</>, hero:"Envie uma gravação, calibre a quadra e veja a trajetória estimada, o quique e o impacto da bola.",
    center:"CENTRAL DE ANÁLISE", review:"Reveja a jogada.", time:"3 passos · cerca de 1 minuto",
    choose:"Escolha o esporte", fronton:"Frontón", frontonText:"Frontis, chão e área válida", racquetball:"Raquetebol", racquetText:"Parede frontal, laterais, teto e chão",
    upload:"Enviar vídeo", uploadHelp:"MP4, MOV ou WebM · processado no aparelho", videoLink:"Link do vídeo", useLink:"Usar link",
    linkHelp:"A importação direta será integrada às APIs oficiais.", calibrate:"Calibrar quadra", calibrateHelp:"Marque os quatro cantos na ordem indicada.",
    selectBall:"Selecionar a bola", selectHelp:"Pause e toque no centro da bola.", tracking:"Rastrear trajetória", trackingHelp:"Analisa até 12 segundos da jogada.",
    analyzing:"Analisando…", start:"Iniciar rastreamento", restart:"Recomeçar calibração", another:"Escolher outro vídeo",
    result:"RESULTADO ESTIMADO", bounce:"Mapa do impacto.", inside:"DENTRO", outside:"FORA", points:"PONTOS RASTREADOS",
    position:"POSIÇÃO NA QUADRA", confidence:"CONFIANÇA", good:"Boa", reviewConfidence:"Revisar",
    disclaimer:"Estimativa feita com uma única câmera. Não substitui arbitragem oficial. Você pode pausar e tocar no vídeo para corrigir pontos.",
    how:"COMO FUNCIONA", perspective:"Perspectiva", perspectiveText:"Quatro pontos definem os limites visíveis da quadra.",
    trackingTitle:"Rastreamento", trackingText:"Cor e movimento orientam a busca pela bola a cada quadro.",
    projection:"Projeção", projectionText:"A trajetória, o quique e o impacto são desenhados para revisão.",
    footer:"Ferramenta experimental de análise esportiva · 2026",
    initial:"Envie um vídeo para começar", corners:"1. Marque os quatro cantos: fundo esquerdo, fundo direito, frente direita e frente esquerda.",
    ball:"2. Pause no começo da jogada e toque no centro da bola.", selected:"Bola selecionada. Agora inicie o rastreamento.",
    corrected:"Ponto corrigido manualmente.", tracing:"Rastreando a bola…", complete:"Análise concluída. Confira o mapa do impacto.",
    again:"Marque novamente os quatro cantos.", linkMessage:"Links diretos dependem da autorização das plataformas. Baixe um vídeo permitido e envie o arquivo.",
    changeSport:"Trocar esporte", detect:"Detectar finalizações", detectHelp:"Procura pausas e mudanças de movimento entre os pontos.", detecting:"Procurando finalizações…",
    detected:"finalizações encontradas", noClips:"Não encontrei finalizações claras. Você ainda pode analisar o vídeo a partir do ponto atual.",
    finalizations:"FINALIZAÇÕES DE CADA LANCE", finalizationsTitle:"Escolha uma jogada.", play:"Ver", analyzeClip:"Analisar", clipSelected:"Jogada selecionada. Pause e toque no centro da bola.",
    estimate:"Detecção automática: confirme cada recorte antes da análise.", markFinal:"Marcar final agora", marked:"Finalização marcada manualmente.",
    downloadShort:"Baixar short", exportingShort:"Criando short…", shortReady:"Short salvo no seu aparelho.", exportUnsupported:"Este navegador não consegue criar o short. Tente com Edge ou Chrome atualizado.", rally:"LANCE",
    tutorial:"TUTORIAL EM VÍDEO", tutorialTitle:"Veja o processo completo.", tutorialIntro:"Um passo a passo visual, sem pular etapas, do vídeo original até a trajetória e o short.", tutorialPlay:"Reproduzir tutorial de Frontón",
    tutorialSteps:["Escolha Frontón e envie um arquivo permitido.","Toque em Detectar finalizações e aguarde.","Escolha um lance e toque em Analisar.","Marque os quatro cantos na ordem mostrada.","Pause e toque exatamente no centro da bola.","Inicie o rastreamento, confira a linha e baixe o short."],
    example:"EXEMPLO REAL + SIMULAÇÃO", exampleTitle:"Veja como fica uma jogada analisada.", originalVideo:"Vídeo original", simulation:"Simulação da trajetória", replay:"Repetir simulação",
    exampleCredit:"Vídeo reproduzido pelo player oficial do YouTube · El Negrito del Frontón", illustrative:"Trajetória ilustrativa para explicar o processo; não é uma medição oficial do Short.", hit:"GOLPE", frontisLabel:"FRONTIS", bounceLabel:"QUIQUE", returnLabel:"RETORNO"
  }
};

export default function Home() {
  const video = useRef<HTMLVideoElement>(null);
  const overlay = useRef<HTMLCanvasElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const timer = useRef<number | null>(null);
  const [src,setSrc]=useState("");
  const [link,setLink]=useState("");
  const [stage,setStage]=useState<Stage>("court");
  const [court,setCourt]=useState<P[]>([]);
  const [path,setPath]=useState<P[]>([]);
  const [rgb,setRgb]=useState<number[]|null>(null);
  const [message,setMessage]=useState("Sube un video para comenzar");
  const [progress,setProgress]=useState(0);
  const [lang,setLang]=useState<Lang>("es");
  const [sport,setSport]=useState<Sport|null>(null);
  const [clips,setClips]=useState<RallyClip[]>([]);
  const [selectedClip,setSelectedClip]=useState<RallyClip|null>(null);
  const [detecting,setDetecting]=useState(false);
  const [exporting,setExporting]=useState<number|null>(null);
  const [simulationKey,setSimulationKey]=useState(0);
  const c=COPY[lang];

  function draw(){
    const v=video.current,c=overlay.current;
    if(!v||!c||!v.videoWidth)return;
    const r=v.getBoundingClientRect(),d=window.devicePixelRatio||1;
    c.width=r.width*d;c.height=r.height*d;c.style.width=r.width+"px";c.style.height=r.height+"px";
    const x=c.getContext("2d")!;x.scale(d,d);
    const sx=r.width/v.videoWidth,sy=r.height/v.videoHeight,q=(p:P)=>({x:p.x*sx,y:p.y*sy});
    if(court.length){
      x.strokeStyle="#c9ff36";x.lineWidth=2;x.setLineDash([7,5]);x.beginPath();
      court.map(q).forEach((p,i)=>i?x.lineTo(p.x,p.y):x.moveTo(p.x,p.y));
      if(court.length===4)x.closePath();x.stroke();x.setLineDash([]);
      court.map(q).forEach((p,i)=>{x.fillStyle="#081521";x.strokeStyle="#c9ff36";x.beginPath();x.arc(p.x,p.y,12,0,7);x.fill();x.stroke();x.fillStyle="white";x.font="700 12px Arial";x.textAlign="center";x.fillText(String(i+1),p.x,p.y+4)});
    }
    const visible=path.filter(p=>p.t<=v.currentTime+.08).map(q);
    if(visible.length>1){x.strokeStyle="#c9ff36";x.lineWidth=4;x.lineCap="round";x.beginPath();visible.forEach((p,i)=>i?x.lineTo(p.x,p.y):x.moveTo(p.x,p.y));x.stroke()}
    const last=visible.at(-1);if(last){x.fillStyle="#c9ff36";x.beginPath();x.arc(last.x,last.y,7,0,7);x.fill()}
  }
  useEffect(()=>{draw();window.addEventListener("resize",draw);return()=>window.removeEventListener("resize",draw)});
  useEffect(()=>()=>{if(src)URL.revokeObjectURL(src)},[src]);
  useEffect(()=>{const saved=localStorage.getItem("profe-lang");if(saved==="pt"||saved==="es")setLang(saved)},[]);
  function language(next:Lang){setLang(next);localStorage.setItem("profe-lang",next)}

  function upload(e:ChangeEvent<HTMLInputElement>){
    const f=e.target.files?.[0];if(!f)return;
    if(src)URL.revokeObjectURL(src);setSrc(URL.createObjectURL(f));setCourt([]);setPath([]);setRgb(null);setClips([]);setSelectedClip(null);setStage("court");setProgress(0);
    setMessage(c.corners);
  }
  async function seek(v:HTMLVideoElement,time:number){
    if(Math.abs(v.currentTime-time)<.03)return;
    await new Promise<void>((resolve,reject)=>{
      const done=()=>{cleanup();resolve()},fail=()=>{cleanup();reject(new Error("seek failed"))};
      const cleanup=()=>{v.removeEventListener("seeked",done);v.removeEventListener("error",fail)};
      v.addEventListener("seeked",done);v.addEventListener("error",fail);v.currentTime=time;
    });
  }
  async function detectRallies(){
    const source=video.current;if(!source||!Number.isFinite(source.duration)||source.duration<3)return;
    setDetecting(true);setProgress(0);setMessage(c.detecting);source.pause();
    const scan=document.createElement("video");scan.src=src;scan.muted=true;scan.preload="auto";scan.playsInline=true;
    try{
      if(scan.readyState<2)await new Promise<void>((resolve,reject)=>{scan.addEventListener("loadeddata",()=>resolve(),{once:true});scan.addEventListener("error",()=>reject(new Error("video load failed")),{once:true})});
      const canvas=document.createElement("canvas");canvas.width=96;canvas.height=54;
      const x=canvas.getContext("2d",{willReadFrequently:true})!,duration=scan.duration;
      const interval=Math.min(2,Math.max(.5,duration/900)),samples:MotionSample[]=[];let previous:Uint8ClampedArray|null=null;
      for(let time=0,index=0;time<duration-.05;time+=interval,index++){
        await seek(scan,time);x.drawImage(scan,0,0,canvas.width,canvas.height);
        const pixels=x.getImageData(0,0,canvas.width,canvas.height).data,gray=new Uint8ClampedArray(canvas.width*canvas.height);
        let difference=0;
        for(let i=0,j=0;i<pixels.length;i+=4,j++){gray[j]=(pixels[i]*3+pixels[i+1]*6+pixels[i+2])/10;if(previous)difference+=Math.abs(gray[j]-previous[j])}
        if(previous)samples.push({time,score:difference/gray.length});previous=gray;
        if(index%6===0)setProgress(Math.min(99,time/duration*100));
      }
      const found=finalizationClips(samples,duration,interval);setClips(found);setSelectedClip(null);setProgress(100);
      setMessage(found.length?`${found.length} ${c.detected}.`:c.noClips);
    }catch{setClips([]);setMessage(c.noClips)}finally{scan.removeAttribute("src");scan.load();setDetecting(false)}
  }
  function previewClip(clip:RallyClip){
    const v=video.current;if(!v)return;setSelectedClip(clip);v.currentTime=clip.start;v.play().catch(()=>{});setMessage(`${formatTime(clip.start)} — ${formatTime(clip.end)}`);
  }
  function markFinal(){
    const v=video.current;if(!v)return;v.pause();const time=v.currentTime;
    const clip={id:Date.now(),start:Math.max(0,time-5),end:Math.min(v.duration,time+2),confidence:1};
    setClips(old=>[...old.filter(item=>Math.abs((item.start+5)-time)>2),clip].sort((a,b)=>a.start-b.start));setSelectedClip(clip);setMessage(c.marked);
  }
  function analyzeClip(clip:RallyClip){
    const v=video.current;if(!v)return;v.pause();v.currentTime=clip.start;setSelectedClip(clip);setPath([]);setRgb(null);setProgress(0);
    if(court.length===4){setStage("ball");setMessage(c.clipSelected)}else{setStage("court");setMessage(c.corners)}
  }
  async function exportShort(clip:RallyClip,index:number){
    if(exporting!==null)return;
    if(typeof MediaRecorder==="undefined"||!("captureStream" in HTMLCanvasElement.prototype)){setMessage(c.exportUnsupported);return}
    setExporting(clip.id);setProgress(0);setMessage(c.exportingShort);
    const playback=document.createElement("video");playback.src=src;playback.preload="auto";playback.playsInline=true;playback.muted=true;
    try{
      if(playback.readyState<2)await new Promise<void>((resolve,reject)=>{playback.addEventListener("loadeddata",()=>resolve(),{once:true});playback.addEventListener("error",()=>reject(new Error("video load failed")),{once:true})});
      await seek(playback,clip.start);
      const canvas=document.createElement("canvas");canvas.width=540;canvas.height=960;
      const x=canvas.getContext("2d")!,stream=canvas.captureStream(30);
      const captured=(playback as HTMLVideoElement&{captureStream?:()=>MediaStream}).captureStream?.();
      captured?.getAudioTracks().forEach(track=>stream.addTrack(track));
      const types=["video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm","video/mp4"];
      const mime=types.find(type=>MediaRecorder.isTypeSupported(type));
      const recorder=new MediaRecorder(stream,mime?{mimeType:mime,videoBitsPerSecond:3_500_000}:{videoBitsPerSecond:3_500_000});
      const chunks:BlobPart[]=[];recorder.addEventListener("dataavailable",event=>{if(event.data.size)chunks.push(event.data)});
      const stopped=new Promise<void>((resolve,reject)=>{recorder.addEventListener("stop",()=>resolve(),{once:true});recorder.addEventListener("error",()=>reject(new Error("recording failed")),{once:true})});
      let frame=0;const points=path.filter(point=>point.t>=clip.start&&point.t<=clip.end);
      const drawShort=()=>{
        x.fillStyle="#061420";x.fillRect(0,0,canvas.width,canvas.height);
        const scale=Math.min(canvas.width/playback.videoWidth,(canvas.height-180)/playback.videoHeight),width=playback.videoWidth*scale,height=playback.videoHeight*scale,left=(canvas.width-width)/2,top=(canvas.height-height)/2;
        x.drawImage(playback,left,top,width,height);
        if(points.length>1){x.strokeStyle="#c9ff36";x.lineWidth=5;x.lineCap="round";x.beginPath();points.filter(point=>point.t<=playback.currentTime+.08).forEach((point,i)=>{const px=left+point.x*scale,py=top+point.y*scale;if(i)x.lineTo(px,py);else x.moveTo(px,py)});x.stroke()}
        x.fillStyle="#c9ff36";x.beginPath();x.arc(32,42,8,0,Math.PI*2);x.fill();x.fillStyle="white";x.font="900 25px Arial";x.fillText("PROFE",52,50);
        x.fillStyle="#c9ff36";x.font="800 16px Arial";x.textAlign="right";x.fillText(sport==="fronton"?c.fronton.toUpperCase():c.racquetball.toUpperCase(),canvas.width-26,48);x.textAlign="left";
        x.fillStyle="#ffffff";x.font="900 28px Arial";x.fillText(`${c.rally} ${String(index+1).padStart(2,"0")}`,26,canvas.height-58);x.fillStyle="#9aabb5";x.font="600 15px Arial";x.fillText(`${formatTime(clip.start)} — ${formatTime(clip.end)}  •  profe.lugarerrado.com`,26,canvas.height-29);
        const percent=Math.min(100,Math.max(0,(playback.currentTime-clip.start)/Math.max(.1,clip.end-clip.start)*100));if(frame++%5===0)setProgress(percent);
        if(playback.currentTime>=clip.end||playback.ended){playback.pause();if(recorder.state!=="inactive")recorder.stop();return}
        requestAnimationFrame(drawShort);
      };
      recorder.start(250);await playback.play();drawShort();await stopped;
      const blob=new Blob(chunks,{type:recorder.mimeType||"video/webm"}),extension=blob.type.includes("mp4")?"mp4":"webm",url=URL.createObjectURL(blob),download=document.createElement("a");
      download.href=url;download.download=`profe-${sport}-${String(index+1).padStart(2,"0")}.${extension}`;download.click();setTimeout(()=>URL.revokeObjectURL(url),1500);setProgress(100);setMessage(c.shortReady);
    }catch{setMessage(c.exportUnsupported)}finally{playback.pause();playback.removeAttribute("src");playback.load();setExporting(null)}
  }
  function videoTime(){
    const v=video.current;if(!v)return;draw();
    if(selectedClip&&stage!=="tracking"&&v.currentTime>=selectedClip.end-.03)v.pause();
  }
  function point(e:MouseEvent<HTMLCanvasElement>):P{
    const v=video.current!,r=e.currentTarget.getBoundingClientRect();
    return{x:(e.clientX-r.left)*v.videoWidth/r.width,y:(e.clientY-r.top)*v.videoHeight/r.height,t:v.currentTime};
  }
  function clickVideo(e:MouseEvent<HTMLCanvasElement>){
    const p=point(e);
    if(stage==="court"){
      const n=[...court,p].slice(0,4);setCourt(n);
      if(n.length===4){setStage("ball");setMessage(c.ball)}
    } else if(stage==="ball"){
      const v=video.current!,c=document.createElement("canvas");c.width=v.videoWidth;c.height=v.videoHeight;
      const x=c.getContext("2d",{willReadFrequently:true})!;x.drawImage(v,0,0);
      const d=x.getImageData(Math.max(0,p.x-2),Math.max(0,p.y-2),5,5).data,s=[0,0,0];
      for(let i=0;i<d.length;i+=4){s[0]+=d[i];s[1]+=d[i+1];s[2]+=d[i+2]}
      setRgb(s.map(n=>n/25));setPath([p]);setStage("ready");setMessage(c.selected);
    } else if(stage!=="tracking"){setPath(old=>[...old,p].sort((a,b)=>a.t-b.t));setMessage(c.corrected)}
  }
  function find(data:ImageData,target:number[],prev:P,w:number,h:number){
    let best:P|null=null,score=Infinity;const rad=Math.max(90,w*.14);
    const ax=Math.max(0,prev.x-rad),bx=Math.min(w,prev.x+rad),ay=Math.max(0,prev.y-rad),by=Math.min(h,prev.y+rad);
    for(let y=ay;y<by;y+=3)for(let x=ax;x<bx;x+=3){
      const i=(Math.floor(y)*w+Math.floor(x))*4,dr=data.data[i]-target[0],dg=data.data[i+1]-target[1],db=data.data[i+2]-target[2];
      const s=dr*dr+dg*dg+db*db+((x-prev.x)**2+(y-prev.y)**2)*.035;
      if(s<score){score=s;best={x,y,t:0}}
    }
    return score<12500?best:null;
  }
  function track(){
    const v=video.current;if(!v||!rgb||!path.length)return;
    setStage("tracking");setMessage(c.tracing);v.pause();
    const c=document.createElement("canvas");c.width=v.videoWidth;c.height=v.videoHeight;const x=c.getContext("2d",{willReadFrequently:true})!;
    const pts=[...path],start=v.currentTime,end=Math.min(v.duration,selectedClip?.end??start+12);
    const step=()=>{
      if(v.currentTime>=end||v.ended){setPath([...pts]);setStage("done");setProgress(100);setMessage(c.complete);return}
      x.drawImage(v,0,0);const found=find(x.getImageData(0,0,c.width,c.height),rgb,pts.at(-1)!,c.width,c.height);
      if(found)pts.push({...found,t:v.currentTime});setPath([...pts]);setProgress((v.currentTime-start)/Math.max(.1,end-start)*100);
      v.currentTime=Math.min(end,v.currentTime+1/24);timer.current=window.setTimeout(step,28);
    };step();
  }
  function restart(){if(timer.current)clearTimeout(timer.current);setCourt([]);setPath([]);setRgb(null);setStage("court");setProgress(0);setMessage(c.again)}

  const bounds=court.length===4?{minX:Math.min(...court.map(p=>p.x)),maxX:Math.max(...court.map(p=>p.x)),minY:Math.min(...court.map(p=>p.y)),maxY:Math.max(...court.map(p=>p.y))}:null;
  let bounce=path.at(-1)||null;
  for(let i=2;i<path.length-2;i++)if(path[i].y>=path[i-2].y&&path[i].y>=path[i+2].y)bounce=path[i];
  const map=bounce&&bounds?{x:(bounce.x-bounds.minX)/(bounds.maxX-bounds.minX)*100,y:(bounce.y-bounds.minY)/(bounds.maxY-bounds.minY)*100}:null;
  const inside=!!map&&map.x>=0&&map.x<=100&&map.y>=0&&map.y<=100;

  return <main>
    <nav><a href="#top" className="logo"><i/>PROFE</a><div className="navTools"><span><b/> {c.private}</span><div className="language"><button className={lang==="es"?"on":""} onClick={()=>language("es")}>ES</button><button className={lang==="pt"?"on":""} onClick={()=>language("pt")}>PT</button></div></div></nav>
    <header id="top" className="hero"><div><p className="eyebrow">{c.eyebrow}</p><h1>{c.headline}</h1><p>{c.hero}</p></div><div className="courtArt"><i/><b/><em/></div></header>
    <section className="tutorial">
      <div className="tutorialCopy"><p className="eyebrow blue">{c.tutorial}</p><h2>{c.tutorialTitle}</h2><p>{c.tutorialIntro}</p><ol>{c.tutorialSteps.map((step,index)=><li key={step}><b>{String(index+1).padStart(2,"0")}</b><span>{step}</span></li>)}</ol></div>
      <div className="tutorialVideo"><video key={lang} controls playsInline preload="metadata" poster="/tutorial-poster.svg"><source src={`/tutorial-fronton-${lang}.mp4`} type="video/mp4"/>{c.tutorialPlay}</video><span>{c.tutorialPlay} · 00:36</span></div>
    </section>
    <section className="example">
      <div className="exampleHead"><p className="eyebrow">{c.example}</p><h2>{c.exampleTitle}</h2></div>
      <div className="exampleGrid">
        <article className="original"><div className="exampleLabel"><b>01</b><strong>{c.originalVideo}</strong></div><div className="shortFrame"><iframe src="https://www.youtube-nocookie.com/embed/bFkJy8iZtFk?rel=0&amp;playsinline=1" title="Lazzaroni MADE IN BOLIVIA — El Negrito del Frontón" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen/></div><p>{c.exampleCredit}</p></article>
        <article className="simulation"><div className="exampleLabel"><b>02</b><strong>{c.simulation}</strong></div><TrajectorySimulation key={simulationKey} labels={{hit:c.hit,frontis:c.frontisLabel,bounce:c.bounceLabel,return:c.returnLabel}}/><button onClick={()=>setSimulationKey(key=>key+1)}>↻ {c.replay}</button><p>{c.illustrative}</p></article>
      </div>
    </section>
    <section className="lab">
      <div className="title"><div><p className="eyebrow blue">{c.center}</p><h2>{c.review}</h2></div><small>{c.time}</small></div>
      {!sport?<div className="sportPick"><h3>{c.choose}</h3><div><button onClick={()=>{setSport("fronton");setMessage(c.initial)}}><span>F</span><strong>{c.fronton}</strong><small>{c.frontonText}</small></button><button onClick={()=>{setSport("racquetball");setMessage(c.initial)}}><span>R</span><strong>{c.racquetball}</strong><small>{c.racquetText}</small></button></div></div>:
      !src?<><div className="sportBar"><b>{sport==="fronton"?c.fronton:c.racquetball}</b><button onClick={()=>setSport(null)}>{c.changeSport}</button></div><div className="sources">
        <button className="upload" onClick={()=>picker.current?.click()}><span>↑</span><strong>{c.upload}</strong><small>{c.uploadHelp}</small></button>
        <div className="external"><strong>{c.videoLink}</strong><div><input value={link} onChange={e=>setLink(e.target.value)} placeholder="YouTube ou Facebook"/><button onClick={()=>setMessage(c.linkMessage)}>{c.useLink}</button></div><small>{c.linkHelp}</small></div>
      </div></>:<><div className="analyzer">
        <div className="screen"><video ref={video} src={src} controls playsInline onLoadedMetadata={draw} onTimeUpdate={videoTime}/><canvas ref={overlay} onClick={clickVideo}/><div className="screenStatus"><span>{message}</span><b>{Math.round(progress)}%</b></div><i className="bar" style={{width:progress+"%"}}/></div>
        <aside>
          <div className="activeSport">{sport==="fronton"?c.fronton:c.racquetball}</div>
          <div className="detectActions"><button className="detect" disabled={detecting||stage==="tracking"} onClick={detectRallies}>{detecting?c.detecting:c.detect}</button><button className="markFinal" disabled={detecting||stage==="tracking"} onClick={markFinal}>{c.markFinal}</button></div>
          <small className="detectHelp">{c.detectHelp}</small>
          <Step n="01" title={c.calibrate} text={c.calibrateHelp} active={stage==="court"} done={court.length===4} tag={court.length+"/4"}/>
          <Step n="02" title={c.selectBall} text={c.selectHelp} active={stage==="ball"} done={!!rgb}/>
          <Step n="03" title={c.tracking} text={c.trackingHelp} active={stage==="ready"||stage==="tracking"} done={stage==="done"}/>
          <button className="primary" disabled={!rgb||stage==="tracking"} onClick={track}>{stage==="tracking"?c.analyzing:c.start}</button>
          <button className="secondary" onClick={restart}>{c.restart}</button>
          <button className="linkBtn" onClick={()=>{setSrc("");setClips([]);setSelectedClip(null)}}>{c.another}</button>
        </aside>
      </div>{clips.length>0&&<div className="clips"><div className="clipsHead"><div><p className="eyebrow blue">{c.finalizations}</p><h3>{c.finalizationsTitle}</h3></div><small>{c.estimate}</small></div><div className="clipGrid">{clips.map((clip,i)=><article className={selectedClip?.id===clip.id?"selected":""} key={clip.id}><b>{String(i+1).padStart(2,"0")}</b><div><strong>{formatTime(clip.start)} — {formatTime(clip.end)}</strong><small>{Math.round(clip.confidence*100)}% {c.confidence.toLowerCase()}</small></div><button onClick={()=>previewClip(clip)}>{c.play}</button><button className="analyzeClip" onClick={()=>analyzeClip(clip)}>{c.analyzeClip}</button><button className="downloadShort" disabled={exporting!==null} onClick={()=>exportShort(clip,i)}>{exporting===clip.id?c.exportingShort:c.downloadShort}</button></article>)}</div></div>}</>}
      <input ref={picker} hidden type="file" accept="video/mp4,video/webm,video/quicktime" onChange={upload}/><p className="notice">{message}</p>
    </section>
    {path.length>1&&<section className="result">
      <div className="title"><div><p className="eyebrow blue">{c.result}</p><h2>{c.bounce}</h2></div><strong className={inside?"verdict in":"verdict out"}>{inside?c.inside:c.outside}</strong></div>
      <div className="resultGrid"><div className="courtMap"><i/><b/><em/>{map&&<span style={{left:map.x+"%",top:map.y+"%"}}/>}</div><div className="metrics"><Metric label={c.points} value={String(path.length)}/><Metric label={c.position} value={map?`${map.x.toFixed(1)}% × ${map.y.toFixed(1)}%`:"—"}/><Metric label={c.confidence} value={path.length>30?c.good:c.reviewConfidence}/><p>{c.disclaimer}</p></div></div>
    </section>}
    <section className="how"><p className="eyebrow blue">{c.how}</p><div><Info n="01" title={c.perspective} text={c.perspectiveText}/><Info n="02" title={c.trackingTitle} text={c.trackingText}/><Info n="03" title={c.projection} text={c.projectionText}/></div></section>
    <footer><a href="#top" className="logo"><i/>PROFE</a><span>{c.footer}</span></footer>
  </main>
}
function Step({n,title,text,active,done,tag}:{n:string,title:string,text:string,active:boolean,done:boolean,tag?:string}){return <div className={`step ${active?"active":""} ${done?"done":""}`}><b>{n}</b><div><strong>{title}</strong><small>{text}</small></div>{tag&&<em>{tag}</em>}</div>}
function Metric({label,value}:{label:string,value:string}){return <div><small>{label}</small><strong>{value}</strong></div>}
function Info({n,title,text}:{n:string,title:string,text:string}){return <article><b>{n}</b><h3>{title}</h3><p>{text}</p></article>}
function TrajectorySimulation({labels}:{labels:{hit:string;frontis:string;bounce:string;return:string}}){
  const route="M390 540 C350 475 285 402 222 326 C180 276 164 215 218 112 C276 160 326 230 330 292 C333 350 270 394 220 438 C187 468 174 512 190 548";
  return <svg className="trajectorySimulation" viewBox="0 0 480 640" role="img" aria-label="Simulação ilustrativa da trajetória da bola no Frontón">
    <defs><linearGradient id="courtShade" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#164d42"/><stop offset="1" stopColor="#0b2d2a"/></linearGradient><filter id="ballGlow"><feGaussianBlur stdDeviation="6" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <path d="M72 80H408V548H72Z" fill="url(#courtShade)" stroke="#b9c7c2" strokeWidth="3"/><path d="M72 80L32 120V588L72 548M408 80L448 120V588L408 548M32 588H448" fill="none" stroke="#77928b" strokeWidth="3"/><path d="M72 210H408M72 292H408M72 374H408M72 456H408" stroke="#ffffff30" strokeWidth="2"/><path d="M72 548H408M240 80V548" stroke="#ffffff65" strokeWidth="2" strokeDasharray="8 8"/>
    <path className="trajectoryGhost" d={route}/><path className="trajectoryRoute" d={route}/>
    <g className="event eventHit"><circle cx="390" cy="540" r="8"/><text x="306" y="573">1 · {labels.hit}</text></g><g className="event eventFrontis"><circle cx="218" cy="112" r="8"/><text x="238" y="106">2 · {labels.frontis}</text></g><g className="event eventBounce"><circle cx="330" cy="292" r="8"/><text x="347" y="286">3 · {labels.bounce}</text></g><g className="event eventReturn"><circle cx="190" cy="548" r="8"/><text x="98" y="580">4 · {labels.return}</text></g>
    <circle className="simBall" r="10" fill="#c9ff36" filter="url(#ballGlow)"><animateMotion dur="5.2s" begin=".35s" fill="freeze" path={route}/></circle>
  </svg>
}

function formatTime(seconds:number){const safe=Math.max(0,seconds),minutes=Math.floor(safe/60),rest=Math.floor(safe%60);return `${minutes}:${String(rest).padStart(2,"0")}`}

function finalizationClips(samples:MotionSample[],duration:number,interval:number):RallyClip[]{
  if(samples.length<4)return[];
  const sorted=samples.map(sample=>sample.score).sort((a,b)=>a-b);
  const percentile=(value:number)=>sorted[Math.min(sorted.length-1,Math.floor(sorted.length*value))];
  const quiet=percentile(.5),busy=percentile(.88),threshold=Math.max(3.5,quiet+(busy-quiet)*.38);
  const active=samples.filter(sample=>sample.score>=threshold);if(active.length<3)return[];
  const groups:{start:number;end:number;scores:number[]}[]=[];
  for(const sample of active){const last=groups.at(-1);if(!last||sample.time-last.end>Math.max(3.2,interval*2.5))groups.push({start:sample.time,end:sample.time,scores:[sample.score]});else{last.end=sample.time;last.scores.push(sample.score)}}
  const candidates=groups.filter(group=>group.end-group.start>=Math.max(1.2,interval*1.5)&&group.scores.length>=3).map(group=>{
    const end=Math.min(duration,group.end+interval),strength=group.scores.reduce((sum,value)=>sum+value,0)/group.scores.length;
    return{end,strength};
  }).filter((item,index,list)=>index===0||item.end-list[index-1].end>=6).slice(0,30);
  return candidates.map((item,id)=>({id:id+1,start:Math.max(0,item.end-5),end:Math.min(duration,item.end+2),confidence:Math.max(.45,Math.min(.96,(item.strength-threshold)/Math.max(1,busy-threshold)*.35+.58))}));
}
