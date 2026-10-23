import * as THREE from 'three';

// Small shared geometries keep an entire squadron inexpensive to render.
export function createDroneFactory(){
 const metal=(color,roughness=.36)=>new THREE.MeshStandardMaterial({color,metalness:.82,roughness,envMapIntensity:1.1});
 const armor=metal('#a6b7c5'),dark=metal('#263746'),black=metal('#0b1723',.5),brass=metal('#ac8660');
 const light=color=>new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:2,metalness:.25,roughness:.25});
 const orange=light('#ff9b60'),cyan=light('#65daff'),pink=light('#dc9bff');
 const cube=new THREE.BoxGeometry(1,1,1),core=new THREE.IcosahedronGeometry(.63,1),orb=new THREE.SphereGeometry(1,24,16),ring=new THREE.TorusGeometry(1,.025,6,48);
 const gun=new THREE.CylinderGeometry(.085,.11,.65,10),nozzle=new THREE.CylinderGeometry(.17,.21,.28,12);
 const wingShape=new THREE.Shape();wingShape.moveTo(.25,.12);wingShape.lineTo(1.48,.42);wingShape.lineTo(1.28,-.35);wingShape.lineTo(.36,-.22);wingShape.closePath();
 const wingGeo=new THREE.ExtrudeGeometry(wingShape,{depth:.13,bevelEnabled:true,bevelSegments:1,bevelSize:.035,bevelThickness:.035,steps:1});
 const shieldMat=new THREE.MeshBasicMaterial({color:'#93aaff',transparent:true,opacity:.12,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
 const ringMat=new THREE.MeshBasicMaterial({color:'#aaa7ff',transparent:true,opacity:.5,depthWrite:false});
 function mesh(parent,geometry,material,x=0,y=0,z=0,sx=1,sy=sx,sz=sx){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;}
 return function create(type){
  const root=new THREE.Group(),elite=type==='droneAce',guard=type==='droneShield',accent=elite?pink:guard?cyan:orange;
  const body=mesh(root,core,metal(elite?'#9d819f':guard?'#6a7eab':'#718996'),0,0,.1,1,.7,1.05);
  mesh(root,cube,black,0,.03,.79,.76,.25,.12);
  mesh(root,cube,accent,0,.04,.86,.48,.095,.035);
  for(const x of [-.25,.25])mesh(root,cube,armor,x,-.17,.65,.12,.08,.24);
  mesh(root,cube,armor,0,.34,.19,.38,.13,.62);
  mesh(root,cube,brass,0,-.3,.22,.29,.07,.4);
  const engines=[],muzzles=[];
  for(const side of [-1,1]){
   const wing=mesh(root,wingGeo,guard?dark:armor);wing.scale.x=side;wing.rotation.y=side*.13;
   mesh(root,cube,dark,side*.91,.04,.19,.64,.24,.085).rotation.z=side*.18;
   for(let i=0;i<4;i++)mesh(root,cube,black,side*(.59+i*.16),.16,.25,.065,.12,.045).rotation.z=side*.2;
   mesh(root,cube,accent,side*1.26,-.18,.22,.05,.17,.035);
   const barrel=mesh(root,gun,dark,side*.84,-.32,.3);barrel.rotation.x=Math.PI/2;
   muzzles.push(mesh(root,orb,accent.clone(),side*.84,-.32,.64,.065,.065,.035));
   const engine=mesh(root,nozzle,black,side*.49,-.1,-.48);engine.rotation.x=Math.PI/2;
   engines.push(mesh(root,orb,cyan,side*.49,-.1,-.64,.12,.12,.08));
   for(const y of [-.04,.17])mesh(root,orb,brass,side*1.18,y,.24,.034);
  }
  if(elite){mesh(root,cube,dark,0,.48,-.03,.18,.4,.32);mesh(root,orb,pink,0,.7,.15,.09);for(const x of [-.25,.25])mesh(root,cube,pink,x,.13,.87,.1,.065,.035);}
  const shield=new THREE.Group();root.add(shield);shield.visible=guard||elite;
  mesh(shield,orb,shieldMat,0,0,0,1.65,.91,.9);
  mesh(shield,ring,ringMat,0,0,.02,1.65,.91,1);
  const charge=mesh(root,ring,new THREE.MeshBasicMaterial({color:'#ff8677',transparent:true,opacity:0,depthWrite:false}),0,0,.9,1.7,1.05,1);
  return{root,body,shield,charge,engines,muzzles,getMuzzles:()=>muzzles.map(m=>m.getWorldPosition(new THREE.Vector3())),update(age,warning){charge.material.opacity=warning*(.45+Math.sin(age*16)*.15);charge.rotation.z=age*.5;charge.scale.setScalar(1.1+warning*.3);for(const muzzle of muzzles){muzzle.material.color.set(warning?'#ff796d':accent.color);muzzle.material.emissive.set(warning?'#ff796d':accent.color);muzzle.material.emissiveIntensity=warning?2+warning*2:1.3;}for(const engine of engines)engine.scale.z=.09+Math.sin(age*10)*.025;},dispose(){charge.material.dispose();for(const muzzle of muzzles)muzzle.material.dispose();}};
 };
}
