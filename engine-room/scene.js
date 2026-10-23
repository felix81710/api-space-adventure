import * as THREE from 'three';
import {RoomEnvironment} from '../ship-study/vendor/RoomEnvironment.js';
import {iconSvg,drawIcon} from '../cockpit/icons.js?v=20261023j';
import {projectControlRect} from './model-controls.js?v=20261023i';

const $=id=>document.getElementById(id),canvas=$('reactor'),embedded=parent!==window,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,outputModes=window.ExplorerEngineModes;
let renderer;try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}catch(error){$('loading').innerHTML='<strong>無法啟動引擎艙</strong><a href="../0919-cinematic.html?entry=cockpit&view=dashboard">返回控制面板</a>';throw error;}
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.4));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.16;
const scene=new THREE.Scene();scene.background=new THREE.Color('#040913');scene.fog=new THREE.FogExp2('#040913',.018);
const environment=new RoomEnvironment(renderer),pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(environment,.04).texture;environment.dispose();pmrem.dispose();
const camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.08,100),room=new THREE.Group();scene.add(room);
let state={failed:false,practice:false,paused:false,outputMode:'standard',phase:0,time:0,coolant:50,plasma:50,coolantRange:null,plasmaRange:null,sub:null,reboot:null,rebootStep:0,temp:3450,quant:99.8,economy:false,radiator:false,locked:false,fuel:100,shield:100};
const targets=[],levers={},keys=[],rings=[],animatedLeds=[],rangeDragging=new Set();let lastFrame=0,toastTimer;
const brushedCanvas=document.createElement('canvas');brushedCanvas.width=brushedCanvas.height=256;const bc=brushedCanvas.getContext('2d');bc.fillStyle='#aeb7bd';bc.fillRect(0,0,256,256);for(let i=0;i<700;i++){const y=(i*73)%256;bc.strokeStyle=i%3?'#69778018':'#e5edf328';bc.beginPath();bc.moveTo(0,y);bc.lineTo(256,y);bc.stroke();}const brushed=new THREE.CanvasTexture(brushedCanvas);brushed.colorSpace=THREE.SRGBColorSpace;brushed.wrapS=brushed.wrapT=THREE.RepeatWrapping;brushed.repeat.set(2,2);
const metal=(color,roughness=.44,metalness=.8)=>new THREE.MeshStandardMaterial({color,metalness,roughness,map:brushed,envMapIntensity:.65});
const mats={dark:metal('#182634',.5),steel:metal('#8898a5',.36),silver:metal('#c8d4d7',.31),black:metal('#07121f',.55),copper:metal('#9e754f',.36),blue:metal('#28566b',.4)};
const emissive=(color,power=1)=>new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:power,metalness:.3,roughness:.34});
const cyan=emissive('#8ce9ef',1.5),blue=emissive('#559de8',1.2),green=emissive('#a6e4bb',.9),red=emissive('#ff7050',1.3),amber=emissive('#eac586',.8);
function box(parent,w,h,d,x,y,z,material=mats.dark){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
function cylinder(parent,r1,r2,h,x,y,z,material=mats.steel,segments=48){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,segments),material);mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
function tube(parent,a,b,r,material=mats.steel){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),v=bv.clone().sub(av),mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,v.length(),8),material);mesh.position.copy(av.add(bv).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());parent.add(mesh);return mesh;}
function torus(parent,r,t,material,x=0,y=0,z=0){const mesh=new THREE.Mesh(new THREE.TorusGeometry(r,t,8,96),material);mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
function screw(parent,x,y,z){const mesh=cylinder(parent,.033,.033,.025,x,y,z,mats.silver,8);mesh.rotation.x=Math.PI/2;box(parent,.035,.007,.006,x,y,z+.018,mats.black);}
function graphic(parent,icon,w,h,x,y,z,color='#b9deed',label=''){
 const c=document.createElement('canvas');c.width=384;c.height=Math.round(384*h/w);const ctx=c.getContext('2d');drawIcon(ctx,icon,192,c.height*(label?.4:.5),Math.min(384*.65,c.height*.72),{color,accent:'#e8f5ef',ink:'#183348'});if(label){ctx.fillStyle='#b7cbd6';ctx.textAlign='center';ctx.font='24px "Microsoft JhengHei",sans-serif';ctx.fillText(label,192,c.height*.89);}
 const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture,transparent:true,toneMapped:false,depthWrite:false}));mesh.position.set(x,y,z);parent.add(mesh);return mesh;
}
function interactive(mesh,action,id){mesh.userData.action=action;mesh.userData.id=id;targets.push(mesh);return mesh;}
function panel(w,h,x,y,z,rx=0,ry=0){const g=new THREE.Group();g.position.set(x,y,z);g.rotation.set(rx,ry,0);room.add(g);box(g,w+.12,h+.12,.16,0,0,0,mats.steel);box(g,w,h,.1,0,0,.12,mats.black);for(const x of [-w/2+.09,w/2-.09])for(const y of [-h/2+.09,h/2-.09])screw(g,x,y,.19);return g;}
function key(parent,action,id,icon,x,y,color='#a8cde2',shape='',label=''){
 const g=new THREE.Group();g.position.set(x,y,.2);parent.add(g);const rim=box(g,.6,.67,.11,0,0,-.01,mats.black.clone()),cap=box(g,.53,.59,.16,0,0,.075,metal(new THREE.Color(color).multiplyScalar(.23),.4,.5));const lamp=box(g,.32,.027,.025,0,.244,.174,blue.clone());let face;
 if(!shape)face=graphic(g,icon,.43,.45,0,-.01,.167,color,label);
 if(shape){const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.font='85px Arial';ctx.fillText(shape,64,66);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;face=new THREE.Mesh(new THREE.PlaneGeometry(.38,.38),new THREE.MeshBasicMaterial({map:tex,transparent:true,toneMapped:false}));face.position.z=.18;g.add(face);}
 interactive(cap,action,id);keys.push({group:g,cap,rim,face,baseColor:cap.material.color.clone(),lamp,action,id,until:0});return g;
}

// A layered industrial reactor bay, with all major detail kept below the orb's sightline.
cylinder(room,6.5,6.8,.23,0,-.35,-1,mats.dark,96);
const deckRim=torus(room,6.23,.07,mats.steel,0,-.2,-1);deckRim.rotation.x=Math.PI/2;
for(const r of [2.5,3.3,5.65]){const strip=torus(room,r,.018,r===5.65?blue:cyan,0,-.22,-1);strip.rotation.x=Math.PI/2;}
box(room,4,.18,8,0,-.35,4,mats.dark);for(let z=.5;z<8;z+=.7){box(room,4,.018,.025,0,-.25,z,mats.steel);for(const x of [-1.88,1.88])box(room,.04,.025,.32,x,-.23,z,cyan);}
for(let i=0;i<16;i++){const a=i*Math.PI/8;tube(room,[Math.cos(a)*3,-.22,-1+Math.sin(a)*3],[Math.cos(a)*5.7,-.22,-1+Math.sin(a)*5.7],.025,mats.steel);}
box(room,13,8,.4,0,3.5,-5.1,mats.black);
const rearRing=torus(room,4.3,.16,mats.steel,0,2.75,-4.8),rearGlow=torus(room,4.12,.025,blue,0,2.75,-4.6);
for(const side of [-1,1]){
 box(room,.3,6,9,side*6.1,2.3,-1.5,mats.dark);box(room,.12,3.5,5,side*5.9,2,-1.8,mats.steel);
 for(let j=0;j<10;j++)box(room,.16,.1,2.1,side*5.78,.6+j*.31,-2,mats.black);
 for(let j=0;j<3;j++){tube(room,[side*(4.6+j*.3),0,-3.8],[side*(4.6+j*.3),5.7,-3.8],.07,j===1?mats.copper:mats.steel);}
 const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(side*1.1,.25,-1),new THREE.Vector3(side*2,.2,-2),new THREE.Vector3(side*3.8,.35,-3.7),new THREE.Vector3(side*4.5,2.8,-4)]);
 room.add(new THREE.Mesh(new THREE.TubeGeometry(curve,36,.13,8,false),mats.dark));
 for(let j=0;j<4;j++)box(room,.05,.5,.08,side*5.72,1.1+j*1.1,-3.1,cyan);
}
for(let i=0;i<12;i++){const a=i*Math.PI/6,x=Math.cos(a)*4.3,y=2.75+Math.sin(a)*4.3;box(room,.32,.32,.25,x,y,-4.55,mats.silver);const led=box(room,.11,.11,.035,x,y,-4.4,i%3?blue:amber);animatedLeds.push(led);}

const reactor=new THREE.Group();reactor.position.set(0,2.8,-1);room.add(reactor);
cylinder(room,1.8,2.05,.35,0,.04,-1,mats.steel);cylinder(room,1.5,1.65,.65,0,.5,-1,mats.dark);cylinder(room,1.56,1.56,.12,0,.88,-1,mats.silver);
for(let i=0;i<16;i++){const a=i*Math.PI/8;box(room,.17,.42,.17,Math.cos(a)*1.55,.48,-1+Math.sin(a)*1.55,mats.silver);box(room,.06,.18,.05,Math.cos(a)*1.64,.54,-1+Math.sin(a)*1.64,cyan);}
for(const y of [-1.73,1.73]){const hoop=torus(reactor,1.33,.1,mats.steel,0,y,0);hoop.rotation.x=Math.PI/2;const glowRing=torus(reactor,1.27,.035,cyan,0,y+.02,0);glowRing.rotation.x=Math.PI/2;}
for(const side of [-1,1]){tube(reactor,[side*1.52,-1.65,.2],[side*2.02,-.6,.2],.12,mats.steel);tube(reactor,[side*2.02,-.6,.2],[side*2.02,.6,.2],.12,mats.steel);tube(reactor,[side*2.02,.6,.2],[side*1.52,1.65,.2],.12,mats.steel);box(reactor,.2,.64,.24,side*2.02,0,.2,mats.dark);box(reactor,.055,.42,.035,side*2.02,0,.34,cyan);}
for(let i=0;i<3;i++){
 const g=new THREE.Group();g.rotation.set(i*.65,.35+i*.55,i*.8);reactor.add(g);torus(g,1.95+i*.07,.075,mats.steel);torus(g,1.88+i*.07,.02,i===1?blue:cyan);
 for(let j=0;j<8;j++){const a=j*Math.PI/4;const clamp=box(g,.22,.24,.21,Math.cos(a)*(1.95+i*.07),Math.sin(a)*(1.95+i*.07),0,j%2?mats.dark:mats.copper);clamp.rotation.z=a;}
 rings.push(g);
}
const energyUniforms={time:{value:0},danger:{value:0},phase:{value:0},power:{value:.5},modeTint:{value:new THREE.Color(outputModes.standard.coreColor)},outputScale:{value:1}};
const energyMaterial=new THREE.ShaderMaterial({uniforms:energyUniforms,vertexShader:`varying vec3 p;varying vec3 n;varying vec3 view;void main(){p=position;n=normalize(normalMatrix*normal);vec4 v=modelViewMatrix*vec4(position,1.0);view=-v.xyz;gl_Position=projectionMatrix*v;}`,fragmentShader:`
 varying vec3 p;varying vec3 n;varying vec3 view;uniform float time;uniform float danger;uniform float phase;uniform float power;uniform vec3 modeTint;uniform float outputScale;
 void main(){vec3 q=normalize(p);float t=time;float flow=sin(q.x*7.0+sin(q.y*8.0-t*.5)+t*.35)*cos(q.z*6.0-q.y*4.0+t*.42);float detail=sin(q.x*23.0+sin(q.z*13.0+t*.3))*sin(q.y*19.0-t*.6);float filaments=pow(1.0-abs(sin(flow*3.2+detail*.24)),13.0);float body=.5+.5*flow;float fresnel=pow(1.0-max(0.0,dot(normalize(n),normalize(view))),2.5);vec3 cool=mix(modeTint*.035,modeTint*.65,body);cool+=mix(vec3(.6,.9,1.0),modeTint,.55)*filaments*(1.1+power)*outputScale;cool+=modeTint*fresnel*1.8;vec3 hot=mix(vec3(.12,.006,.025),vec3(.9,.14,.015),body);hot+=vec3(1.0,.68,.25)*filaments*1.9;float warm=danger*(phase<2.5?1.0:.55);vec3 color=mix(cool,hot,warm);float shine=pow(max(0.0,dot(normalize(n),normalize(vec3(-.5,.9,1.0)))),12.0);color+=vec3(.2,.34,.4)*shine;gl_FragColor=vec4(color,1.0);}`});
const energyBall=new THREE.Mesh(new THREE.SphereGeometry(1.49,64,40),energyMaterial);reactor.add(energyBall);interactive(energyBall,'focus');
const shell=new THREE.Mesh(new THREE.SphereGeometry(1.57,48,32),new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.BackSide,blending:THREE.AdditiveBlending,uniforms:{tint:{value:new THREE.Color('#2a9de9')}},vertexShader:'varying vec3 n;varying vec3 v;void main(){n=normalize(normalMatrix*normal);vec4 p=modelViewMatrix*vec4(position,1.0);v=-p.xyz;gl_Position=projectionMatrix*p;}',fragmentShader:'varying vec3 n;varying vec3 v;uniform vec3 tint;void main(){float f=pow(1.0-abs(dot(normalize(n),normalize(v))),2.4);gl_FragColor=vec4(tint,f*.7);}'}));reactor.add(shell);
const haloCanvas=document.createElement('canvas');haloCanvas.width=haloCanvas.height=128;const hc=haloCanvas.getContext('2d'),hg=hc.createRadialGradient(64,64,0,64,64,64);hg.addColorStop(0,'#c9ffff90');hg.addColorStop(.35,'#80bfff55');hg.addColorStop(1,'#3150ff00');hc.fillStyle=hg;hc.fillRect(0,0,128,128);const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(haloCanvas),color:'#4cb6ff',transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:.42}));halo.scale.set(6.5,6.5,1);reactor.add(halo);
let seed=91;const rand=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296),points=[];
for(let i=0;i<420;i++){const a=rand()*6.283,z=rand()*2-1,r=1.52+rand()*.12,k=Math.sqrt(1-z*z);points.push(Math.cos(a)*k*r,z*r,Math.sin(a)*k*r);}
const particleGeo=new THREE.BufferGeometry();particleGeo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));const particles=new THREE.Points(particleGeo,new THREE.PointsMaterial({color:'#b9f4ff',size:.018,transparent:true,opacity:.65,blending:THREE.AdditiveBlending,depthWrite:false}));reactor.add(particles);

const left=panel(2.05,2.35,-3.35,1.65,1.1,-.17,.25),right=panel(2.15,2.35,3.35,1.65,1.1,-.17,-.25);
function lever(id,x,icon,color){
 box(left,.36,1.64,.04,x,.07,.205,mats.steel);const rail=box(left,.1,1.46,.09,x,.07,.23,mats.black);interactive(rail,'lever',id);rail.userData.panel=left;
 const band=box(left,.31,.24,.012,x,.07,.265,green);band.visible=false;
 for(let j=0;j<=10;j++)box(left,j%5===0?.18:.1,.013,.015,x-.32,-.63+j*.14,.23,mats.silver);
 const handle=new THREE.Group();handle.position.set(x,.07,.3);left.add(handle);box(handle,.48,.2,.1,0,0,0,mats.black);const cap=box(handle,.43,.16,.14,0,0,.06,mats.silver);box(handle,.31,.035,.015,0,0,.142,emissive(color,.7));interactive(cap,'lever',id);cap.userData.panel=left;
 graphic(left,icon,.38,.38,x,-.94,.22,color);levers[id]={handle,band,x};
}
lever('coolant',-.5,'radiator','#a1e4e2');lever('plasma',.5,'engine','#d6c1f4');
for(const [i,id,icon,color]of [[0,'cool','radiator','#a4e3e7'],[1,'mag','map','#dfc38e'],[2,'shd','shield','#9bcaf2']])key(right,'sub',id,icon,(i-1)*.67,.55,color);
for(const [i,id,color,shape]of [[0,'r','#edaa92','△'],[1,'y','#ebd194','○'],[2,'b','#8ed0ec','◇']])key(right,'reboot',id,'reset',(i-1)*.67,-.4,color,shape);
for(let i=0;i<4;i++)box(right,.075,.025,.015,-.2+i*.14,1.02,.22,i===0?green:blue);
const utilities=panel(3.55,.85,0,.29,3.1,-.73);
for(const [i,id]of ['economy','standard','boost'].entries()){const profile=outputModes[id];key(utilities,'mode',id,profile.icon,(i-1.5)*.8,0,profile.color,'',profile.label);}
key(utilities,'drill',null,'warning',1.2,0,'#ffac8f','','演練');
scene.add(new THREE.HemisphereLight('#a8c9dc','#0d1725',1.15));const mainLight=new THREE.DirectionalLight('#d2e4ef',2.8);mainLight.position.set(-7,10,8);scene.add(mainLight);const fillLight=new THREE.PointLight('#aaccff',35,16,2);fillLight.position.set(0,6,5);scene.add(fillLight);const coreLight=new THREE.PointLight('#64bdff',26,8,2);coreLight.position.set(0,2.8,-.7);scene.add(coreLight);const warmLight=new THREE.PointLight('#e2a86d',16,12,2);warmLight.position.set(5,3,-1);scene.add(warmLight);

for(const node of document.querySelectorAll('[data-icon]'))node.innerHTML=iconSvg(node.dataset.icon);
function canOperate(action,id){if(state.paused&&!['back','emergency','focus'].includes(action))return false;if(action==='focus'||action==='back'||action==='ship'||action==='emergency')return true;if(action==='reboot')return state.failed&&state.phase===3&&state.reboot===id;if(action==='sub')return state.failed?state.phase===2:!state.locked;if(action==='coolant'||action==='plasma'||action==='lever')return !state.locked||state.failed;return !state.locked;}
function send(action,extra={}){if(!canOperate(action,extra.id))return;if(embedded)parent.postMessage({type:'quantum-engine-action',action,...extra},location.origin);else toast('請從遊戲的引擎頁開啟，連動引擎操作。');for(const k of keys)if(k.action===action&&(!extra.id||k.id===extra.id))k.until=performance.now()+160;}
function toast(text){if(!text)return;$('room-toast').textContent=text;$('room-toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('room-toast').hidden=true,2400);}
for(const id of ['coolant','plasma']){
 const input=$(id);input.addEventListener('pointerdown',()=>rangeDragging.add(id));input.addEventListener('pointerup',()=>rangeDragging.delete(id));input.addEventListener('pointercancel',()=>rangeDragging.delete(id));input.addEventListener('input',()=>{const value=Number(input.value);state[id]=value;paintLever(id);send(id,{value});});
}
for(const node of document.querySelectorAll('[data-sub]'))node.onclick=()=>send('sub',{id:node.dataset.sub});
for(const node of document.querySelectorAll('[data-reboot]'))node.onclick=()=>send('reboot',{id:node.dataset.reboot});
for(const node of document.querySelectorAll('[data-action]'))node.onclick=()=>send(node.dataset.action);
for(const node of document.querySelectorAll('[data-mode]'))node.onclick=()=>send('mode',{id:node.dataset.mode});
const modelControls=keys.map(key=>({group:key.group,w:.57,h:.63,z:.18,node:document.querySelector(key.action==='sub'?`[data-sub="${key.id}"]`:key.action==='reboot'?`[data-reboot="${key.id}"]`:key.action==='mode'?`[data-mode="${key.id}"]`:`[data-action="${key.action}"]`)}));
for(const id of ['coolant','plasma'])modelControls.push({group:left,x:levers[id].x,y:.07,z:.35,w:.54,h:1.64,node:$(id)});
function projectControls(){
 for(const control of modelControls){
  const rect=projectControlRect(control,camera,innerWidth,innerHeight),node=control.node;
  const signature=rect.visible?[rect.left,rect.top,rect.width,rect.height].map(n=>n.toFixed(1)).join('|'):'hidden';
  if(control.signature===signature)continue;control.signature=signature;
  node.style.visibility=rect.visible?'visible':'hidden';
  if(!rect.visible)continue;
  node.style.left=rect.left+'px';node.style.top=rect.top+'px';node.style.width=rect.width+'px';node.style.height=rect.height+'px';
 }
}
$('back').onclick=()=>send('back');$('drill').onclick=()=>send('drill');$('emergency').onclick=()=>send('emergency');$('view-reset').onclick=resetView;
function paintLever(id){
 const value=state[id],range=state[id+'Range'],lever=levers[id];lever.handle.position.y=-.63+1.4*value/100;lever.band.visible=!!range;if(range){lever.band.position.y=-.63+1.4*(range[0]+range[1])/200;lever.band.scale.y=Math.max(.1,1.4*(range[1]-range[0])/100)/.24;}
 if(!rangeDragging.has(id)&&drag?.id!==id)$(id).value=value;
 $(id).setAttribute('aria-valuetext',Math.round(value)+'%'+(range?'，綠色區域 '+range[0]+' 到 '+range[1]+'%':''));
}
function applyState(next){
 const wasFailed=state.failed;state={...state,...next};const profile=outputModes[state.outputMode]||outputModes.standard;document.body.classList.toggle('fault',state.failed);document.body.classList.toggle('paused',state.paused);const instruction=state.failed?(state.phase===1?'拉桿 → 綠色區域':state.phase===2?'點選發光的分流按鈕':'依光圈重啟核心'):profile.label+' · 核心穩定';$('room-status').textContent=state.paused?'已暫停':(state.failed&&state.practice?'練習 · 不限時 · ':'')+instruction;$('countdown').hidden=!state.failed;$('countdown').textContent=state.practice?'∞':state.time+'s';$('countdown').setAttribute('aria-label',state.practice?'不限時練習':'剩餘 '+state.time+' 秒');$('repair-steps').hidden=!state.failed;
 $('output-percent').textContent=state.failed?'—':profile.output;$('output-icon').innerHTML=iconSvg(state.failed?'warning':profile.icon);$('output-reading').style.color=state.failed?'#ffac8f':profile.color;$('output-reading').setAttribute('aria-label',state.failed?'核心故障，輸出不穩定':profile.label+'模式，'+profile.output+'% 輸出');
 for(const node of document.querySelectorAll('[data-mode]')){node.disabled=state.paused||state.locked||state.failed;node.setAttribute('aria-pressed',String(node.dataset.mode===state.outputMode));}
 for(const node of document.querySelectorAll('[data-phase]')){node.classList.toggle('current',Number(node.dataset.phase)===state.phase);node.classList.toggle('done',Number(node.dataset.phase)<state.phase);}
 for(const id of ['coolant','plasma']){paintLever(id);$(id).disabled=!canOperate(id);}
 $('temperature').textContent=Math.round(state.temp).toLocaleString();$('stability').textContent=Number(state.quant).toFixed(1);$('drill').disabled=!canOperate('drill');
 for(const node of document.querySelectorAll('[data-sub]')){node.disabled=!canOperate('sub',node.dataset.sub);const guided=state.failed&&state.phase===2&&state.sub===node.dataset.sub;node.classList.toggle('active',guided);node.dataset.guided=String(guided);}
 for(const node of document.querySelectorAll('[data-reboot]')){const guided=state.failed&&state.phase===3&&state.reboot===node.dataset.reboot;node.disabled=!canOperate('reboot',node.dataset.reboot);node.classList.toggle('active',guided);node.dataset.guided=String(guided);}
 for(const node of document.querySelectorAll('[data-action]')){node.disabled=!canOperate(node.dataset.action);if(node.hasAttribute('aria-pressed'))node.setAttribute('aria-pressed',String(!!state[node.dataset.action]));}
 const tint=state.failed?(state.phase===1?'#ff7753':state.phase===2?'#efb56a':'#a99af5'):profile.coreColor;shell.material.uniforms.tint.value.set(tint);halo.material.color.set(tint);coreLight.color.set(tint);particles.material.color.set(state.failed?'#ffd1ad':profile.color);energyUniforms.danger.value=state.failed?1:0;energyUniforms.phase.value=state.phase;energyUniforms.power.value=state.plasma/100;energyUniforms.modeTint.value.set(profile.coreColor);energyUniforms.outputScale.value=profile.output/100;
 for(const key of keys){key.guided=state.failed&&(state.phase===2&&key.action==='sub'&&state.sub===key.id||state.phase===3&&key.action==='reboot'&&state.reboot===key.id);const selected=key.action==='mode'&&state.outputMode===key.id,active=key.guided||selected,color=selected?outputModes[key.id].color:active?'#a6e4bb':key.action==='reboot'?'#07121f':key.action==='drill'?'#ffac8f':'#559de8';key.lamp.material.color.set(color);key.lamp.material.emissive.set(color);key.lamp.material.emissiveIntensity=active?1.3:.18;if(key.action==='mode'){key.cap.material.emissive.set(outputModes[key.id].color);key.cap.material.emissiveIntensity=selected?.24:0;}}
 if(wasFailed&&!state.failed)toast('✓ 核心已恢復穩定');
 if(lastFrame>0)render(performance.now(),true);
}
addEventListener('message',event=>{if(!embedded||event.source!==parent||event.origin!==location.origin)return;if(event.data?.type==='quantum-engine-state'){applyState(event.data.state||{});$('loading').hidden=true;}if(event.data?.type==='quantum-engine-notice')toast(String(event.data.text||''));});
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),pointers=new Map();let drag=null,yaw=0,pitch=.16,targetYaw=0,targetPitch=.16,zoom=0,pinch=0;
function hit(e){const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);return raycaster.intersectObjects(targets,false)[0]?.object;}
function moveLever(e,item,final=false){hit(e);const panel=item.userData.panel,normal=new THREE.Vector3(0,0,1).applyQuaternion(panel.getWorldQuaternion(new THREE.Quaternion())),point=panel.localToWorld(new THREE.Vector3(0,0,.29)),plane=new THREE.Plane().setFromNormalAndCoplanarPoint(normal,point),p=new THREE.Vector3();if(!raycaster.ray.intersectPlane(plane,p))return;panel.worldToLocal(p);const value=Math.round(THREE.MathUtils.clamp((p.y+.63)/1.4*100,0,100)),id=item.userData.id;state[id]=value;paintLever(id);if(final||!drag.lastSent||performance.now()-drag.lastSent>60){send(id,{value});drag.lastSent=performance.now();}}
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});let item=pointers.size>1?null:hit(e);if(item&&!canOperate(item.userData.action,item.userData.id))item=null;drag={x:e.clientX,y:e.clientY,yaw:targetYaw,pitch:targetPitch,item,id:item?.userData.action==='lever'?item.userData.id:null,moved:pointers.size>1?100:0,lastSent:0};pinch=0;if(drag.id)moveLever(e,item);});
canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId)){canvas.style.cursor=hit(e)?'pointer':'grab';return;}pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(!drag)return;if(pointers.size===2){const p=[...pointers.values()],d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);if(pinch)zoom=THREE.MathUtils.clamp(zoom+(pinch-d)*.02,-2,3);pinch=d;drag.moved=100;drag.id=null;drag.item=null;return;}drag.moved=Math.max(drag.moved,Math.hypot(e.clientX-drag.x,e.clientY-drag.y));if(drag.id){moveLever(e,drag.item);return;}if(drag.moved>6){targetYaw=THREE.MathUtils.clamp(drag.yaw-(e.clientX-drag.x)*.004,-.8,.8);targetPitch=THREE.MathUtils.clamp(drag.pitch+(e.clientY-drag.y)*.003,-.05,.5);}});
function release(e){pointers.delete(e.pointerId);if(drag?.id)moveLever(e,drag.item,true);else if(drag?.moved<7&&drag.item){const d=drag.item.userData;if(d.action==='focus')zoom=zoom<-.5?0:-1.5;else send(d.action,d.id?{id:d.id}:{});}drag=null;pinch=0;}
canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',()=>{drag=null;pointers.clear();pinch=0;});canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=THREE.MathUtils.clamp(zoom+e.deltaY*.003,-2,3);},{passive:false});
canvas.addEventListener('keydown',e=>{if(e.key==='Escape'||e.key==='Home')resetView();if(e.key==='ArrowLeft')targetYaw=Math.min(.8,targetYaw+.1);if(e.key==='ArrowRight')targetYaw=Math.max(-.8,targetYaw-.1);if(e.key==='ArrowUp')targetPitch=Math.max(-.05,targetPitch-.08);if(e.key==='ArrowDown')targetPitch=Math.min(.5,targetPitch+.08);if(e.key.startsWith('Arrow'))e.preventDefault();});
function resetView(){targetYaw=0;targetPitch=.16;zoom=0;}
function resize(){const portrait=innerWidth<innerHeight;camera.aspect=innerWidth/innerHeight;camera.fov=portrait?54:48;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);for(const [panel,side]of [[left,-1],[right,1]]){panel.position.x=side*(portrait?1.25:3.35);panel.position.y=portrait?1.1:1.65;panel.scale.setScalar(portrait?.72:1);}utilities.scale.setScalar(portrait?.8:1);}addEventListener('resize',resize);resize();
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();$('loading').hidden=false;$('loading').innerHTML='<strong>引擎艙暫停</strong><button id="restore">重新進入</button>';$('restore').onclick=()=>location.reload();});
function render(t,force=false){if(!force)requestAnimationFrame(render);if(!force&&(document.hidden||t-lastFrame<32))return;lastFrame=t;const time=reduced?0:t*.001;yaw=THREE.MathUtils.lerp(yaw,targetYaw,.12);pitch=THREE.MathUtils.lerp(pitch,targetPitch,.12);const distance=9.8+zoom+(innerWidth<innerHeight?.6:0);camera.position.set(Math.sin(yaw)*distance,1.95+Math.sin(pitch)*distance,Math.cos(yaw)*Math.cos(pitch)*distance);camera.lookAt(0,1.95,0);
 const profile=outputModes[state.outputMode]||outputModes.standard,speed=state.failed?1.5:profile.spin;energyUniforms.time.value=time*speed;const pulse=1+Math.sin(time*(state.failed?5:1.4*speed))*(state.failed?.018:.008);energyBall.scale.setScalar(pulse);shell.scale.setScalar(pulse);energyBall.rotation.y=time*.025*speed;particles.rotation.y=time*.08*speed;particles.rotation.z=Math.sin(time*.13)*.13;
 for(let i=0;i<rings.length;i++){rings[i].rotation.z=i*.8+time*(i%2?-.085:.06)*speed;rings[i].rotation.y=.35+i*.55+Math.sin(time*.16+i)*.12;}
 halo.material.opacity=(state.failed?.53:.4)+Math.sin(time*1.8)*.035;
 for(const k of keys){
  k.group.position.z=performance.now()<k.until?.15:.2;
  if(k.action==='sub'||k.action==='reboot'){
   // Each key owns its materials: only the current repair target lights up.
   const glow=k.guided?(reduced?1.15:1.15+Math.sin(time*3)*.16):0;
   k.cap.material.color.copy(k.baseColor);k.cap.material.emissive.set(k.guided?'#79efb9':'#000000');k.cap.material.emissiveIntensity=glow;
   k.rim.material.emissive.set(k.guided?'#79efb9':'#000000');k.rim.material.emissiveIntensity=glow*.5;
   k.face.material.color.set(k.guided?'#184a35':'#ffffff');
   if(k.guided)k.lamp.material.emissiveIntensity=glow+1;
  }
 }
 renderer.render(scene,camera);projectControls();
}
applyState(state);requestAnimationFrame(render);if(embedded)parent.postMessage({type:'quantum-engine-ready'},location.origin);else $('loading').hidden=true;

