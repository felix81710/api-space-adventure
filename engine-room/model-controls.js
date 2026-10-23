import * as THREE from 'three';

const point=new THREE.Vector3(),center=new THREE.Vector3(),normal=new THREE.Vector3(),view=new THREE.Vector3(),rotation=new THREE.Quaternion();

// Touch and keyboard targets follow the model, without drawing another console.
export function projectControlRect(control,camera,width,height){
 let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity,front=true;
 const {group,w,h,x=0,y=0,z=.18}=control;
 center.set(x,y,z).applyMatrix4(group.matrixWorld);
 normal.set(0,0,1).applyQuaternion(group.getWorldQuaternion(rotation));
 if(normal.dot(view.copy(camera.position).sub(center))<=0)return{visible:false};
 for(const dx of [-w/2,w/2])for(const dy of [-h/2,h/2]){
  point.set(x+dx,y+dy,z).applyMatrix4(group.matrixWorld).project(camera);
  front=front&&point.z>-1&&point.z<1;
  const px=(point.x*.5+.5)*width,py=(-point.y*.5+.5)*height;
  left=Math.min(left,px);right=Math.max(right,px);top=Math.min(top,py);bottom=Math.max(bottom,py);
 }
 return{left,top,width:right-left,height:bottom-top,visible:front&&right>0&&left<width&&bottom>0&&top<height};
}
