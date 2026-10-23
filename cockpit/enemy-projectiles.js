import * as THREE from 'three';
import {DRONE_PROJECTILE_TIME} from './meteor-rules.js?v=20261023k';

// Visual projectiles share the native round's travel time; only the game owner
// decides shield damage when a volley arrives.
export function createEnemyProjectiles(parent){
 const root=new THREE.Group();parent.add(root);
 const geometry=new THREE.CylinderGeometry(1,1,1,8),shots=[];
 const up=new THREE.Vector3(0,1,0);
 function clear(){for(const shot of shots)for(const bolt of shot.bolts){root.remove(bolt.mesh);bolt.mesh.material.dispose();}shots.length=0;}
 function fire(origins,destination){
  const shot={age:0,bolts:origins.map(start=>{
   const end=destination.clone(),direction=end.clone().sub(start).normalize();
   const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color:'#ff6e95',transparent:true,opacity:.95,depthWrite:false,blending:THREE.AdditiveBlending}));
   mesh.position.copy(start);mesh.quaternion.setFromUnitVectors(up,direction);mesh.scale.set(.075,2.4,.075);root.add(mesh);
   return{mesh,start:start.clone(),end};
  })};shots.push(shot);return shot;
 }
 function update(dt){
  if(dt<=0)return;
  for(let i=shots.length-1;i>=0;i--){const shot=shots[i];shot.age+=dt;const progress=Math.min(1,shot.age/DRONE_PROJECTILE_TIME);
   for(const bolt of shot.bolts)bolt.mesh.position.lerpVectors(bolt.start,bolt.end,progress);
   if(progress>=1){for(const bolt of shot.bolts){root.remove(bolt.mesh);bolt.mesh.material.dispose();}shots.splice(i,1);}
  }
 }
 return{root,fire,update,clear,get count(){return shots.length;}};
}
