import { mkdir, writeFile } from "node:fs/promises";
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";

class NodeFileReader {
  result = null;
  onloadend = null;
  onerror = null;
  async readAsArrayBuffer(blob) {
    try { this.result = await blob.arrayBuffer(); this.onloadend?.(); }
    catch (error) { this.onerror?.(error); }
  }
  async readAsDataURL(blob) {
    try {
      const bytes = Buffer.from(await blob.arrayBuffer());
      this.result = `data:${blob.type};base64,${bytes.toString("base64")}`;
      this.onloadend?.();
    } catch (error) { this.onerror?.(error); }
  }
}
globalThis.FileReader = NodeFileReader;

const exporter = new GLTFExporter();
const standard = (color, roughness = .72, metalness = .05) => new THREE.MeshStandardMaterial({ color, roughness, metalness });

function mesh(name, geometry, material) {
  const item = new THREE.Mesh(geometry, material);
  item.name = name;
  item.castShadow = true;
  item.receiveShadow = true;
  return item;
}

function createAthlete() {
  const root = new THREE.Group();
  root.name = "ProfeAthlete";
  root.userData = { asset: "Profe low-poly articulated athlete", license: "CC0-1.0" };
  const skin = standard(0x9f6544, .82);
  const jersey = standard(0x075df8, .62);
  const shorts = standard(0x07131c, .7);
  const shoe = standard(0xf4f7f8, .5);
  const dark = standard(0x14222a, .78);
  const parts = [
    mesh("Head", new THREE.SphereGeometry(.145, 20, 14), skin),
    mesh("Hair", new THREE.SphereGeometry(.15, 18, 10, 0, Math.PI * 2, 0, Math.PI * .46), dark),
    mesh("Torso", new THREE.CapsuleGeometry(.22, .52, 5, 12), jersey),
    mesh("Hips", new THREE.CapsuleGeometry(.16, .34, 4, 10), shorts),
    mesh("UpperArmL", new THREE.CylinderGeometry(.09, .105, 1, 12), jersey),
    mesh("LowerArmL", new THREE.CylinderGeometry(.065, .085, 1, 12), skin),
    mesh("HandL", new THREE.SphereGeometry(.075, 12, 9), skin),
    mesh("UpperArmR", new THREE.CylinderGeometry(.09, .105, 1, 12), jersey),
    mesh("LowerArmR", new THREE.CylinderGeometry(.065, .085, 1, 12), skin),
    mesh("HandR", new THREE.SphereGeometry(.075, 12, 9), skin),
    mesh("UpperLegL", new THREE.CylinderGeometry(.105, .135, 1, 12), shorts),
    mesh("LowerLegL", new THREE.CylinderGeometry(.075, .10, 1, 12), skin),
    mesh("ShoeL", new THREE.BoxGeometry(.2, .11, .36), shoe),
    mesh("UpperLegR", new THREE.CylinderGeometry(.105, .135, 1, 12), shorts),
    mesh("LowerLegR", new THREE.CylinderGeometry(.075, .10, 1, 12), skin),
    mesh("ShoeR", new THREE.BoxGeometry(.2, .11, .36), shoe),
  ];
  parts.forEach((part, index) => { part.position.x = (index % 4) * .01; root.add(part); });
  return root;
}

function createRacket() {
  const root = new THREE.Group();
  root.name = "RacketRoot";
  root.userData = { asset: "Profe fronton racket", license: "CC0-1.0" };
  const grip = standard(0x15191c, .92);
  const frame = standard(0xe7edf0, .35, .72);
  const accent = standard(0xc9ff36, .5, .15);
  const strings = standard(0xf8fbfc, .55, .35);
  const handle = mesh("Grip", new THREE.CylinderGeometry(.045, .052, .28, 12), grip);
  handle.position.y = .14;
  const collar = mesh("Collar", new THREE.CylinderGeometry(.06, .045, .08, 12), accent);
  collar.position.y = .32;
  const shaft = mesh("Shaft", new THREE.CylinderGeometry(.022, .026, .32, 10), frame);
  shaft.position.y = .49;
  const hoop = mesh("Hoop", new THREE.TorusGeometry(.255, .026, 10, 34), frame);
  hoop.scale.set(.78, 1.08, 1);
  hoop.position.y = .83;
  root.add(handle, collar, shaft, hoop);
  for (let i = -3; i <= 3; i++) {
    const string = mesh(`StringV${i + 3}`, new THREE.BoxGeometry(.005, .47 - Math.abs(i) * .035, .005), strings);
    string.position.set(i * .05, .83, 0);
    root.add(string);
  }
  for (let i = -3; i <= 3; i++) {
    const string = mesh(`StringH${i + 3}`, new THREE.BoxGeometry(.36 - Math.abs(i) * .03, .005, .005), strings);
    string.position.set(0, .83 + i * .065, 0);
    root.add(string);
  }
  return root;
}

async function save(scene, file) {
  const result = await exporter.parseAsync(scene, { binary: true, onlyVisible: false });
  await writeFile(file, Buffer.from(result));
}

await mkdir(new URL("../public/models/", import.meta.url), { recursive: true });
await save(createAthlete(), new URL("../public/models/profe-athlete.glb", import.meta.url));
await save(createRacket(), new URL("../public/models/fronton-racket.glb", import.meta.url));
