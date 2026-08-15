"use client";

import { ChangeEvent, MouseEvent, useEffect, useRef, useState } from "react";

type P = { x:number; y:number; t:number };
type Stage = "court" | "ball" | "ready" | "tracking" | "done";
type Lang = "es" | "pt";
type Sport = "fronton" | "racquetball";

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
    changeSport:"Cambiar deporte"
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
    changeSport:"Trocar esporte"
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
    if(src)URL.revokeObjectURL(src);setSrc(URL.createObjectURL(f));setCourt([]);setPath([]);setRgb(null);setStage("court");setProgress(0);
    setMessage(c.corners);
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
    let best:P|null=null,score=Infinity,rad=Math.max(90,w*.14);
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
    const pts=[...path],start=v.currentTime,end=Math.min(v.duration,start+12);
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
    <section className="lab">
      <div className="title"><div><p className="eyebrow blue">{c.center}</p><h2>{c.review}</h2></div><small>{c.time}</small></div>
      {!sport?<div className="sportPick"><h3>{c.choose}</h3><div><button onClick={()=>{setSport("fronton");setMessage(c.initial)}}><span>F</span><strong>{c.fronton}</strong><small>{c.frontonText}</small></button><button onClick={()=>{setSport("racquetball");setMessage(c.initial)}}><span>R</span><strong>{c.racquetball}</strong><small>{c.racquetText}</small></button></div></div>:
      !src?<><div className="sportBar"><b>{sport==="fronton"?c.fronton:c.racquetball}</b><button onClick={()=>setSport(null)}>{c.changeSport}</button></div><div className="sources">
        <button className="upload" onClick={()=>picker.current?.click()}><span>↑</span><strong>{c.upload}</strong><small>{c.uploadHelp}</small></button>
        <div className="external"><strong>{c.videoLink}</strong><div><input value={link} onChange={e=>setLink(e.target.value)} placeholder="YouTube ou Facebook"/><button onClick={()=>setMessage(c.linkMessage)}>{c.useLink}</button></div><small>{c.linkHelp}</small></div>
      </div></>:<div className="analyzer">
        <div className="screen"><video ref={video} src={src} controls playsInline onLoadedMetadata={draw} onTimeUpdate={draw}/><canvas ref={overlay} onClick={clickVideo}/><div className="screenStatus"><span>{message}</span><b>{Math.round(progress)}%</b></div><i className="bar" style={{width:progress+"%"}}/></div>
        <aside>
          <div className="activeSport">{sport==="fronton"?c.fronton:c.racquetball}</div>
          <Step n="01" title={c.calibrate} text={c.calibrateHelp} active={stage==="court"} done={court.length===4} tag={court.length+"/4"}/>
          <Step n="02" title={c.selectBall} text={c.selectHelp} active={stage==="ball"} done={!!rgb}/>
          <Step n="03" title={c.tracking} text={c.trackingHelp} active={stage==="ready"||stage==="tracking"} done={stage==="done"}/>
          <button className="primary" disabled={!rgb||stage==="tracking"} onClick={track}>{stage==="tracking"?c.analyzing:c.start}</button>
          <button className="secondary" onClick={restart}>{c.restart}</button>
          <button className="linkBtn" onClick={()=>setSrc("")}>{c.another}</button>
        </aside>
      </div>}
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
