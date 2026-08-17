"use client";

import { useEffect, useState } from "react";

type Lang="es"|"pt";

const TEXT={
  es:{play:"Reproducir jugada",replay:"Repetir",valid:"JUGADA VÁLIDA",detail:"Un pique en el suelo antes de la devolución del jugador B.",racketA:"Raqueta A",left:"Pared izquierda",front:"Frontis",floor:"Suelo",racketB:"Raqueta B"},
  pt:{play:"Reproduzir lance",replay:"Repetir",valid:"LANCE VÁLIDO",detail:"Um quique no chão antes da devolução do jogador B.",racketA:"Raquete A",left:"Parede esquerda",front:"Frontis",floor:"Chão",racketB:"Raquete B"}
};

const EVENTS=[
  {code:"RA",x:710,y:365,key:"racketA"},
  {code:"L163",x:166,y:244,key:"left"},
  {code:"F86",x:330,y:92,key:"front"},
  {code:"C143",x:505,y:322,key:"floor"},
  {code:"RB",x:600,y:374,key:"racketB"}
] as const;

export default function TrainingPlay({lang}:{lang:Lang}){
  const [run,setRun]=useState(0),[active,setActive]=useState(-1);const t=TEXT[lang];
  useEffect(()=>{if(!run)return;const timers=EVENTS.slice(1).map((_,index)=>window.setTimeout(()=>setActive(index+1),(index+1)*1200));return()=>timers.forEach(window.clearTimeout)},[run]);
  function play(){setActive(0);setRun(value=>value+1)}
  return <div className="trainingPlay">
    <div className="trainingBoard">
      <svg key={run} viewBox="0 0 860 470" role="img" aria-label="Lance de treinamento construído com cinco contatos">
        <defs><linearGradient id="trainingFloor" x1="0" x2="1"><stop stopColor="#164a41"/><stop offset="1" stopColor="#0d302f"/></linearGradient><filter id="ballGlow"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
        <path d="M102 410 286 72 774 72 756 410Z" fill="url(#trainingFloor)" stroke="#b9d8d1" strokeWidth="3"/>
        <path d="M102 410 102 142 286 72 286 410Z" fill="#123c39" stroke="#86aaa4" strokeWidth="2"/>
        <path d="M286 72 774 72 774 235 286 410Z" fill="#17463e" stroke="#86aaa4" strokeWidth="2"/>
        <g className="trainingGrid"><path d="M138 342 759 342M174 276 763 276M210 210 767 210M246 144 771 144"/><path d="M194 410 377 72M286 410 469 72M378 410 561 72M470 410 653 72M562 410 745 72M654 410 774 188"/></g>
        <path className="trainingGhost" d="M710 365 Q390 270 166 244 Q220 132 330 92 Q500 175 505 322 Q550 362 600 374"/>
        <path className="trainingRoute" d="M710 365 Q390 270 166 244 Q220 132 330 92 Q500 175 505 322 Q550 362 600 374"/>
        {EVENTS.map((event,index)=><g className={`trainingEvent ${active>=index?"seen":""}`} key={event.code} transform={`translate(${event.x} ${event.y})`}><circle r="18"/><text textAnchor="middle" y="4">{event.code}</text></g>)}
        {run>0&&<circle className="trainingBall" r="9" fill="#c9ff36" filter="url(#ballGlow)"><animateMotion dur="6s" path="M710 365 Q390 270 166 244 Q220 132 330 92 Q500 175 505 322 Q550 362 600 374" fill="freeze"/></circle>}
        <text x="318" y="55" className="trainingSurface">FRONTIS · F</text><text x="112" y="132" className="trainingSurface">LEFT · L</text><text x="635" y="397" className="trainingSurface">CEMENT · C</text>
      </svg>
    </div>
    <div className="trainingPanel">
      <div className="trainingVerdict"><b>{t.valid}</b><span>{t.detail}</span></div>
      <ol>{EVENTS.map((event,index)=><li className={active===index?"active":active>index?"done":""} key={event.code}><b>{event.code}</b><span>{t[event.key]}</span></li>)}</ol>
      <button onClick={play}>▶ {run?t.replay:t.play}</button>
    </div>
  </div>
}
