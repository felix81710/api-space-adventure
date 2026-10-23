import * as THREE from 'three';

export function createBattleWeapons({scene,camera,reduced=false}){
 if(!camera.parent)scene.add(camera);
 const root=new THREE.Group();camera.add(root);root.visible=false;
 const mat=(color,metalness=.8,roughness=.34)=>new THREE.MeshStandardMaterial({color,metalness,roughness,envMapIntensity:.85});
 const shell=mat('#526977'),dark=mat('#152736'),steel=mat('#becbd1'),black=mat('#06111b',.2,.7),brass=mat('#9c7f52');
 const power=new THREE.MeshStandardMaterial({color:'#74def2',emissive:'#4bb6eb',emissiveIntensity:1.1,metalness:.4,roughness:.25});
 const cube=new THREE.BoxGeometry(1,1,1),barrelGeo=new THREE.CylinderGeometry(.12,.16,1.45,16),ringGeo=new THREE.TorusGeometry(.17,.035,8,24),muzzleGeo=new THREE.CylinderGeometry(.22,.19,.25,16),orb=new THREE.SphereGeometry(1,16,10);
 const guns=[],forward=new THREE.Vector3(0,0,1),localAim=new THREE.Vector3(0,0,-80);
 function add(parent,geo,material,x,y,z,sx=1,sy=sx,sz=sx){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;}
 for(const side of [-1,1]){
  const pivot=new THREE.Group();root.add(pivot);const slide=new THREE.Group();pivot.add(slide);
  add(pivot,cube,dark,0,-.2,-.25,.6,.3,1.1);add(pivot,cube,shell,0,-.05,-.2,.48,.25,.75);
  for(const x of [-.23,.23])for(const z of [-.5,.12])add(pivot,orb,brass,x,-.02,z,.035);
  add(slide,cube,shell,0,0,.06,.48,.38,.7);add(slide,cube,black,0,.2,.09,.3,.035,.55);
  for(let i=0;i<4;i++)add(slide,cube,power,-.25,.04,-.19+i*.13,.025,.12,.065);
  const barrel=add(slide,barrelGeo,steel,0,0,.88);barrel.rotation.x=Math.PI/2;
  for(let i=0;i<6;i++)add(slide,ringGeo,i%2?dark:steel,0,0,.31+i*.19);
  const nozzle=add(slide,muzzleGeo,shell,0,0,1.61);nozzle.rotation.x=Math.PI/2;
  const bore=add(slide,new THREE.CircleGeometry(.145,24),black,0,0,1.74);bore.rotation.y=0;
  add(slide,ringGeo,power,0,0,1.75,.87);
  const emitter=new THREE.Object3D();emitter.position.z=1.78;slide.add(emitter);
  const flash=add(emitter,orb,new THREE.MeshBasicMaterial({color:'#b5f8ff',transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}),0,0,.025,.23,.23,.4);
  guns.push({side,pivot,slide,emitter,flash,kick:0});
 }
 function layout(){const h=3.9*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)),x=h*camera.aspect*.78;for(const g of guns)g.pivot.position.set(g.side*x,-h*.7,-3.9);}
 function aim(world){layout();localAim.copy(world);camera.worldToLocal(localAim);for(const g of guns)g.pivot.quaternion.setFromUnitVectors(forward,localAim.clone().sub(g.pivot.position).normalize());}
 function fire(world){aim(world);const origins=[];for(const g of guns){g.kick=1;g.slide.position.z=reduced?0:-.1;g.flash.material.opacity=.95;g.emitter.updateWorldMatrix(true,false);origins.push(g.emitter.getWorldPosition(new THREE.Vector3()));}return origins;}
 return{root,aim,fire,update(dt){layout();for(const g of guns){g.kick=Math.max(0,g.kick-dt*9);g.slide.position.z=reduced?0:-g.kick*.1;g.flash.material.opacity=g.kick*.9;g.flash.scale.set(.23*(1+g.kick*.4),.23*(1+g.kick*.4),.4);}},reset(){for(const g of guns){g.kick=0;g.slide.position.z=0;g.flash.material.opacity=0;}},getMuzzles(){return guns.map(g=>g.emitter.getWorldPosition(new THREE.Vector3()));}};
}
