import * as THREE from 'three';
import {RoomEnvironment} from '../ship-study/vendor/RoomEnvironment.js';
import {iconSvg,iconPalette} from './icons.js?v=20261023e';
import {paintKey,paintToggle,paintDrills,paintEngineStatus,drawPlanet} from './instruments.js?v=20261023n';
import {createMeteorDefense} from './meteor-game.js?v=20261023l';
import {createCruiseSpace} from './cruise-space.js?v=20261023f';

const canvas=document.getElementById('cockpit');
const embedded=window.parent!==window;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const enteredAt=performance.now();
const $=id=>document.getElementById(id);
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});}
catch(error){$('loading').innerHTML='<strong>無法啟動 3D 駕駛艙</strong><a href="../0919-cinematic.html?view=dashboard&entry=cockpit">開啟控制面板</a>';throw error;}
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.1;
const scene=new THREE.Scene();scene.background=new THREE.Color('#02060c');
const room=new RoomEnvironment(renderer),pmrem=new THREE.PMREMGenerator(renderer);
scene.environment=pmrem.fromScene(room,.035).texture;room.dispose();pmrem.dispose();
const camera=new THREE.PerspectiveCamera(56,innerWidth/innerHeight,.05,350);
const cockpit=new THREE.Group();scene.add(cockpit);
// Games hide the entire cabin. The two cannons or salvage arm are separate models.
const cabinSides=new THREE.Group(),forwardFrame=new THREE.Group();cockpit.add(cabinSides,forwardFrame);
const outside=new THREE.Group();scene.add(outside);
const targets=[],pushes=[],switches={},screens=[],warningLights=[],buttonFaces=[],toggleFaces=[],planetThumbs={};
const projectedControls=[],servicePanels=[];
let state={location:'地球軌道',planetId:'earth',mission:'等待探索指令',target:'尚未鎖定',targetId:null,fuel:100,fuelMax:100,shield:100,shieldMax:100,scrap:0,crystal:0,damage:[],jumpReady:false,engineFailed:false,locked:false,economy:false,radiator:false,muted:false,threat:'安全',temp:'3,450 K'};
const material=(color,metalness=.5,roughness=.55)=>new THREE.MeshStandardMaterial({color,metalness,roughness,envMapIntensity:.55});
const mat={shell:material('#252d35',.75,.5),edge:material('#596168',.8,.38),black:material('#091117',.5,.6),rubber:material('#111819',.08,.82),white:material('#b8bbb0',.55,.48),light:material('#687379',.65,.45),copper:material('#9e7244',.8,.4),blue:material('#233d4c',.7,.4),gold:material('#aa8750',.65,.4)};
function glow(color,intensity=1){return new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:intensity,roughness:.35,metalness:.25});}
const cyan=glow('#71c6da',1.1),amber=glow('#e4ae5a',.8),green=glow('#91c9a6',.7),red=glow('#ff4c32',1.2);
function box(parent,w,h,d,x,y,z,m=mat.shell,bevel=0){
 let geo;if(bevel){const r=Math.min(bevel,w/3,h/3),s=new THREE.Shape();s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);geo=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.015,bevelThickness:.015,curveSegments:3});geo.translate(0,0,-d/2);}else geo=new THREE.BoxGeometry(w,h,d);
 const mesh=new THREE.Mesh(geo,m);mesh.position.set(x,y,z);parent.add(mesh);return mesh;
}
function tube(parent,a,b,r,m=mat.edge,sides=8){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),v=bv.clone().sub(av);const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,v.length(),sides),m);mesh.position.copy(av.add(bv).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());parent.add(mesh);return mesh;}
const screwGeo=new THREE.CylinderGeometry(.034,.034,.02,8);
function screw(parent,x,y,z){const s=new THREE.Mesh(screwGeo,mat.edge);s.rotation.x=Math.PI/2;s.position.set(x,y,z);parent.add(s);box(parent,.037,.006,.004,x,y,z+.014,mat.black);}
function bolts(parent,w,h,z){for(const x of [-w/2+.1,w/2-.1])for(const y of [-h/2+.1,h/2-.1])screw(parent,x,y,z);}
function canvasMap(w,h,paint){const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');paint(ctx,w,h);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());return{canvas:c,ctx,texture};}
const brushed=canvasMap(512,512,c=>{c.fillStyle='#e2e3e0';c.fillRect(0,0,512,512);let s=93;for(let i=0;i<1200;i++){s=(Math.imul(s,1664525)+1013904223)>>>0;const y=s%512;c.strokeStyle=i%4?'#ced0cd28':'#fafafa35';c.beginPath();c.moveTo(0,y);c.lineTo(512,y);c.stroke();}c.strokeStyle='#747c7917';for(let i=0;i<22;i++){const x=(i*97)%512,y=(i*173)%512;c.beginPath();c.moveTo(x,y);c.lineTo(x+12,y+1);c.stroke();}}).texture;
brushed.wrapS=brushed.wrapT=THREE.RepeatWrapping;brushed.repeat.set(2,2);for(const name of ['shell','edge','white','blue'])mat[name].map=brushed;
function textPlate(parent,text,w,h,x,y,z,color='#b2c2c8',bg=null,size=38){const map=canvasMap(512,Math.max(64,Math.round(512*h/w)),(c,cw,ch)=>{if(bg){c.fillStyle=bg;c.fillRect(0,0,cw,ch);}c.fillStyle=color;c.font=`500 ${size}px "Microsoft JhengHei",sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(text,cw/2,ch/2,cw-16);});const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:map.texture,transparent:!bg,toneMapped:false,depthWrite:!!bg}));p.position.set(x,y,z);parent.add(p);return p;}
function interact(mesh,action,label){mesh.userData.action=action;mesh.userData.label=label;targets.push(mesh);return mesh;}
function panel(w,h,x,y,z,rx=0,ry=0){const g=new THREE.Group();g.position.set(x,y,z);g.rotation.set(rx,ry,0);cockpit.add(g);box(g,w+.13,h+.13,.18,0,0,-.05,mat.edge,.1);box(g,w,h,.1,0,0,.055,mat.black,.08);bolts(g,w+.1,h+.1,.12);return g;}
function key(parent,action,label,x,y,w=1.12,h=.52,color='#8ebecb',accent=false){
 const g=new THREE.Group();g.position.set(x,y,.18);parent.add(g);const theme=iconPalette[action];
 box(g,w+.07,h+.07,.09,0,0,-.06,mat.black,.055);const capMaterial=material(theme.cap,.6,.42);capMaterial.map=brushed;
 const cap=box(g,w,h,.13,0,0,.035,capMaterial,.055);const led=box(g,w*.58,.018,.013,0,h/2-.04,.145,glow(theme.color,.55));
 const face=canvasMap(768,Math.round(768*h/w),(c,cw,ch)=>paintKey(c,cw,ch,action,state));
 const graphic=new THREE.Mesh(new THREE.PlaneGeometry(w*.94,h*.9),new THREE.MeshBasicMaterial({map:face.texture,transparent:true,toneMapped:false,depthWrite:false}));graphic.position.z=.156;g.add(graphic);buttonFaces.push({...face,action});
 interact(cap,action,label);pushes.push({group:g,rest:.18,until:0,action});g.userData.led=led;g.userData.cap=cap;return g;
}
function toggle(parent,action,label,x,y){
 const g=new THREE.Group();g.position.set(x,y,.14);parent.add(g);box(g,.77,.67,.07,0,0,0,mat.shell,.04);const led=box(g,.09,.035,.015,.23,.21,.066,green);
 const face=canvasMap(512,448,(c,cw,ch)=>paintToggle(c,cw,ch,action,false));const graphic=new THREE.Mesh(new THREE.PlaneGeometry(.69,.57),new THREE.MeshBasicMaterial({map:face.texture,transparent:true,toneMapped:false,depthWrite:false}));graphic.position.z=.078;g.add(graphic);toggleFaces.push({...face,action});
 const stem=new THREE.Group();stem.position.set(.18,.035,.08);g.add(stem);const ring=new THREE.Mesh(new THREE.CylinderGeometry(.105,.105,.04,16),mat.edge);ring.rotation.x=Math.PI/2;stem.add(ring);tube(stem,[0,0,0],[0,.12,.17],.035,mat.white,10);const tip=new THREE.Mesh(new THREE.SphereGeometry(.06,10,6),mat.white);tip.position.set(0,.12,.17);stem.add(tip);const hit=box(g,.69,.53,.15,0,.03,.06,new THREE.MeshBasicMaterial({visible:false}));interact(hit,action,label);switches[action]={stem,led};
}
function display(parent,w,h,x,y,paint,action,label){
 const g=new THREE.Group();g.position.set(x,y,.16);parent.add(g);box(g,w+.12,h+.12,.07,0,0,0,mat.edge,.03);box(g,w+.04,h+.04,.045,0,0,.047,mat.black,.02);
 const source=canvasMap(1024,Math.round(1024*h/w),paint);const surface=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:source.texture,toneMapped:false}));surface.position.z=.106;g.add(surface);if(action)interact(surface,action,label);screens.push({...source,paint,surface});return g;
}

// The cabin has real structural depth: a bolted window frame, metal consoles,
// seat, cable conduits and physical controls, all viewed from the pilot's seat.
box(cockpit,14,.16,16,0,-1.25,1,mat.rubber);
for(let z=-4;z<8;z+=1.2){box(cockpit,11,.025,.03,0,-1.15,z,mat.edge);}
for(const side of [-1,1]){
 box(cabinSides,.32,2.8,14,side*5.8,-.1,0,mat.shell);
 box(cabinSides,.12,2.3,10,side*5.58,.3,0,mat.white);
 for(let z=-3;z<7;z+=1.3){box(cabinSides,.14,3,.16,side*5.5,.5,z,mat.edge);box(cabinSides,.03,.035,.7,side*5.4,1.2,z,cyan);}
 tube(cockpit,[side*5.38,-.6,-4],[side*5.38,-.6,6],.09,mat.black,10);
 tube(cockpit,[side*5.2,-.5,-4],[side*5.2,-.5,6],.035,mat.copper,8);
 const sideConsole=box(cockpit,1.1,.8,5.4,side*4.65,-.3,1.4,mat.shell,.1);sideConsole.rotation.y=side*.06;
 box(cockpit,.08,.04,4.8,side*4.1,.13,1.35,cyan);
 for(let i=0;i<10;i++)box(cockpit,.45,.018,.13,side*4.7,.12,-.6+i*.39,mat.black);
}
// Open panoramic canopy: no ceiling, overhead beams or hanging sign.
const windowPoints=[[-5.3,-.65,-5.8],[-5.65,2.8,-5.8],[-6.3,7.8,-5.8],[6.3,7.8,-5.8],[5.65,2.8,-5.8],[5.3,-.65,-5.8]];
for(let i=0;i<windowPoints.length;i++){
 const a=windowPoints[i],b=windowPoints[(i+1)%windowPoints.length];tube(forwardFrame,a,b,.16,mat.edge,6);tube(forwardFrame,[a[0],a[1],a[2]-.12],[b[0],b[1],b[2]-.12],.19,mat.black,6);
 for(let j=0;j<5;j++){const t=(j+.5)/5;const v=a.map((n,k)=>n+(b[k]-n)*t);const n=new THREE.Mesh(new THREE.SphereGeometry(.043,8,5),mat.white);n.position.set(v[0],v[1],v[2]+.15);forwardFrame.add(n);}
}
for(const side of [-1,1])tube(forwardFrame,[side*3.2,-.55,-5.7],[side*3.5,7.8,-5.7],.045,mat.shell,6);
// Thin reflective edges suggest laminated glass without obscuring the view.
const glazing=new THREE.Mesh(new THREE.PlaneGeometry(10.6,4.05),new THREE.MeshBasicMaterial({color:'#6aaac0',transparent:true,opacity:.025,depthWrite:false}));glazing.position.set(0,2.34,-5.66);forwardFrame.add(glazing);
for(const side of [-1,1]){
 const service=panel(1.12,1.32,side*4.78,1.32,-2.1,-.2,side*-.13);
 servicePanels.push({group:service,side});
 const action=side<0?'weapons':'engine',label=side<0?'演習 · 開啟武器小遊戲':'量子引擎即時狀態 · 開啟引擎艙';
 const instrument=display(service,.93,1.12,0,0,(c,w,h,t)=>side<0?paintDrills(c,w,h):paintEngineStatus(c,w,h,state,t),action,label);
 pushes.push({group:instrument,rest:.16,until:0,action});
 projectedControls.push({action,group:instrument,w:.99,h:1.18,z:.12,min:44,label,service:true});
}

// Low consoles keep the forward glazing clear; readable touch instruments sit at the edges.
box(cockpit,9.5,1.1,1.3,0,-.68,-2.4,mat.shell,.12);
box(cockpit,9.6,.13,.14,0,-.06,-1.78,mat.edge,.035);
for(let x=-4.4;x<4.5;x+=.38){box(cockpit,.18,.05,.19,x,-.05,-2.38,mat.black);}
const warningBar=box(cockpit,.8,.055,.08,0,-.03,-2.5,green);warningLights.push(warningBar);
const desk=panel(8.5,2.42,0,-.62,-.08,-.93);
box(desk,8.3,.055,.07,0,1.12,.13,mat.edge);
for(let i=0;i<5;i++)box(desk,.12,.035,.025,-.32+i*.16,1.04,.15,i<3?cyan:mat.light);
for(const x of [-2.65,2.65])box(desk,.026,2.08,.018,x,0,.135,mat.edge);
for(const x of [-2.8,2.8]){box(desk,1.9,.019,.018,x,.95,.15,mat.edge);for(const side of [-1,1])screw(desk,x+side*1.07,.95,.155);}
for(let x=-1.05;x<1.1;x+=.12)box(desk,.045,.12,.02,x,.91,.15,mat.light);
for(const side of [-1,1]){for(let i=0;i<5;i++)box(desk,.3,.055,.025,side*3.5,-.75+i*.13,.15,mat.edge);}
for(const [index,action,label]of [[0,'mission','接收或更換任務'],[1,'map','開啟太陽系星圖'],[2,'scan','啟動雷達掃描'],[3,'jump','啟動躍遷']]){
 const g=key(desk,action,label,(index-1.5)*1.3,.06,1.12,1.16);
 g.userData.flightIndex=index;
 projectedControls.push({action,group:g,w:1.12,h:1.16,z:.17,min:44});
}
toggle(desk,'economy','節能航行',3.25,.5);
toggle(desk,'radiator','散熱翼',3.25,-.4);

// Lower cabin details become visible when the pilot looks around.
const seat=new THREE.Group();seat.position.set(0,-.6,5.1);cockpit.add(seat);box(seat,1.7,.26,1.6,0,0,0,mat.rubber,.1);const back=box(seat,1.7,2.25,.35,0,1.02,.73,mat.rubber,.12);back.rotation.x=.1;for(const x of [-.67,.67]){box(seat,.11,1.7,.05,x,1.1,.51,mat.shell);box(seat,.22,.15,1.2,x,.55,-.02,mat.white,.06);}for(const side of [-1,1]){for(let j=0;j<4;j++){tube(cockpit,[side*1.6,-1.02,-.5+j*.2],[side*1.6,-1.02,1.5+j*.2],.025,mat.black);}}

const hemi=new THREE.HemisphereLight('#bacede','#17212a',1.35);scene.add(hemi);
const daylight=new THREE.DirectionalLight('#c9e4fa',2.4);daylight.position.set(-10,12,5);scene.add(daylight);
const ceilingLight=new THREE.PointLight('#b7d9e7',38,14,2);ceilingLight.position.set(0,3.9,.4);scene.add(ceilingLight);
const panelLight=new THREE.PointLight('#4e99c0',8,7,2);panelLight.position.set(0,1.1,1.9);scene.add(panelLight);
const warmLight=new THREE.PointLight('#ebad61',7,8,2);warmLight.position.set(-4.3,2.8,1.4);scene.add(warmLight);

// A real rotating body and stars sit beyond the forward glazing.
let seed=21;const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
const starPositions=[];for(let i=0;i<1000;i++){const p=new THREE.Vector3(random()-.5,random()-.35,random()-.5).normalize().multiplyScalar(140+random()*40);starPositions.push(p.x,p.y,p.z);}
const starsGeo=new THREE.BufferGeometry();starsGeo.setAttribute('position',new THREE.Float32BufferAttribute(starPositions,3));const stars=new THREE.Points(starsGeo,new THREE.PointsMaterial({color:'#a3bdcf',size:.14,sizeAttenuation:true}));outside.add(stars);
const planetMaterial=new THREE.MeshStandardMaterial({color:'#b9d2e4',roughness:1,metalness:0,envMapIntensity:.08});
const planet=new THREE.Mesh(new THREE.SphereGeometry(10,64,32),planetMaterial);planet.position.set(6,7,-28);planet.rotation.set(.13,2.1,-.2);outside.add(planet);
const cruiseSpace=createCruiseSpace({parent:outside,camera,anisotropy:Math.min(4,renderer.capabilities.getMaxAnisotropy())}),earthView=cruiseSpace.earth;
const atmosphere=new THREE.Mesh(new THREE.SphereGeometry(10.18,64,32),new THREE.ShaderMaterial({transparent:true,side:THREE.BackSide,depthWrite:false,uniforms:{tint:{value:new THREE.Color('#5eb5e8')}},vertexShader:'varying vec3 vNormal;varying vec3 vPosition;void main(){vNormal=normalize(normalMatrix*normal);vec4 p=modelViewMatrix*vec4(position,1.0);vPosition=p.xyz;gl_Position=projectionMatrix*p;}',fragmentShader:'varying vec3 vNormal;varying vec3 vPosition;uniform vec3 tint;void main(){float f=pow(1.0-abs(dot(normalize(vNormal),normalize(-vPosition))),3.4);gl_FragColor=vec4(tint,f*.7);}'}));atmosphere.position.copy(planet.position);outside.add(atmosphere);
const atlasTextures={};const atlas=new Image();atlas.src='../planet-texture-atlas.png';atlas.onload=()=>{const ids=['mercury','venus','earth','mars','jupiter','saturn','uranus','neptune'];const tw=atlas.naturalWidth/4,th=atlas.naturalHeight/2;ids.forEach((id,i)=>{const c=document.createElement('canvas');c.width=768;c.height=384;c.getContext('2d').drawImage(atlas,(i%4)*tw+5,Math.floor(i/4)*th+5,tw-10,th-10,0,0,768,384);const ctx=c.getContext('2d'),pixels=ctx.getImageData(0,0,768,384),d=pixels.data;for(let y=0;y<384;y++)for(let x=0;x<64;x++){const weight=(1-x/63)*.5,a=(y*768+x)*4,b=(y*768+767-x)*4;for(let k=0;k<3;k++){const l=d[a+k],r=d[b+k];d[a+k]=l*(1-weight)+r*weight;d[b+k]=r*(1-weight)+l*weight;}}ctx.putImageData(pixels,0,0);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;atlasTextures[id]=tex;planetThumbs[id]=c;});prepareMoonMap();for(const m of rockMaterials){m.map=atlasTextures.mercury;m.bumpMap=atlasTextures.mercury;m.bumpScale=.08;m.needsUpdate=true;}updatePlanet();updateDock();};
const saturnRing=new THREE.Mesh(new THREE.RingGeometry(12,17,96),new THREE.MeshStandardMaterial({color:'#baa67c',side:THREE.DoubleSide,transparent:true,opacity:.6,roughness:1}));saturnRing.position.copy(planet.position);saturnRing.rotation.set(1.25,.2,.25);saturnRing.visible=false;outside.add(saturnRing);
const warpArray=new Float32Array(220*6);for(let i=0;i<220;i++){const a=random()*Math.PI*2,r=1+random()*40,z=-10-random()*110;warpArray.set([Math.cos(a)*r,Math.sin(a)*r,z,Math.cos(a)*r,Math.sin(a)*r,z-9-random()*15],i*6);}const warpGeo=new THREE.BufferGeometry();warpGeo.setAttribute('position',new THREE.BufferAttribute(warpArray,3));const warp=new THREE.LineSegments(warpGeo,new THREE.LineBasicMaterial({color:'#aadcf6',transparent:true,opacity:.8}));outside.add(warp);warp.visible=false;
// An artistic lunar surface uses the local rocky atlas with separate grey maria.
const moonMap=canvasMap(768,384,c=>{c.fillStyle='#989997';c.fillRect(0,0,768,384);}).texture;
function prepareMoonMap(){const c=document.createElement('canvas');c.width=768;c.height=384;const ctx=c.getContext('2d');ctx.drawImage(planetThumbs.mercury,0,0);ctx.globalCompositeOperation='multiply';for(const [x,y,r]of [[190,135,65],[246,161,78],[295,110,47],[265,210,52],[385,165,37],[554,115,55],[587,165,45]]){const g=ctx.createRadialGradient(x,y,r*.2,x,y,r);g.addColorStop(0,'#909593');g.addColorStop(.55,'#a9aeab');g.addColorStop(1,'#ffffff');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}ctx.globalCompositeOperation='source-over';moonMap.image=c;moonMap.needsUpdate=true;planetThumbs.moon=c;}
const stationView=new THREE.Group();stationView.position.set(0,4,-25);stationView.rotation.set(.17,-.34,.12);outside.add(stationView);
box(stationView,1.4,5,1.4,0,0,0,mat.white,.2);box(stationView,3,.7,2.2,0,-1.6,0,mat.shell,.15);
const habitat=new THREE.Mesh(new THREE.TorusGeometry(3,.33,12,80),mat.white);habitat.rotation.x=.8;stationView.add(habitat);
for(let i=0;i<8;i++){const a=i*Math.PI/4;tube(stationView,[0,0,0],[Math.cos(a)*3,Math.sin(a)*2.1,Math.sin(a)*2.1],.07,mat.edge);}
for(const side of [-1,1]){tube(stationView,[side*.6,0,0],[side*5.8,0,0],.15,mat.edge);const p=box(stationView,3.8,5,.12,side*5.5,0,0,mat.blue,.05);for(let j=-2;j<=2;j++)box(stationView,3.8,.035,.025,side*5.5,j*.85,.08,mat.edge);for(let j=-1;j<=1;j++)box(stationView,.04,5,.025,side*5.5+j*1.1,0,.08,mat.edge);box(stationView,.22,.22,.22,side*7.3,2.4,.1,cyan);}
for(let i=0;i<6;i++)box(stationView,.17,.21,.05,i%2?.73:-.73,-1+i*.5,.72,cyan);
const stationArt=new THREE.Mesh(new THREE.PlaneGeometry(14,14),new THREE.MeshBasicMaterial({transparent:true,alphaTest:.02,toneMapped:false}));stationArt.position.set(0,1.7,-30);outside.add(stationArt);stationArt.visible=false;
new THREE.TextureLoader().load('../station-realistic.png',texture=>{texture.colorSpace=THREE.SRGBColorSpace;stationArt.material.map=texture;stationArt.material.needsUpdate=true;});
const rocks=new THREE.Group();rocks.position.set(0,4,-24);outside.add(rocks);
const rockGeo=new THREE.IcosahedronGeometry(1,2),rockMaterials=['#c9c1b1','#bbae97','#a6afae'].map(color=>new THREE.MeshStandardMaterial({color,metalness:0,roughness:1,envMapIntensity:.04,flatShading:true}));
const rockVertices=rockGeo.attributes.position;for(let i=0;i<rockVertices.count;i++){const x=rockVertices.getX(i),y=rockVertices.getY(i),z=rockVertices.getZ(i),r=.87+.12*Math.sin(x*13+y*17+z*3)+.07*Math.sin(x*23-y*11);rockVertices.setXYZ(i,x*r,y*r,z*r);}rockGeo.computeVertexNormals();
for(let i=0;i<85;i++){const rock=new THREE.Mesh(rockGeo,rockMaterials[i%3]);rock.position.set((random()-.5)*50,(random()-.5)*25,-random()*45);rock.rotation.set(random()*6,random()*6,random()*6);const r=.2+random()*1.7;rock.scale.set(r,r*(.6+random()*.6),r*(.6+random()*.6));rocks.add(rock);}
function updatePlanet(){const id=state.planetId;planetMaterial.map=id==='moon'?moonMap:atlasTextures[id]||null;planetMaterial.needsUpdate=true;planetMaterial.color.set('#e2ebed');saturnRing.visible=id==='saturn'&&!state.isJumping;atmosphere.material.uniforms.tint.value.set(({mars:'#c88b65',venus:'#e7bc78',jupiter:'#c8b296',saturn:'#d2c39d'})[id]||'#5eb5e8');const scale=id==='saturn'?.56:.72;planet.scale.setScalar(scale);atmosphere.scale.setScalar(scale);saturnRing.scale.setScalar(scale);planet.position.set(0,1.7,-30);atmosphere.position.copy(planet.position);saturnRing.position.copy(planet.position);}


let toastTimer,hintTimer;
function uiIcon(node,name,caption){if(node.dataset.icon===name)return;node.dataset.icon=name;const image=document.createElement('span');image.className='ui-icon';image.innerHTML=iconSvg(name);node.replaceChildren(image);if(caption){const small=document.createElement('small');small.textContent=caption;node.append(small);}}
for(const node of document.querySelectorAll('[data-ui-icon]'))uiIcon(node,node.dataset.uiIcon);
for(const [id,name,caption] of [['reset-view','reset','正前方'],['dashboard','dashboard','面板'],['sound','sound','聲音']])uiIcon($(id),name,caption);
for(const button of document.querySelectorAll('#accessible-controls [data-action]')){const action=button.dataset.action;uiIcon(button,action,iconPalette[action].label);button.style.setProperty('--action-color',iconPalette[action].color);}

const names={earth:'地球',mercury:'水星',venus:'金星',moon:'月球',mars:'火星',jupiter:'木星',saturn:'土星',uranus:'天王星',neptune:'海王星',outpost:'太空基地','asteroid-belt':'小行星帶'};
for(const [action,label] of [['mission','任務'],['map','星圖'],['scan','雷達'],['jump','出發'],['complete','領獎']]){
 const node=document.querySelector('[data-flight-action="'+action+'"]');uiIcon(node,action==='complete'?'check':action,label);
 if(iconPalette[action])node.style.setProperty('--action-color',iconPalette[action].color);
 node.onclick=()=>send(action);
}
const auxNav=document.createElement('nav');auxNav.className='aux-controls';auxNav.setAttribute('aria-label','側邊演習與引擎控制台');document.body.append(auxNav);
for(const control of projectedControls){
 if(control.service){const button=document.createElement('button');button.className='model-key';button.setAttribute('aria-label',control.label);button.onclick=()=>send(control.action);auxNav.append(button);control.nodes=[button];}
 else control.nodes=[document.querySelector('[data-flight-action="'+control.action+'"]'),...(control.action==='mission'?[$('mission-complete')]:[])];
 for(const button of control.nodes){button.classList.add('model-key');button.addEventListener('pointerdown',()=>{const press=pushes.find(p=>p.action===control.action);if(press&&!button.disabled)press.until=performance.now()+180;});}
}
for(const [id,action] of [['destination-card','map'],['fuel-gauge','fuel'],['ship-status','ship'],['shield-gauge','shield'],['station-supply','station'],['mission-play','missionPlay']])$(id).onclick=()=>send(action);
let dockArt='';
function updateDock(){
 const missionId=state.missionTargetId,id=missionId||state.targetId||state.planetId,name=names[id]||state.location;
 $('destination-caption').textContent=missionId?'任務目的地':state.targetId?'航向目的地':'目前位置';$('destination-name').textContent=name;
 $('destination-card').setAttribute('aria-label',(missionId?'任務目的地 ':'')+name+' · 開啟星圖');
 $('navigation-current').hidden=!missionId&&!state.targetId;$('navigation-current').textContent=id===state.planetId?'已抵達':'目前：'+(names[state.planetId]||state.location);
 $('arrival-check').hidden=!state.missionComplete;
 const task=missionId?String(state.missionTask||'').replace(/^[^\p{L}\p{N}]+/u,''):'';
 $('mission-detail').hidden=!task;$('mission-task').textContent=task;
 const activityIcon=state.missionActivity==='salvage'?'cargo':state.missionActivity==='meteor'?'weapons':'scan';
 uiIcon($('mission-task-icon'),state.missionActivity?activityIcon:/採集|收集|採樣|運送/.test(task)?'cargo':/掃描|探測|觀測|調查/.test(task)?'scan':/維修|修復/.test(task)?'ship':'mission');
 const goal=Math.max(0,Number(state.missionGoal)||0),progress=Math.min(goal,Math.max(0,Number(state.missionProgress)||0));
 $('mission-progress').hidden=!goal;$('mission-progress').textContent=progress+' / '+goal;
 const play=!!missionId&&!!state.missionReached&&!state.missionComplete;
 $('mission-play').hidden=!play;$('mission-play').disabled=state.locked;
 const activityLabel=state.missionActivity==='salvage'?'開始打撈':state.missionActivity==='meteor'?'清除隕石':'掃描星球';
 $('mission-play-label').textContent=activityLabel;uiIcon($('mission-play-icon'),activityIcon);$('mission-play').setAttribute('aria-label',activityLabel+'，'+progress+' / '+goal);
 document.querySelector('[data-flight-action="mission"]').setAttribute('aria-label',missionId?'查看探索任務':'接收探索任務');
 const signature=id+'|'+!!planetThumbs[id];
 if(dockArt!==signature){dockArt=signature;const c=$('destination-art').getContext('2d');c.clearRect(0,0,144,144);drawPlanet(c,id,72,72,id==='saturn'?42:58,planetThumbs);}
 for(const kind of ['fuel','shield']){const max=state[kind+'Max']||100,value=Math.max(0,Math.min(max,state[kind]||0));$(kind+'-value').textContent=Math.round(value);$(kind+'-fill').style.width=(value/max*100)+'%';$(kind+'-gauge').classList.toggle('low',value/max<.25);$(kind+'-gauge').setAttribute('aria-label',(kind==='fuel'?'補充燃料':'防護力場充能')+' '+Math.round(value)+' / '+max);}
 const health=$('system-health');health.replaceChildren();
 for(const [system,icon,label] of [['engine','engine','量子引擎'],['weapons','weapons','武器'],['radar','scan','雷達'],['fuel','fuel','油箱'],['radiator','radiator','散熱板']]){const damaged=state.damage.some(d=>d.system===system)||system==='engine'&&state.engineFailed;const item=document.createElement('span');item.className=damaged?'damaged':'';item.title=label+(damaged?' · 需要檢修':' · 正常');item.innerHTML=iconSvg(icon);health.append(item);}
 $('ship-status').classList.toggle('damaged',state.engineFailed||state.damage.length>0);
 $('ship-status').setAttribute('aria-label',state.damage.length||state.engineFailed?'船體警報 · 開始檢修':'船體正常 · 查看模型');
 const ready=!!state.missionComplete;
 document.querySelector('[data-flight-action="mission"]').hidden=ready;$('mission-complete').hidden=!ready;
 $('station-supply').hidden=state.planetId!=='outpost'||state.isJumping;
 for(const node of document.querySelectorAll('[data-flight-action]'))node.disabled=state.locked||node.dataset.flightAction==='jump'&&!state.jumpReady;
}

function toast(text,action){
 const kind=action||(/燃料|補給/.test(text)?'fuel':/故障|檢修/.test(text)?'ship':/散熱/.test(text)?'radiator':/節能|推進/.test(text)?'economy':/任務/.test(text)?'mission':'check');
 const icon=document.createElement('span');icon.className='toast-symbol';icon.innerHTML=iconSvg(kind);const copy=document.createElement('span');copy.textContent=text;$('toast').replaceChildren(icon,copy);$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,2700);
}
function send(action){
 if(action==='reset'){resetView();return;}
 if(action==='look')return;
 if(action==='mission'&&state.missionComplete)action='complete';
 if(state.locked&&!['ship','engine','sound','dashboard'].includes(action))return;
 // A selected route remains pressable when fuel is low so the game can guide refuelling.
 if(action==='jump'&&!state.jumpReady)return;
 if(embedded)parent.postMessage({type:'cockpit-action',action},location.origin);
 else{if(action==='dashboard')location.assign('../0919-cinematic.html?entry=cockpit&view=dashboard');else toast('請從遊戲面板進入駕駛艙，以連動操作。');}
 const p=pushes.find(p=>p.action===action);if(p)p.until=performance.now()+180;
 if(action==='mission')toast('正在接收深空任務…','mission');
}
function applyState(next){
 const prev=state.planetId;state={...state,...next};
 meteorGame.sync(state.meteor||null);
 updateDock();
 for(const control of projectedControls.filter(c=>c.service)){
  const failed=state.engineFailed,damaged=state.damage.some(d=>d.system==='engine');
  const status=failed?'故障':damaged?'待檢修':state.isJumping?'躍遷中':'正常';
  const button=control.nodes[0];button.disabled=state.locked&&control.action!=='engine';
  if(control.action==='engine')button.setAttribute('aria-label',`量子引擎${status} · 溫度 ${state.temp} · 穩定度 ${state.quant||'99.8 %'} · 開啟引擎艙`);
 }
 $('resource-scrap').textContent=state.scrap;$('resource-crystal').textContent=state.crystal;
 $('resource-scrap').parentElement.setAttribute('aria-label','螺絲 '+state.scrap);$('resource-crystal').parentElement.setAttribute('aria-label','鑽石 '+state.crystal);
 uiIcon($('sound'),state.muted?'muted':'sound',state.muted?'靜音':'聲音');
 document.body.classList.toggle('alert',state.engineFailed||state.damage.length>0);
 document.body.classList.toggle('warp',!!state.isJumping);
 for(const button of document.querySelectorAll('#accessible-controls [data-action]')){const action=button.dataset.action;button.disabled=state.locked&&!['ship','engine'].includes(action)||action==='jump'&&!state.jumpReady;}
 for(const id of ['economy','radiator']){const on=!!state[id];switches[id].stem.rotation.x=on?-.6:.55;switches[id].led.material=on?green:mat.light;document.querySelector(`[data-action="${id}"]`).setAttribute('aria-pressed',String(on));}
 for(const p of pushes){
  if(p.action==='jump')p.group.userData.led.material=state.jumpReady&&!state.locked?amber:mat.light;
  if(p.action==='engine'&&p.group.userData.led)p.group.userData.led.material=state.engineFailed?red:cyan;
  if(p.action==='ship')p.group.userData.led.material=state.damage.length?red:cyan;
 }
 const faceState=[state.jumpReady,state.locked,state.fuel<=0?0:state.fuel<20?1:2,state.damage.length,state.engineFailed,state.missionComplete].join('|');
 for(const face of buttonFaces){if(face.signature===faceState)continue;face.signature=faceState;paintKey(face.ctx,face.canvas.width,face.canvas.height,face.action,state);face.texture.needsUpdate=true;}
 for(const face of toggleFaces){const on=!!state[face.action];if(face.on===on)continue;face.on=on;paintToggle(face.ctx,face.canvas.width,face.canvas.height,face.action,on);face.texture.needsUpdate=true;}
 if(prev!==state.planetId||!planetMaterial.map)updatePlanet();
 // A state change must repaint once even while the tab is in the background.
 if(lastFrame>0){lastScreen=-1000;render(performance.now(),true);}
}
addEventListener('message',event=>{if(!embedded||event.source!==parent||event.origin!==location.origin)return;if(event.data?.type==='cockpit-state'){applyState(event.data.state||{});$('loading').hidden=true;}if(event.data?.type==='cockpit-notice')toast(String(event.data.text||''));});
$('dashboard').onclick=()=>send('dashboard');$('reset-view').onclick=resetView;
$('accessible-controls').addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b)send(b.dataset.action);});
$('sound').onclick=()=>send('sound');

const meteorGame=createMeteorDefense({scene,camera,canvas,getRockMap:()=>atlasTextures.mercury,reduced,send:packet=>{if(embedded)parent.postMessage({type:'cockpit-meteor',...packet},location.origin);}});
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let drag=null,hover=null,lookX=0,lookY=0,targetX=0,targetY=0,zoom=0,initialPinch=0;
const projectionPoint=new THREE.Vector3();
function projectControls(){
 for(const control of projectedControls){
  let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity,front=true;
  for(const x of [-control.w/2,control.w/2])for(const y of [-control.h/2,control.h/2]){projectionPoint.set(x,y,control.z).applyMatrix4(control.group.matrixWorld).project(camera);front=front&&projectionPoint.z>-1&&projectionPoint.z<1;const px=(projectionPoint.x*.5+.5)*innerWidth,py=(-projectionPoint.y*.5+.5)*innerHeight;left=Math.min(left,px);right=Math.max(right,px);top=Math.min(top,py);bottom=Math.max(bottom,py);}
  const w=Math.max(control.min,right-left),h=Math.max(control.min,bottom-top),x=(left+right-w)/2,y=(top+bottom-h)/2,visible=front&&right>0&&left<innerWidth&&bottom>0&&top<innerHeight;
  const signature=[x,y,w,h].map(v=>v.toFixed(1)).join('|')+'|'+visible;if(signature===control.signature)continue;control.signature=signature;
  for(const node of control.nodes){node.style.left=x+'px';node.style.top=y+'px';node.style.width=w+'px';node.style.height=h+'px';node.style.visibility=visible?'visible':'hidden';}
 }
}
const pointers=new Map();
function hit(e){const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);return raycaster.intersectObjects(targets,false)[0]?.object||null;}
function setHint(text){$('hint-text').textContent=text||'拖曳環顧 · 點圖案操作';}
canvas.addEventListener('pointerdown',e=>{if(meteorGame.active){meteorGame.pointerDown(e);return;}canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const item=hit(e);hover=item;setHint(item?.userData.label);drag={x:e.clientX,y:e.clientY,startX:targetX,startY:targetY,moved:0,item};initialPinch=0;});
canvas.addEventListener('pointermove',e=>{
 if(meteorGame.active){meteorGame.pointerMove(e);return;}
 if(!pointers.has(e.pointerId)){const item=hit(e);if(hover!==item){hover=item;setHint(item?.userData.label);canvas.style.cursor=item?'pointer':'grab';}return;}
 pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(!drag)return;
 if(pointers.size===2){const p=[...pointers.values()],d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);if(initialPinch)zoom=THREE.MathUtils.clamp(zoom+(initialPinch-d)*.03,-1.5,2);initialPinch=d;drag.moved=100;return;}
 const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.moved=Math.max(drag.moved,Math.hypot(dx,dy));
 if(drag.moved>6){targetX=THREE.MathUtils.clamp(drag.startX-dx*.0022,-.75,.75);targetY=THREE.MathUtils.clamp(drag.startY+dy*.0018,-.35,.3);canvas.style.cursor='grabbing';setHint('環顧駕駛艙');}
});
function release(e){meteorGame.stopFire();pointers.delete(e.pointerId);if(!meteorGame.active&&drag&&drag.moved<8&&drag.item){const item=hit(e);if(item===drag.item)send(item.userData.action);}drag=null;initialPinch=0;canvas.style.cursor='grab';}
canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',()=>{drag=null;pointers.clear();});
canvas.addEventListener('wheel',e=>{e.preventDefault();if(meteorGame.active)return;zoom=THREE.MathUtils.clamp(zoom+e.deltaY*.003,-1.5,2);},{passive:false});
canvas.addEventListener('keydown',e=>{if(meteorGame.active){if(e.key==='Escape'){e.preventDefault();meteorGame.pause();}return;}if(e.key==='Home'||e.key==='Escape')resetView();if(e.key.startsWith('Arrow')){e.preventDefault();if(e.key==='ArrowLeft')targetX=Math.min(.75,targetX+.1);if(e.key==='ArrowRight')targetX=Math.max(-.75,targetX-.1);if(e.key==='ArrowUp')targetY=Math.max(-.35,targetY-.08);if(e.key==='ArrowDown')targetY=Math.min(.3,targetY+.08);}});
function resetView(){targetX=0;targetY=0;zoom=0;setHint();}
function resize(){const portrait=innerWidth<innerHeight,compact=!portrait&&innerWidth<700;camera.aspect=innerWidth/innerHeight;camera.fov=portrait?60:56;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);for(const service of servicePanels)service.group.position.x=service.side*(portrait?1.7:4.78);for(const p of pushes)if(p.group.userData.flightIndex!==undefined){p.group.position.x=(p.group.userData.flightIndex-1.5)*(portrait?.86:compact?1.1:1.3);p.baseScale=portrait?.7:compact?.82:1;p.group.scale.setScalar(p.baseScale);}}
addEventListener('resize',resize);resize();
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();meteorGame.pause();$('loading').hidden=false;$('loading').innerHTML='<strong>駕駛艙暫停</strong><button id="restore-context">重新進入</button>';$('restore-context').onclick=()=>location.reload();});
let lastFrame=0,lastScreen=-1000;
function render(t,force=false){if(!force)requestAnimationFrame(render);if(!force&&(document.hidden||t-lastFrame<30))return;const dt=force?0:Math.min(.06,(t-lastFrame)/1000);lastFrame=t;
 const battleView=meteorGame.active;
 cockpit.visible=!battleView;
 cabinSides.visible=forwardFrame.visible=!battleView;
 for(const service of servicePanels)service.group.visible=!battleView;
 if(battleView){targetX=0;targetY=0;zoom=0;}
 lookX=THREE.MathUtils.lerp(lookX,targetX,reduced?1:.12);lookY=THREE.MathUtils.lerp(lookY,targetY,reduced?1:.12);
 const portrait=innerWidth<innerHeight;const fittedZ=portrait?5.75*Math.max(1,.58/camera.aspect):5.65+Math.max(0,1.6/camera.aspect-1)*5;const entrance=reduced?0:Math.pow(Math.max(0,1-(t-enteredAt)/950),2)*.65;camera.position.set(0,2.35,fittedZ+zoom+entrance);camera.rotation.order='YXZ';camera.rotation.set((portrait?-.22:-.13)+lookY,lookX,0);seat.position.z=camera.position.z+.8;
 if(state.isJumping&&!reduced){camera.position.x=Math.sin(t*.04)*.012;camera.position.y+=Math.cos(t*.035)*.01;}
 warp.visible=!!state.isJumping;earthView.visible=!state.isJumping&&state.planetId==='earth';const atStation=!state.isJumping&&state.planetId==='outpost';stationArt.visible=atStation&&!!stationArt.material.map;stationView.visible=atStation&&!stationArt.visible;rocks.visible=!state.isJumping&&state.planetId==='asteroid-belt';planet.visible=!state.isJumping&&!earthView.visible&&!atStation&&!rocks.visible;atmosphere.visible=planet.visible&&!['mercury','moon'].includes(state.planetId);saturnRing.visible=planet.visible&&state.planetId==='saturn';if(warp.visible){warp.position.z=(t*.08)%50;}else if(!reduced)planet.rotation.y+=.00005;
 if(t-lastScreen>240){for(const s of screens){s.paint(s.ctx,s.canvas.width,s.canvas.height,t);s.texture.needsUpdate=true;}lastScreen=t;}
 for(const p of pushes){p.group.position.z=performance.now()<p.until ? .135 : p.rest;const size=(p.baseScale||1)*(hover?.userData.action===p.action?1.025:1);p.group.scale.setScalar(THREE.MathUtils.lerp(p.group.scale.x,size,.24));}
 const danger=state.engineFailed||state.damage.length>0;warningBar.material=danger&&Math.sin(t*.007)>0?red:danger?mat.rubber:green;
 if(meteorGame.active){earthView.visible=planet.visible=atmosphere.visible=saturnRing.visible=stationArt.visible=stationView.visible=rocks.visible=false;if(meteorGame.shake){camera.position.x+=Math.sin(t*.08)*meteorGame.shake*.22;camera.position.y+=Math.sin(t*.07)*meteorGame.shake*.1;}canvas.style.cursor='crosshair';}
 camera.updateMatrixWorld();cruiseSpace.update(dt,{battle:battleView,warping:!!state.isJumping,reduced});meteorGame.tick(dt,t);renderer.render(scene,camera);projectControls();
}
applyState(state);render(performance.now(),true);requestAnimationFrame(render);
if(!embedded)$('loading').hidden=true;
if(embedded)parent.postMessage({type:'cockpit-ready'},location.origin);
clearTimeout(hintTimer);hintTimer=setTimeout(()=>{$('hint').style.opacity='.6';},8000);
