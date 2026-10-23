import * as THREE from 'three';

// The outdoor view is actual surrounding space and a globe, never a photo panel.
export function createCruiseSpace({parent,camera,anisotropy=4,loadTexture}){
 const root=new THREE.Group();parent.add(root);
 const loader=loadTexture||((url,done)=>new THREE.TextureLoader().load(url,done));
 const sunDirection=new THREE.Vector3(-.58,.48,1).normalize();
 const sky=new THREE.Mesh(new THREE.SphereGeometry(260,48,32),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,
  vertexShader:'varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'varying vec3 direction;void main(){vec3 d=normalize(direction);float band=exp(-pow((d.y+.17*d.x+.1)/.25,2.0));float cloud=pow(max(0.0,dot(d,normalize(vec3(-.5,.3,-1.0)))),7.0);vec3 color=vec3(.002,.005,.011)+vec3(.007,.012,.018)*band+vec3(.009,.006,.016)*cloud;gl_FragColor=vec4(color,1.0);#include <tonemapping_fragment>\n#include <colorspace_fragment>}'
 }));root.add(sky);
 const sun=new THREE.Mesh(new THREE.PlaneGeometry(32,32),new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'varying vec2 v;void main(){float r=length(v-.5);float edge=1.0-smoothstep(.25,.5,r);float light=exp(-r*18.0)*.65+exp(-r*110.0)*3.5;gl_FragColor=vec4(vec3(1.0,.78,.49)*light,edge);}'
 }));sun.position.set(-120,66,-175);root.add(sun);
 const earth=new THREE.Group();earth.position.set(18,-22,-72);earth.rotation.set(.08,.12,.08);root.add(earth);
 const vertex='varying vec2 v;varying vec3 n;varying vec3 world;void main(){v=uv;n=normalize(mat3(modelMatrix)*normal);vec4 p=modelMatrix*vec4(position,1.0);world=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}';
 const uniforms={surface:{value:null},specular:{value:null},ready:{value:0},sunDirection:{value:sunDirection}};
 const surface=new THREE.Mesh(new THREE.SphereGeometry(46,128,64),new THREE.ShaderMaterial({uniforms,vertexShader:vertex,
  fragmentShader:'varying vec2 v;varying vec3 n;varying vec3 world;uniform sampler2D surface;uniform sampler2D specular;uniform float ready;uniform vec3 sunDirection;void main(){vec3 normal=normalize(n);float day=max(0.0,dot(normal,sunDirection));vec3 albedo=mix(vec3(.025,.08,.15),texture2D(surface,v).rgb,ready);vec3 halfVector=normalize(sunDirection+normalize(cameraPosition-world));float shine=pow(max(0.0,dot(normal,halfVector)),42.0)*texture2D(specular,v).r*day;vec3 color=albedo*(.12+day*1.35)+vec3(.42,.55,.65)*shine*.3;gl_FragColor=vec4(color,1.0);#include <tonemapping_fragment>\n#include <colorspace_fragment>}'
 }));earth.add(surface);
 const cloudUniforms={clouds:{value:null},sunDirection:{value:sunDirection}};
 const clouds=new THREE.Mesh(new THREE.SphereGeometry(46.18,128,64),new THREE.ShaderMaterial({uniforms:cloudUniforms,transparent:true,depthWrite:false,vertexShader:vertex,
  fragmentShader:'varying vec2 v;varying vec3 n;uniform sampler2D clouds;uniform vec3 sunDirection;void main(){float alpha=texture2D(clouds,v).a*.93;float day=max(0.0,dot(normalize(n),sunDirection));gl_FragColor=vec4(vec3(.77,.87,1.0)*(.16+day*1.45),alpha);#include <tonemapping_fragment>\n#include <colorspace_fragment>}'
 }));clouds.rotation.y=.035;clouds.visible=false;earth.add(clouds);
 const atmosphere=new THREE.Mesh(new THREE.SphereGeometry(46.65,128,64),new THREE.ShaderMaterial({side:THREE.BackSide,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{sunDirection:{value:sunDirection}},vertexShader:vertex,
  fragmentShader:'varying vec3 n;varying vec3 world;uniform vec3 sunDirection;void main(){float edge=pow(1.0-abs(dot(normalize(n),normalize(cameraPosition-world))),3.7);float day=.35+.65*max(0.0,dot(normalize(n),sunDirection));gl_FragColor=vec4(vec3(.16,.49,1.0),edge*day*.72);}'
 }));earth.add(atmosphere);
 // Shader chunk directives must start on their own lines.
 for(const mesh of [sky,surface,clouds])mesh.material.fragmentShader=mesh.material.fragmentShader.replaceAll(';#include',';\n#include').replaceAll('>}','>\n}');
 for(const [file,target,key,srgb]of [['earth-surface.jpg',uniforms,'surface',true],['earth-specular.jpg',uniforms,'specular',false],['earth-clouds.png',cloudUniforms,'clouds',false]]){
  loader('./textures/'+file,texture=>{texture.colorSpace=srgb?THREE.SRGBColorSpace:THREE.NoColorSpace;texture.anisotropy=anisotropy;texture.wrapS=THREE.RepeatWrapping;target[key].value=texture;if(key==='surface')uniforms.ready.value=1;if(key==='clouds')clouds.visible=true;});
 }
 return{root,sky,sun,earth,update(dt,{battle=false,warping=false,reduced=false}={}){sky.position.copy(camera.position);sky.visible=!battle;sun.visible=!battle&&!warping;sun.quaternion.copy(camera.quaternion);if(!reduced&&earth.visible){earth.rotation.y+=dt*.0008;clouds.rotation.y+=dt*.0012;}}};
}
