"use client";

import { ComponentType, useEffect, useState } from "react";

type Props = { lang:"es"|"pt"; label:string; mode?:"replay"|"training" };
type ReplayProps = { lang:"es"|"pt"; mode?:"replay"|"training" };

export default function Fronton3DLoader({lang,label,mode="replay"}:Props){
  const [Replay,setReplay]=useState<ComponentType<ReplayProps>|null>(null);
  useEffect(()=>{
    let active=true;
    import("./fronton-3d").then(module=>{if(active)setReplay(()=>module.default)});
    return()=>{active=false};
  },[]);
  if(!Replay)return <div className="simulationReady"><span>3D</span><strong>{label}</strong><small>THREE.JS · GLB</small></div>;
  return <Replay lang={lang} mode={mode}/>;
}
