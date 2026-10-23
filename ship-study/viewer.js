import * as THREE from 'three';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import {RoomEnvironment} from './vendor/RoomEnvironment.js';
import {initSystems} from './systems.js?v=20261018k';
const embedded=new URLSearchParams(location.search).get('embed')==='1';
if(embedded)document.body.classList.add('embedded');
const canvas=document.getElementById('scene');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.85;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.background=new THREE.Color('#0b1017');
const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment(renderer);scene.environment=pmrem.fromScene(room,.035).texture;room.dispose();pmrem.dispose();
const camera=new THREE.PerspectiveCamera(37,innerWidth/innerHeight,.1,120);
function viewScale(aspect){return aspect<1?1.85/aspect:Math.max(1,1.4/aspect);}
function fitted(pos){return new THREE.Vector3(...pos).multiplyScalar(viewScale(camera.aspect));}
camera.position.copy(fitted([-9,9,-12]));
const center=new THREE.Vector3(-1.2,0,0);
const controls=new OrbitControls(camera,canvas);controls.target.copy(center);controls.enableDamping=true;controls.dampingFactor=.08;controls.minDistance=4;controls.maxDistance=70;controls.autoRotateSpeed=.65;controls.enablePan=true;
controls.minPolarAngle=.001;controls.maxPolarAngle=Math.PI-.001;
const hemi=new THREE.HemisphereLight(0xd3e7ff,0x30343b,.3);scene.add(hemi);
const key=new THREE.DirectionalLight(0xfff2dc,2.3);key.position.set(1,8,-5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:.1,far:28});key.shadow.bias=-.0003;key.shadow.normalBias=.025;scene.add(key);
const rim=new THREE.DirectionalLight(0x9cceff,1.1);rim.position.set(-5,3,8);scene.add(rim);
const fill=new THREE.DirectionalLight(0xf0e0cb,.5);fill.position.set(7,-4,5);scene.add(fill);
let model,systemControls,transition=null,last=0;
let pendingState=null;
if(embedded)addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==parent)return;
 if(event.data?.type==='ship-systems-state'){
  pendingState=event.data;
  systemControls?.setDamage(pendingState.damage);
 }else if(event.data?.type==='ship-system-repair-denied'){
  systemControls?.repairDenied(event.data.reason||'無法更換零件');
 }
});
function focus(pos){controls.autoRotate=false;document.getElementById('spin').setAttribute('aria-pressed','false');transition={start:performance.now(),from:camera.position.clone(),to:fitted(pos),target:controls.target.clone()};}
document.getElementById('home').onclick=()=>{systemControls?.reset();focus([-9,9,-12]);};
document.getElementById('spin').onclick=e=>{controls.autoRotate=!controls.autoRotate;e.currentTarget.setAttribute('aria-pressed',String(controls.autoRotate));};
document.getElementById('light').onclick=e=>{const soft=e.currentTarget.getAttribute('aria-pressed')!=='true';e.currentTarget.setAttribute('aria-pressed',String(soft));key.intensity=soft?1.2:2.3;hemi.intensity=soft?.8:.3;renderer.toneMappingExposure=soft?1:.85;};
controls.addEventListener('start',()=>{transition=null;controls.autoRotate=false;document.getElementById('spin').setAttribute('aria-pressed','false');});
new GLTFLoader().load('explorer-study.glb',g=>{
 model=g.scene;scene.add(model);model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats){m.envMapIntensity=.65;for(const key of ['map','normalMap','metalnessMap','roughnessMap'])if(m[key])m[key].anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());}}});
 systemControls=initSystems({THREE,scene,camera,canvas,controls,model,
  onCockpit:()=>embedded?parent.postMessage({type:'ship-systems-cockpit'},location.origin):location.assign(new URL('../0919-cinematic.html?entry=cockpit',location.href)),
  onRepairRequest:item=>{if(embedded)parent.postMessage({type:'ship-system-repair-request',id:item.id},location.origin);}
 });
 if(embedded){if(pendingState)systemControls.setDamage(pendingState.damage);parent.postMessage({type:'ship-systems-ready'},location.origin);}
 document.getElementById('load').hidden=true;document.getElementById('status').textContent='GLB · PBR · 360°';
},undefined,e=>{console.error(e);document.getElementById('load').textContent='模型載入失敗，請從本機預覽網址開啟。';});
function tick(t){requestAnimationFrame(tick);if(document.hidden||t-last<25)return;last=t;
 if(transition){let f=Math.min(1,(t-transition.start)/800);f=f*f*(3-2*f);camera.position.lerpVectors(transition.from,transition.to,f);controls.target.lerpVectors(transition.target,center,f);if(f>=1)transition=null;}
 controls.update();renderer.render(scene,camera);
}requestAnimationFrame(tick);
addEventListener('resize',()=>{const nextAspect=innerWidth/innerHeight,oldScale=viewScale(camera.aspect),newScale=viewScale(nextAspect);if(Number.isFinite(nextAspect)&&nextAspect>0&&Math.abs(newScale-oldScale)>.01){camera.position.sub(controls.target).multiplyScalar(newScale/oldScale).add(controls.target);transition=null;}camera.aspect=nextAspect;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
canvas.addEventListener('keydown',e=>{if(e.key==='Home'){focus([-9,9,-12]);e.preventDefault();}});
