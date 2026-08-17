"use client";

import Fronton3DLoader from "./fronton-3d-loader";

export default function TrainingPlay({lang}:{lang:"es"|"pt"}){
  const label=lang==="es"?"Simulador de jugadas 3D":"Simulador de lances 3D";
  return <Fronton3DLoader lang={lang} label={label} mode="training"/>;
}
