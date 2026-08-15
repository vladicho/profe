#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "$0")/.." && pwd)"
work_dir="$(mktemp -d)"
trap 'rm -rf "$work_dir"' EXIT

font_regular="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
font_bold="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

build_language() {
  local lang="$1"
  shift
  local -a titles=("$1" "$3" "$5" "$7" "$9" "${11}")
  local -a notes=("$2" "$4" "$6" "$8" "${10}" "${12}")
  local -a actions=("FRONTÓN" "DETECTAR" "ANALIZAR" "1 · 2 · 3 · 4" "TOCAR BOLA" "RASTREAR → SHORT")

  for i in 0 1 2 3 4 5; do
    local step=$((i+1))
    local frame="$work_dir/${lang}-${step}.png"
    local clip="$work_dir/${lang}-${step}.mp4"
    convert -size 1280x720 xc:'#061420' \
      -fill '#0d2130' -draw 'roundrectangle 690,90 1205,620 18,18' \
      -fill '#f4f5ef' -draw 'roundrectangle 712,132 1183,596 10,10' \
      -fill '#c9ff36' -draw "roundrectangle 760,$((205+i*48)) 1135,$((249+i*48)) 8,8" \
      -fill '#dce1d9' -draw 'roundrectangle 760,205 1135,249 8,8 roundrectangle 760,263 1135,307 8,8 roundrectangle 760,321 1135,365 8,8 roundrectangle 760,379 1135,423 8,8 roundrectangle 760,437 1135,481 8,8 roundrectangle 760,495 1135,539 8,8' \
      -fill '#c9ff36' -draw "roundrectangle 760,$((205+i*58)) 1135,$((249+i*58)) 8,8" \
      -fill '#075df8' -draw "circle 1160,$((227+i*58)) 1174,$((227+i*58))" \
      -fill '#c9ff36' -draw 'circle 72,64 82,64' \
      -font "$font_bold" -pointsize 28 -fill white -annotate +96+74 'PROFE' \
      -pointsize 18 -fill '#92a4af' -annotate +712+116 'TUTORIAL FRONTÓN · 00:36' \
      -font "$font_bold" -pointsize 170 -fill '#153044' -annotate +55+300 "0${step}" \
      -font "$font_bold" -pointsize 54 -fill white -annotate +70+390 "${titles[$i]}" \
      -font "$font_regular" -pointsize 25 -fill '#b8c5ce' -annotate +73+450 "${notes[$i]}" \
      -font "$font_bold" -pointsize 18 -fill '#061420' -gravity northwest -annotate +790+$((218+i*58)) "${actions[$i]}" \
      -gravity southwest -font "$font_bold" -pointsize 17 -fill '#c9ff36' -annotate +72+52 'profe.lugarerrado.com' \
      "$frame"
    ffmpeg -hide_banner -loglevel error -y -loop 1 -i "$frame" -vf "zoompan=z='min(zoom+0.00022,1.025)':d=180:s=1280x720:fps=30,fade=t=in:st=0:d=0.3,fade=t=out:st=5.7:d=0.3,format=yuv420p" -t 6 -an -c:v libx264 -preset slow -crf 27 -movflags +faststart "$clip"
  done

  : > "$work_dir/${lang}-concat.txt"
  for step in 1 2 3 4 5 6; do printf "file '%s'\n" "$work_dir/${lang}-${step}.mp4" >> "$work_dir/${lang}-concat.txt"; done
  ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i "$work_dir/${lang}-concat.txt" -c copy -movflags +faststart "$root_dir/public/tutorial-fronton-${lang}.mp4"
}

build_language pt \
  'Escolha Frontón' 'Depois, envie o vídeo permitido.' \
  'Detecte os finais' 'O Profe procura as pausas entre os lances.' \
  'Escolha o lance' 'Confira o trecho e toque em Analisar.' \
  'Marque a quadra' 'Toque nos quatro cantos, na ordem mostrada.' \
  'Selecione a bola' 'Pause e toque bem no centro da bola.' \
  'Veja a trajetória' 'Rastreie, revise e baixe o short.'

build_language es \
  'Elige Frontón' 'Después, sube el video permitido.' \
  'Detecta los finales' 'Profe busca las pausas entre jugadas.' \
  'Elige la jugada' 'Revisa el recorte y pulsa Analizar.' \
  'Marca la cancha' 'Toca las cuatro esquinas en orden.' \
  'Selecciona la pelota' 'Pausa y toca el centro de la pelota.' \
  'Mira la trayectoria' 'Rastrea, revisa y descarga el short.'

ls -lh "$root_dir/public/tutorial-fronton-pt.mp4" "$root_dir/public/tutorial-fronton-es.mp4"
