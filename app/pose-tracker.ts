import type { PoseLandmarker } from "@mediapipe/tasks-vision";

export type PosePoint = { x:number; y:number; z:number; visibility?:number };
export type PoseDetector = { detectForVideo:(video:HTMLVideoElement,timestamp:number)=>{landmarks:PosePoint[][]} };

let detector:Promise<PoseLandmarker>|null=null;

export function getPoseDetector():Promise<PoseLandmarker>{
  if(!detector){
    detector=(async()=>{
      const { FilesetResolver, PoseLandmarker }=await import("@mediapipe/tasks-vision");
      const vision=await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm");
      return PoseLandmarker.createFromOptions(vision,{
        baseOptions:{modelAssetPath:"https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",delegate:"CPU"},
        runningMode:"VIDEO",
        numPoses:4,
        minPoseDetectionConfidence:.35,
        minPosePresenceConfidence:.35,
        minTrackingConfidence:.35,
        outputSegmentationMasks:false,
      });
    })().catch(error=>{detector=null;throw error});
  }
  return detector;
}
