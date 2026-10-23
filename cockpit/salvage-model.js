import * as THREE from 'three';
import {SALVAGE_KINDS,GRAB_SECONDS,RETURN_SECONDS} from './salvage-rules.js?v=20261023l';

export function createSalvageModel({scene,camera,reduced=false}){
 if(!camera.parent)scene.add(camera);
 const root=new THREE.Group();camera.add(root);root.visible=false;
 const cube=new THREE.BoxGeometry(1,1,1),cylinder=new THREE.CylinderGeometry(1,1,1,16),sphere=new THREE.SphereGeometry(1,16,12),ring=new THREE.TorusGeometry(1,.1,8,28),crystal=new THREE.OctahedronGeometry(1,0);
 const metal=new THREE.MeshStandardMaterial({color:'#849ba8',metalness:.85,roughness:.3}),dark=new THREE.MeshStandardMaterial({color:'#1a2b3a',metalness:.65,roughness:.4}),gold=new THREE.MeshStandardMaterial({color:'#ad8b53',metalness:.75,roughness:.35});
 const colors=Object.fromEntries(Object.entries(SALVAGE_KINDS).map(([key,value])=>[key,new THREE.MeshStandardMaterial({color:value.color,emissive:value.color,emissiveIntensity:.3,metalness:.4,roughness:.28})]));
 function mesh(parent,geo,material,x=0,y=0,z=0,sx=1,sy=sx,sz=sx){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;}
 function part(kind){
  const g=new THREE.Group(),color=colors[kind];
  if(kind==='cell'){
   mesh(g,cube,dark,0,0,0,.65,.95,.42);for(const side of [-1,1])mesh(g,cube,metal,0,side*.45,0,.78,.14,.55);
   mesh(g,cube,color,0,0,.23,.4,.62,.05);mesh(g,cube,color,0,.57,0,.3,.13,.25);mesh(g,cube,metal,0,0,.29,.4,.05,.02);mesh(g,cube,metal,0,0,.29,.05,.3,.02);
  }else if(kind==='gear'){
   const disk=mesh(g,cylinder,gold,0,0,0,.45,.25,.45);disk.rotation.x=Math.PI/2;
   for(let i=0;i<8;i++){const a=i*Math.PI/4,tooth=mesh(g,cube,color,Math.cos(a)*.45,Math.sin(a)*.45,0,.27,.24,.3);tooth.rotation.z=a;}
   mesh(g,ring,metal,0,0,.16,.23);mesh(g,sphere,dark,0,0,.16,.16,.16,.08);
  }else{
   mesh(g,cube,dark,0,-.45,0,.8,.18,.6);mesh(g,crystal,color,0,.12,0,.35,.7,.35);
   for(const side of [-1,1]){const c=mesh(g,crystal,color,side*.3,-.02,.03,.2,.43,.2);c.rotation.z=-side*.32;}
   mesh(g,cube,metal,0,-.27,.23,.7,.09,.08);
  }
  return g;
 }
 const arm=new THREE.Group();root.add(arm);const base=new THREE.Group();arm.add(base);
 mesh(base,cylinder,dark,0,0,0,.52,.25,.52);mesh(base,cylinder,metal,0,.17,0,.36,.18,.36);mesh(base,sphere,gold,0,.32,0,.24);
 const upper=mesh(arm,cylinder,metal),lower=mesh(arm,cylinder,dark),hydraulic=mesh(arm,cylinder,gold),elbow=mesh(arm,sphere,gold,0,0,0,.24),wrist=mesh(arm,sphere,metal,0,0,0,.19);
 const claw=new THREE.Group();arm.add(claw);mesh(claw,cylinder,dark,0,.14,0,.25,.24,.25);mesh(claw,ring,colors.cell,0,.13,0,.25).rotation.x=Math.PI/2;
 const fingers=[];for(let i=0;i<3;i++){const pivot=new THREE.Group();pivot.rotation.y=i*Math.PI*2/3;claw.add(pivot);const digit=new THREE.Group();digit.position.x=.2;pivot.add(digit);mesh(digit,cube,metal,0,-.23,0,.12,.5,.15);mesh(digit,cube,gold,-.1,-.49,0,.3,.13,.16);fingers.push(digit);}
 const bins={};for(const kind of Object.keys(SALVAGE_KINDS)){
  const g=new THREE.Group();root.add(g);mesh(g,cube,dark,0,-.28,0,1.35,.22,1.05);
  for(const x of [-.65,.65])mesh(g,cube,metal,x,-.04,0,.1,.5,1.05);
  mesh(g,cube,metal,0,-.04,-.5,1.3,.5,.1);mesh(g,cube,colors[kind],0,-.04,.5,1.3,.12,.08);
  const sample=part(kind);sample.position.set(0,-.12,0);sample.scale.setScalar(.44);g.add(sample);
  const glow=mesh(g,ring,colors[kind],0,.03,0,.58);glow.rotation.x=Math.PI/2;bins[kind]={root:g,glow,target:new THREE.Vector3()};
 }
 const parts=new Map(),up=new THREE.Vector3(0,1,0),rest=new THREE.Vector3(),hold=new THREE.Vector3(),end=new THREE.Vector3(),joint=new THREE.Vector3();
 let roundId=null,lastStage=null,lastSelected=null,grabOrigin=new THREE.Vector3();
 const smooth=t=>{t=THREE.MathUtils.clamp(t,0,1);return t*t*(3-2*t);};
 function rod(m,a,b,r){m.position.copy(a).add(b).multiplyScalar(.5);m.scale.set(r,a.distanceTo(b),r);m.quaternion.setFromUnitVectors(up,b.clone().sub(a).normalize());}
 function reset(id,pieces){
  if(roundId===id)return;roundId=id;lastStage=null;lastSelected=null;
  for(const p of parts.values())root.remove(p.mesh);parts.clear();
  for(const p of pieces){const g=part(p.kind);g.scale.setScalar(.72);root.add(g);parts.set(p.id,{...p,mesh:g});}
 }
 function update(snapshot,elapsed,width=1280,height=720){
  if(!snapshot?.salvage){root.visible=false;return;}
  root.visible=true;const s=snapshot.salvage;reset(snapshot.id,s.pieces);
  const h=10*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)),w=h*camera.aspect;
  for(const [i,p]of [...parts.values()].entries()){
   const native=s.pieces.find(n=>n.id===p.id);p.mesh.visible=!native.recovered;
   p.mesh.position.set((i%3-1)*w*.64+Math.sin(elapsed*.6+p.id)*w*.025,(i<3?.48:-.05)*h+Math.cos(elapsed*.7+p.id)*.1,-10);
   if(!reduced)p.mesh.rotation.set(Math.sin(elapsed*.35+p.id)*.18,Math.sin(elapsed*.5+p.id)*.3,Math.sin(elapsed*.4+p.id)*.12);
  }
  const binH=h*.7,binW=w*.7,kindList=Object.keys(bins);
  const trayWidth=height<=560&&width>height?420:Math.min(540,width*.9),trayGap=width<=600?10:16,step=(trayWidth+trayGap)/3;
  kindList.forEach((kind,i)=>{const b=bins[kind];b.root.position.set((i-1)*binW*step*2/width,-binH*.48,-7);b.root.scale.setScalar(Math.min(1,binW*.36));b.target.copy(b.root.position).add(new THREE.Vector3(0,.5,0));b.glow.material=colors[kind];});
  base.position.set(w*.6*.78,-h*.6*.82,-6);rest.copy(base.position).add(new THREE.Vector3(-.3,.9,-.6));hold.set(0,-h*.25,-7.3);end.copy(rest);
  const p=parts.get(s.selectedId);
  if(s.stage==='grabbing'&&(lastStage!=='grabbing'||lastSelected!==s.selectedId))grabOrigin.copy(p.mesh.position);
  let closed=false;
  if(s.stage==='grabbing'){
   const t=THREE.MathUtils.clamp((elapsed-s.startedAt)/GRAB_SECONDS,0,1);
   if(t<.55)end.lerpVectors(rest,grabOrigin,smooth(t/.55));else{closed=true;end.lerpVectors(grabOrigin,hold,smooth((t-.55)/.45));p.mesh.position.copy(end);}
  }else if(s.stage==='carrying'){closed=true;end.copy(hold);if(p)p.mesh.position.copy(end);}
  else if(s.stage==='returning'){closed=true;end.lerpVectors(hold,bins[s.bin].target,smooth((elapsed-s.startedAt)/RETURN_SECONDS));if(p)p.mesh.position.copy(end);}
  claw.position.copy(end).add(new THREE.Vector3(0,.35,0));for(const digit of fingers)digit.rotation.z=closed?.1:-.55;
  const shoulder=base.position.clone().add(new THREE.Vector3(0,.35,0));joint.copy(shoulder).lerp(end,.48).add(new THREE.Vector3(.2,.8,.6));
  rod(upper,shoulder,joint,.14);rod(lower,joint,end,.105);rod(hydraulic,shoulder.clone().add(new THREE.Vector3(-.2,0,.2)),joint,.055);elbow.position.copy(joint);wrist.position.copy(end);
  arm.visible=['playing','paused','result'].includes(snapshot.phase);lastStage=s.stage;lastSelected=s.selectedId;root.updateWorldMatrix(true,true);
 }
 return{root,update,getTarget(id){const p=parts.get(id);return p?.mesh.visible?p.mesh.getWorldPosition(new THREE.Vector3()):null;},getClaw(){return claw.getWorldPosition(new THREE.Vector3());}};
}
