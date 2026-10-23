import * as THREE from 'three';
import {iconSvg} from './icons.js?v=20261023l';
import {ROUND_SECONDS,SHOT_INTERVAL,HEAT_PER_SHOT,TYPES,coolWeapon,spawnInterval,DRONE_CHARGE,DRONE_MAX_VOLLEYS,droneFireAt} from './meteor-rules.js?v=20261023k';
import {createDroneFactory} from './drone-model.js?v=20261023k';
import {createBattleWeapons} from './battle-weapons.js?v=20261023e';
import {createEnemyProjectiles} from './enemy-projectiles.js?v=20261023k';
import {createSalvageGame} from './salvage-game.js?v=20261023l';

export function createMeteorDefense({scene,camera,canvas,getRockMap,send,reduced=false}){
 const root=document.createElement('section');root.id='meteor-game';root.hidden=true;root.setAttribute('aria-label','隕石攔截戰');
 root.innerHTML=`<div class="meteor-top"><div class="meteor-title"><i>${iconSvg('meteor')}</i><span>隕石攔截<small>ASTEROID DEFENSE</small></span></div><div class="meteor-counters"><span title="擊碎隕石"><i>${iconSvg('meteor')}</i><b id="meteor-score">0</b></span><span class="ore-counter" title="發現礦石"><i>${iconSvg('crystal')}</i><b id="meteor-ore">0</b></span><span class="meteor-time"><b id="meteor-time">60</b><small>s</small></span></div><button id="meteor-pause" aria-label="暫停隕石攔截">Ⅱ</button></div>
 <div id="meteor-wave" class="meteor-wave" aria-label="三波隕石"><i></i><i></i><i></i></div>
 <div id="meteor-targets" aria-label="來襲隕石"></div><div id="meteor-feedback" aria-hidden="true"></div><div id="meteor-vignette" aria-hidden="true"></div>
 <div class="meteor-bottom"><div class="meteor-health"><i>${iconSvg('shield')}</i><div><small>護盾</small><span class="meteor-meter"><span id="meteor-health-fill"></span></span></div><b id="meteor-health">100</b></div><div class="meteor-heat"><i>${iconSvg('weapons')}</i><div><small id="meteor-heat-label">雷射溫度</small><span class="meteor-meter"><span id="meteor-heat-fill"></span></span></div></div><button id="meteor-guard" aria-label="啟動防護罩"><i>${iconSvg('shield')}</i><span id="meteor-guard-label">防護罩</span></button></div>
 <div id="meteor-sheet" class="meteor-sheet"><div class="meteor-sheet-card" role="dialog" aria-modal="true" aria-label="隕石攔截控制"><div class="meteor-emblem">${iconSvg('meteor')}<span>⌖</span></div><h2 id="meteor-sheet-title">守護阿屁號</h2><div id="meteor-intro"><p>點隕石開火 · 按住連射</p><div class="meteor-instructions"><span><i>${iconSvg('meteor')}</i><small>擊碎</small></span><b>›</b><span><i>${iconSvg('crystal')}</i><small>收集</small></span><b>›</b><span><i>${iconSvg('shield')}</i><small>防護</small></span></div><small id="meteor-mode-note">60 秒 · 三波挑戰</small></div><div id="meteor-results" hidden><div id="meteor-stars" class="meteor-stars" aria-label="挑戰星級"></div><div class="meteor-result-stats"><span><i>${iconSvg('meteor')}</i><b id="meteor-total">0</b></span><span><i>${iconSvg('screw')}</i><b id="meteor-scrap">+0</b></span><span><i>${iconSvg('crystal')}</i><b id="meteor-crystal">+0</b></span></div></div><div id="meteor-pause-note" hidden>休息一下，航道已暫停。</div><div class="meteor-sheet-actions"><button id="meteor-play" aria-label="開始隕石攔截"><span>▶</span>開始攔截</button><button id="meteor-resume" aria-label="繼續隕石攔截" hidden><span>▶</span>繼續</button><button id="meteor-again" aria-label="再玩一次隕石攔截" hidden>↻ 再玩一次</button><button id="meteor-leave" aria-label="返回駕駛艙">${iconSvg('dashboard')}<span>返回駕駛艙</span></button></div></div></div>`;
 document.body.append(root);const $=id=>root.querySelector('#'+id),group=new THREE.Group();scene.add(group);group.visible=false;
 root.setAttribute('aria-label','全景太空遊戲');root.querySelector('[role="dialog"]').setAttribute('aria-label','太空遊戲控制');
 $('meteor-intro').insertAdjacentHTML('beforebegin',`<div id="meteor-select" hidden><button id="mode-meteor" aria-label="選擇隕石攔截"><i>${iconSvg('meteor')}</i><span>打隕石<small>☄ · ◆ · 🛡</small></span><b>01</b></button><button id="mode-drone" aria-label="選擇無人機攔截"><i>${iconSvg('drone')}</i><span>攔截無人機<small>⌖ · ⚡ · 🛡</small></span><b>02</b></button></div>`);
 root.querySelector('.meteor-sheet-actions').insertAdjacentHTML('beforeend',`<button id="meteor-choose" aria-label="選擇其他射擊遊戲" hidden>${iconSvg('games')}換個遊戲</button>`);
 $('meteor-select').insertAdjacentHTML('beforeend',`<button id="mode-salvage" aria-label="選擇太空打撈"><i>${iconSvg('salvage')}</i><span>太空打撈<small>抓取 · 分類 · 回收</small></span><b>03</b></button>`);
 $('meteor-results').insertAdjacentHTML('beforeend',`<div id="drone-result-detail" hidden><span>${iconSvg('combo')}<b id="drone-best-combo">0</b><small>最高連擊</small></span><span><b id="drone-points">0</b><small>總分</small></span></div>`);
 root.querySelector('.meteor-top').insertAdjacentHTML('beforeend','<button id="meteor-stop" aria-label="終止目前遊戲" title="終止目前遊戲"><b>■</b><small>終止</small></button>');
 root.querySelector('.meteor-sheet-actions').insertAdjacentHTML('beforeend','<button id="meteor-abort" aria-label="終止目前遊戲並返回駕駛艙" hidden>■ 終止遊戲</button>');
 root.querySelector('.meteor-top').insertAdjacentHTML('afterend',`<div id="drone-alert" role="status" aria-live="polite" hidden><i>${iconSvg('warning')}</i><span>雷射來襲</span><i>${iconSvg('shield')}</i></div>`);
 const targetLayer=$('meteor-targets'),feedback=$('meteor-feedback'),ray=new THREE.Raycaster(),point=new THREE.Vector3(),ndc=new THREE.Vector2();
 let round=null,seq=0,phase=null,elapsed=0,nextSpawn=0,serial=0,heat=0,overheated=false,lastFire=-10,firing=null,lastUI=-1,shake=0,hitGlow=0,lastTexture=null,configuredMode=null;
 const createDrone=createDroneFactory();
 const weapons=createBattleWeapons({scene,camera,reduced}),hostileLasers=createEnemyProjectiles(group);
 const salvageGame=createSalvageGame({scene,camera,reduced,send:(action,extra)=>emit(action,extra)});
 let aimPosition=null;
 const entities=[],effects=[],materials=[],geometries=[];
 const rockMaterials=['#b5aa96','#bdb8a9','#a3aaa5'].map(color=>{const m=new THREE.MeshStandardMaterial({color,roughness:.94,metalness:.08,envMapIntensity:.38,flatShading:false});materials.push(m);return m;});
 const ice=new THREE.MeshStandardMaterial({color:'#9dccdf',roughness:.3,metalness:.23,emissive:'#0e3a55',emissiveIntensity:.25,envMapIntensity:.6});materials.push(ice);
 const oreMaterial=new THREE.MeshStandardMaterial({color:'#e8c58a',emissive:'#a16820',emissiveIntensity:.65,metalness:.65,roughness:.26});materials.push(oreMaterial);
 const crystalGeo=new THREE.OctahedronGeometry(.35,0);geometries.push(crystalGeo);
 const rockGeos=[0,1,2].map(k=>{const g=new THREE.IcosahedronGeometry(1,3),a=g.attributes.position;for(let i=0;i<a.count;i++){const x=a.getX(i),y=a.getY(i),z=a.getZ(i);let r=1+.08*Math.sin(x*13+y*17+z*9+k)+.06*Math.sin(x*29-y*19+z*23);for(const [cx,cy,cz]of [[.7,.6,.2],[-.3,.4,.85],[.1,-.8,.6]]){const dot=x*cx+y*cy+z*cz;r-=.12*Math.exp(-Math.pow((1-dot)*7,2));}a.setXYZ(i,x*r,y*r,z*r);}g.computeVertexNormals();geometries.push(g);return g;});
 const beamGeo=new THREE.CylinderGeometry(1,1,1,6);geometries.push(beamGeo);
 // Both sky and shield surround the ship; neither has a rectangular edge.
 const shieldUniforms={time:{value:0},strength:{value:0},tint:{value:new THREE.Color('#6bcde9')},forward:{value:new THREE.Vector3(0,0,-1)}};
 const shield=new THREE.Mesh(new THREE.SphereGeometry(18,64,32),new THREE.ShaderMaterial({side:THREE.BackSide,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:shieldUniforms,
  vertexShader:'varying vec2 v;varying vec3 direction;void main(){v=uv;direction=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'varying vec2 v;varying vec3 direction;uniform float time;uniform float strength;uniform vec3 tint;uniform vec3 forward;void main(){vec2 q=v*vec2(150.0,75.0),s=vec2(1.0,1.73205),h=s*.5;vec2 a=mod(q,s)-h,b=mod(q-h,s)-h;vec2 cell=dot(a,a)<dot(b,b)?a:b;float d=max(dot(abs(cell),normalize(vec2(1.0,1.73205))),abs(cell.x));float grid=smoothstep(.46,.5,d);float r=acos(clamp(dot(normalize(direction),forward),-1.0,1.0));float ripple=pow(.5+.5*sin(r*33.0-time*7.0),8.0);float edge=smoothstep(.25,1.4,r);float alpha=strength*(grid*.09+ripple*.055+edge*.1);gl_FragColor=vec4(tint,alpha);}'
 }));group.add(shield);shield.visible=false;
 const backdropCanvas=document.createElement('canvas');backdropCanvas.width=1024;backdropCanvas.height=512;const bc=backdropCanvas.getContext('2d');bc.fillStyle='#020810';bc.fillRect(0,0,1024,512);
 for(const [x,y,r,color]of [[240,240,240,'#102d40'],[510,210,260,'#153343'],[760,260,230,'#211c37'],[570,330,180,'#111e33']]){const cloud=bc.createRadialGradient(x,y,0,x,y,r);cloud.addColorStop(0,color);cloud.addColorStop(1,'#00000000');bc.fillStyle=cloud;bc.fillRect(0,0,1024,512);}
 const backdropMap=new THREE.CanvasTexture(backdropCanvas);backdropMap.colorSpace=THREE.SRGBColorSpace;
 const backdrop=new THREE.Mesh(new THREE.SphereGeometry(240,48,24),new THREE.MeshBasicMaterial({map:backdropMap,side:THREE.BackSide,depthWrite:false,toneMapped:false}));backdrop.rotation.y=.6;group.add(backdrop);
 function emit(action,extra={}){if(!round)return;send({action,roundId:round.id,seq:++seq,...extra});}
 function clearEntities(){hostileLasers.clear();for(const e of entities){group.remove(e.mesh);e.body.material.dispose();e.drone?.dispose();e.button.remove();}entities.length=0;for(const e of effects){group.remove(e.mesh);if(e.owned)e.mesh.geometry.dispose();e.mesh.material.dispose();}effects.length=0;feedback.replaceChildren();}
 function reset(){clearEntities();elapsed=0;nextSpawn=.65;serial=0;heat=0;overheated=false;lastFire=-10;firing=null;hitGlow=0;shake=0;lastUI=-1;aimPosition=null;weapons.reset();spawn(round.mode==='drone'?'drone':'rock',-.72,.32,0,round.mode==='meteor'?7.5:10,round.mode==='meteor'?23:28);}
 function configureMode(mode){
  if(configuredMode===mode)return;configuredMode=mode;const enemy=mode==='drone',icon=enemy?'drone':'meteor',name=enemy?'無人機攔截':'隕石攔截';root.classList.toggle('drone-mode',enemy);
  $('meteor-wave').setAttribute('aria-label',enemy?'三波敵機':'三波隕石');targetLayer.setAttribute('aria-label',enemy?'來襲無人機':'來襲隕石');
  root.querySelector('.meteor-title>i').innerHTML=iconSvg(icon);root.querySelector('.meteor-title>span').innerHTML=name+'<small>'+(enemy?'DRONE INTERCEPT':'ASTEROID DEFENSE')+'</small>';
  root.querySelector('.meteor-counters>span:first-child i').innerHTML=iconSvg(enemy?'drone':'meteor');root.querySelector('.meteor-counters>span:first-child').title=enemy?'攔截敵機':'擊碎隕石';
  root.querySelector('.meteor-result-stats>span:first-child i').innerHTML=iconSvg(enemy?'drone':'meteor');
  root.querySelector('.ore-counter i').innerHTML=iconSvg(enemy?'combo':'crystal');root.querySelector('.ore-counter').title=enemy?'四秒內連續擊落加分':'發現礦石';
  root.querySelector('.meteor-emblem>svg').outerHTML=iconSvg(icon);$('meteor-intro').querySelector('p').textContent=enemy?'點敵機開火 · 紅光蓄能時先攔截':'點隕石開火 · 按住連射';
  root.querySelector('.meteor-instructions').innerHTML=(enemy?[['drone','攔截'],['warning','敵機蓄能'],['shield','擋下雷射']]:[['meteor','擊碎'],['crystal','收集'],['shield','防護']]).map(([icon,label],i)=>(i?'<b>›</b>':'')+'<span><i>'+iconSvg(icon)+'</i><small>'+label+'</small></span>').join('');
  for(const [id,verb]of [['meteor-play','開始'],['meteor-pause','暫停'],['meteor-resume','繼續'],['meteor-again','再玩一次']])$(id).setAttribute('aria-label',verb+name);
  backdrop.rotation.y=enemy?1.4:.6;
 }
 function sync(snapshot){
  salvageGame.sync(snapshot?.mode==='salvage'?snapshot:null);
  if(!snapshot){if(round){clearEntities();round=null;phase=null;root.hidden=true;group.visible=weapons.root.visible=false;document.body.classList.remove('meteor-mode','meteor-hot');}return;}
  if(snapshot.mode==='salvage'){
   if(round?.id!==snapshot.id){seq=0;clearEntities();elapsed=0;shake=0;}
   round=snapshot;phase=round.phase;root.hidden=true;group.visible=true;shield.visible=false;weapons.root.visible=false;document.body.classList.add('meteor-mode');document.body.classList.remove('meteor-hot');return;
  }
  const isNew=round?.id!==snapshot.id,previous=phase,previousShield=round?.shield,previousBlocked=round?.blocked||0;if(isNew){seq=0;clearEntities();}
  round=snapshot;phase=round.phase;if(!isNew&&(round.shield<previousShield||round.blocked>previousBlocked)){hitGlow=.85;shake=round.shield<previousShield?.18:0;}if(!['playing','paused'].includes(phase))hostileLasers.clear();configureMode(round.mode||'meteor');root.hidden=false;document.body.classList.add('meteor-mode');group.visible=true;weapons.root.visible=['playing','paused','result'].includes(phase);
  if(phase==='playing'&&(previous==='intro'||isNew))reset();
  if(phase==='playing')elapsed=Math.max(elapsed,Number(snapshot.elapsed)||0);
  if(phase!=='playing')firing=null;
  $('meteor-sheet').hidden=phase==='playing';$('meteor-select').hidden=phase!=='select';$('meteor-intro').hidden=phase!=='intro';$('meteor-results').hidden=phase!=='result';$('meteor-pause-note').hidden=phase!=='paused';$('meteor-play').hidden=phase!=='intro';$('meteor-resume').hidden=phase!=='paused';$('meteor-again').hidden=phase!=='result'||round.encounter;
  $('meteor-choose').hidden=!['intro','result'].includes(phase)||round.encounter;root.classList.toggle('selecting',phase==='select');
  $('meteor-stop').hidden=!['playing','paused'].includes(phase);$('meteor-abort').hidden=phase!=='paused';
  $('meteor-sheet-title').textContent=phase==='select'?'選擇挑戰':phase==='intro'?(round.mode==='drone'?'無人機來襲！':'守護阿屁號'):phase==='paused'?'航道已暫停':round.reason==='shield'?'返回整備，再出發！':round.mode==='drone'?'敵機已攔截！':'航道清理完成！';
  $('meteor-mode-note').textContent=round.training?'護盾不足 · 本輪為無獎勵練習':'60 秒 · 三波挑戰';
  $('meteor-pause').disabled=phase!=='playing';$('meteor-guard').disabled=phase!=='playing'||round.guardCooldown>0;
  $('meteor-score').textContent=round.destroyed;$('meteor-ore').textContent=round.mode==='drone'?'×'+(round.combo||0):round.ore;$('meteor-time').textContent=round.timeLeft;root.querySelector('.ore-counter').classList.toggle('combo-live',round.mode==='drone'&&round.combo>=2);
  const health=round.shield,maximum=round.shieldMax;
  $('meteor-health').textContent=Math.round(health);$('meteor-health-fill').style.width=Math.max(0,Math.min(100,health/maximum*100))+'%';
  $('meteor-health-fill').classList.toggle('low',health/maximum<.3);
  $('meteor-guard-label').textContent=round.guardActive?'防護中':round.guardCooldown?round.guardCooldown+'s':'防護罩';$('meteor-guard').classList.toggle('active',round.guardActive);
  $('meteor-guard').setAttribute('aria-label',round.guardCooldown?'防護罩冷卻 '+round.guardCooldown+' 秒':'啟動防護罩');
  [...$('meteor-wave').children].forEach((el,i)=>el.classList.toggle('active',i<round.wave));
  if(phase==='result'){
   $('meteor-total').textContent=round.destroyed;$('meteor-scrap').textContent='+'+round.rewards.scrap;$('meteor-crystal').textContent='+'+round.rewards.crystal;
   $('meteor-stars').textContent='★'.repeat(round.stars)+'☆'.repeat(3-round.stars);$('meteor-stars').setAttribute('aria-label',round.stars+' 顆星');
   $('drone-best-combo').textContent='×'+(round.bestCombo||0);$('drone-points').textContent=round.points;
  }
  $('drone-result-detail').hidden=phase!=='result'||round.mode==='meteor';
  for(const e of entities){e.button.disabled=phase!=='playing';e.button.hidden=phase!=='playing';}
 }
 function buttonFor(e){
  const b=document.createElement('button');b.className='meteor-target'+(e.drone?' drone-target':'');b.dataset.meteorId=e.id;b.type='button';b.setAttribute('aria-label',e.label);b.title=e.label;b.innerHTML='<span></span>'+(e.drone?'<i class="drone-hp" aria-hidden="true">'+Array.from({length:TYPES[e.type].hp},()=>'<em></em>').join('')+'</i>':'');targetLayer.append(b);
  b.addEventListener('pointerdown',event=>{event.preventDefault();event.stopPropagation();aimPosition={x:event.clientX,y:event.clientY};firing={x:event.clientX,y:event.clientY,id:e.id,pointerId:event.pointerId};fire(e);});
  b.addEventListener('click',event=>{if(event.detail===0)fire(e);});return b;
 }
 function spawn(type=null,x=null,y=null,age=0,duration=null,range=null){
  if(serial>=180||entities.length>=(round.mode==='meteor'?10:8))return;
  const wave=round?.wave||1;if(!type){const n=serial+1;type=round.mode!=='meteor'?(wave>=2&&n%6===0?'droneAce':n%3===0?'droneShield':'drone'):n%5===0?'ore':wave>=2&&n%4===0?'large':n%3===0?'ice':'rock';}
  // Alternate outer and inner lanes, so both side views are playable every wave.
  const lane=[-.78,.78,-.34,.36,0][serial%5];
  const isDrone=!!TYPES[type].mode;
  const e={id:++serial,type,hp:TYPES[type].hp,age,born:elapsed-age,duration:duration||(isDrone?[10,9,8][wave-1]:[12,10.5,9][wave-1]),range:range||(isDrone?28:48)+Math.random()*18,anchor:new THREE.Vector2(x??lane+(Math.random()-.5)*.08,y??(-.04+Math.random()*.58)),radius:isDrone?(TYPES[type].hp===3?2.8:TYPES[type].hp===2?2.5:2.2):type==='large'?1.8:type==='fragment'?.7:1.16+Math.random()*.3,rotation:new THREE.Vector3(Math.random()*.5,Math.random()*.5,Math.random()*.2),flash:0};
  e.label=({rock:'岩石隕石',ice:'冰晶隕石',large:'大型隕石，需兩次命中',ore:'發光礦石',fragment:'隕石碎塊',drone:'偵察無人機，一次命中',droneShield:'護盾無人機，兩次命中',droneAce:'重裝無人機，三次命中'})[type];
  if(isDrone){e.drone=createDrone(type);e.volley=0;e.nextFireAt=droneFireAt(type);e.charging=false;emit('enemy-spawn',{targetId:e.id,targetType:type});e.mesh=e.drone.root;e.body=e.drone.body;}
  else{e.mesh=new THREE.Group();const material=(type==='ice'?ice:rockMaterials[e.id%3]).clone(),texture=getRockMap();if(texture){material.map=texture;material.bumpMap=texture;material.bumpScale=.12;}e.body=new THREE.Mesh(rockGeos[e.id%3],material);e.body.scale.set(1,.83+Math.random()*.25,1);e.mesh.add(e.body);e.mesh.rotation.set(Math.random()*3,Math.random()*3,Math.random()*3);}
  e.baseEmission=e.body.material.emissive.clone();e.baseIntensity=e.body.material.emissiveIntensity;e.mesh.scale.setScalar(e.radius);
  if(type==='ore')for(let i=0;i<5;i++){const crystal=new THREE.Mesh(crystalGeo,oreMaterial);const a=i*2.399;crystal.position.set(Math.cos(a)*.8,Math.sin(a)*.8,.55);crystal.scale.set(.65,1.2,.7);crystal.rotation.set(a,a*.4,a);e.mesh.add(crystal);}
  group.add(e.mesh);e.button=buttonFor(e);entities.push(e);return e;
 }
 function path(e){
  const t=Math.min(1,e.age/e.duration),approach=e.drone?1-t*.45:1-t;ndc.copy(e.anchor);ndc.x+=Math.sin(e.age*(e.drone?1.1:.55)+e.id)*(e.drone?.13:.025);if(e.drone)ndc.y+=Math.sin(e.age*.8+e.id)*.065;
  ray.setFromCamera(ndc,camera);const near=(-6.7-camera.position.z)/ray.ray.direction.z;e.distance=near+approach*e.range;
  // Keep the whole approaching body reachable at the edges and clear of HUDs.
  const viewDepth=e.distance*Math.max(.2,ray.ray.direction.dot(camera.getWorldDirection(point)));
  const radius=e.radius*(e.drone?1.85:1.15)/(Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*viewDepth),marginX=Math.max(28/innerWidth*2,radius/camera.aspect+.035),marginY=Math.max(28/innerHeight*2,radius+.025);
  ndc.x=THREE.MathUtils.clamp(ndc.x,-1+marginX,1-marginX);ndc.y=THREE.MathUtils.clamp(ndc.y,-.2+marginY,1-190/innerHeight-marginY);
  ray.setFromCamera(ndc,camera);e.distance=(-6.7-camera.position.z)/ray.ray.direction.z+approach*e.range;e.mesh.position.copy(ray.ray.at(e.distance,new THREE.Vector3()));
  return t;
 }
 function screen(e){const depth=Math.max(1,-point.copy(e.mesh.position).applyMatrix4(camera.matrixWorldInverse).z),p=point.copy(e.mesh.position).project(camera);e.sx=(p.x*.5+.5)*innerWidth;e.sy=(-p.y*.5+.5)*innerHeight;e.px=e.radius*(e.drone?1.6:1.1)*innerHeight/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*depth);const r=Math.max(e.drone?30:23,e.px*1.1);e.button.style.left=e.sx-r+'px';e.button.style.top=e.sy-r+'px';e.button.style.width=e.button.style.height=r*2+'px';e.button.classList.toggle('near',!e.drone&&e.age/e.duration>.78);e.button.classList.toggle('ore',e.type==='ore');e.button.classList.toggle('charging',!!e.charging);}
 function effect(mesh,life,velocity=null,owned=false){group.add(mesh);effects.push({mesh,life,max:life,velocity,owned});}
 function explosion(e,impact=false){
  const color=e.drone?'#a4bfe8':e.type==='ice'?'#a2e8ff':e.type==='ore'?'#ffd690':'#c7b9a1';
  for(let i=0;i<(e.type==='ice'?16:12);i++){const shard=new THREE.Mesh(rockGeos[i%3],new THREE.MeshStandardMaterial({color,roughness:.6,metalness:.2,emissive:color,emissiveIntensity:.1}));shard.position.copy(e.mesh.position);shard.scale.setScalar((.08+Math.random()*.2)*e.radius);effect(shard,.7+Math.random()*.4,new THREE.Vector3((Math.random()-.5)*7,(Math.random()-.5)*7,(Math.random()-.5)*7));}
  const ring=new THREE.Mesh(new THREE.RingGeometry(.7,1,40),new THREE.MeshBasicMaterial({color:impact?'#88dbff':color,transparent:true,opacity:.7,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));ring.position.copy(e.mesh.position);ring.lookAt(camera.position);effect(ring,.45,null,true);ring.userData.ring=true;
 }
 function remove(e){const i=entities.indexOf(e);if(i<0)return;entities.splice(i,1);group.remove(e.mesh);e.body.material.dispose();e.drone?.dispose();e.button.remove();if(firing?.id===e.id)firing.id=null;}
 function floatingScore(e){const n=document.createElement('span');n.className='meteor-pickup'+(e.type==='ore'?' ore':'');n.style.left=e.sx+'px';n.style.top=e.sy+'px';n.textContent=e.type==='ore'?'◆ +2':'+1';feedback.append(n);setTimeout(()=>n.remove(),900);}
 function beam(end){
  for(const start of weapons.fire(end)){const direction=end.clone().sub(start);const mesh=new THREE.Mesh(beamGeo,new THREE.MeshBasicMaterial({color:'#9af0ff',transparent:true,opacity:.85,depthWrite:false,blending:THREE.AdditiveBlending}));mesh.position.copy(start).add(end).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.clone().normalize());mesh.scale.set(.025,direction.length(),.025);effect(mesh,.12);}
 }
 function enemyVolley(e){
  e.volley++;emit('enemy-fire',{targetId:e.id,targetType:e.type,volley:e.volley});
  const end=camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(8).add(camera.position);end.y-=.25;
  hostileLasers.fire(e.drone.getMuzzles(),end);e.nextFireAt=e.volley<DRONE_MAX_VOLLEYS?droneFireAt(e.type,e.volley+1):Infinity;
 }
 function fire(e=null,position=null){
  if(phase!=='playing'||overheated||elapsed-lastFire<SHOT_INTERVAL)return;
  lastFire=elapsed;heat=Math.min(100,heat+HEAT_PER_SHOT);if(heat>=100)overheated=true;
  emit('shot');
  let target=e&&entities.includes(e)?e:null;
  if(!target&&position){let closest=Infinity;for(const item of entities){const d=Math.hypot(position.x-item.sx,position.y-item.sy);if(d<Math.max(25,item.px*1.2)&&d<closest){target=item;closest=d;}}}
  let end;if(target)end=target.mesh.position.clone();else{const p=position||{x:innerWidth*.5,y:innerHeight*.35};ndc.set(p.x/innerWidth*2-1,1-p.y/innerHeight*2);ray.setFromCamera(ndc,camera);end=ray.ray.at(100,new THREE.Vector3());}
  if(target)aimPosition={x:target.sx,y:target.sy};beam(end);
  if(!target)return;
  target.hp--;target.flash=.16;target.mesh.scale.setScalar(target.radius*1.055);
  if(target.hp>0){target.button.setAttribute('aria-label',target.drone?'受損無人機，還需 '+target.hp+' 次命中':'受損大型隕石，再命中一次');if(target.drone){target.drone.shield.visible=target.hp>1;[...target.button.querySelectorAll('.drone-hp em')].forEach((pip,i)=>pip.classList.toggle('lost',i>=target.hp));}return;}
  emit('destroy',{targetId:target.id,targetType:target.type});explosion(target);floatingScore(target);
  if(target.type==='large')for(const side of [-1,1])spawn('fragment',THREE.MathUtils.clamp(target.anchor.x+side*.12,-.83,.83),target.anchor.y+side*.04,0,Math.max(3,target.duration-target.age),Math.max(12,target.distance-14));
  remove(target);
 }
 function pointerDown(event){if(phase!=='playing'||round?.mode==='salvage')return false;aimPosition={x:event.clientX,y:event.clientY};firing={x:event.clientX,y:event.clientY,id:null,pointerId:event.pointerId};canvas.setPointerCapture(event.pointerId);fire(null,firing);return true;}
 function pointerMove(event){if(phase==='playing')aimPosition={x:event.clientX,y:event.clientY};if(firing&&event.pointerId===firing.pointerId){firing.x=event.clientX;firing.y=event.clientY;firing.id=null;}}
 targetLayer.addEventListener('pointermove',pointerMove);
 function stopFire(){firing=null;}
 addEventListener('pointerup',stopFire);addEventListener('pointercancel',stopFire);addEventListener('blur',stopFire);
 addEventListener('visibilitychange',()=>{stopFire();if(document.hidden&&phase==='playing')emit('pause');});
 for(const [id,action]of [['meteor-play','start'],['meteor-pause','pause'],['meteor-resume','resume'],['meteor-again','again'],['meteor-leave','leave'],['meteor-guard','guard']])$(id).onclick=()=>emit(action);
 $('mode-meteor').onclick=()=>emit('select',{mode:'meteor'});$('mode-drone').onclick=()=>emit('select',{mode:'drone'});$('meteor-choose').onclick=()=>emit('choose');
 $('mode-salvage').onclick=()=>emit('select',{mode:'salvage'});
 $('meteor-stop').onclick=$('meteor-abort').onclick=()=>{stopFire();emit('abort');};
 root.addEventListener('keydown',e=>{if(e.key==='Escape'&&phase==='playing'){e.preventDefault();emit('pause');}});
 function tick(dt,t){
  if(!round)return;
  if(round.mode==='salvage'){backdrop.position.copy(camera.position);salvageGame.tick(dt);return;}
  weapons.update(phase==='playing'?dt:0);
  if(phase==='playing'){
   elapsed+=dt;const cooled=coolWeapon(heat,overheated,dt,round.cooling);heat=cooled.heat;overheated=cooled.overheated;
   const aim=aimPosition||{x:innerWidth*.5,y:innerHeight*.3},tracked=entities.find(e=>e.id===firing?.id);ndc.set(aim.x/innerWidth*2-1,1-aim.y/innerHeight*2);ray.setFromCamera(ndc,camera);weapons.aim(tracked?tracked.mesh.position:ray.ray.at(90,new THREE.Vector3()));
   if(firing){const e=entities.find(e=>e.id===firing.id);fire(e||null,firing);}
   if(elapsed>=nextSpawn){spawn();nextSpawn=elapsed+spawnInterval(round.mode,round.wave);}
   const texture=getRockMap();if(texture&&texture!==lastTexture){lastTexture=texture;for(const material of [...rockMaterials,ice,...entities.filter(e=>!e.drone).map(e=>e.body.material)]){material.map=texture;material.bumpMap=texture;material.bumpScale=.12;material.needsUpdate=true;}}
   for(const e of [...entities]){
    e.age=Math.max(0,elapsed-e.born);const progress=path(e);if(e.drone){e.mesh.rotation.set(Math.sin(e.age*.8)*.1,-.1+Math.sin(e.age*.6)*.24,reduced?0:Math.sin(e.age*1.1+e.id)*.14);if(e.age>=e.nextFireAt)enemyVolley(e);const warning=Number.isFinite(e.nextFireAt)?Math.max(0,1-(e.nextFireAt-e.age)/DRONE_CHARGE):0;e.charging=warning>0;e.drone.update(e.age,warning);e.button.setAttribute('aria-label',e.charging?'敵機正在蓄能，點選攔截':e.label);e.drone.shield.visible=e.hp>1;}else if(!reduced){e.mesh.rotation.x+=dt*e.rotation.x;e.mesh.rotation.y+=dt*e.rotation.y;}e.flash=Math.max(0,e.flash-dt);e.mesh.scale.setScalar(e.radius*(1+e.flash*.35));if(e.flash>0){e.body.material.emissive.set('#91d9ef');e.body.material.emissiveIntensity=e.flash*7;}else{e.body.material.emissive.copy(e.baseEmission);e.body.material.emissiveIntensity=e.baseIntensity;}screen(e);
    if(progress>=1){if(e.drone)emit('escape',{targetId:e.id,targetType:e.type});else{emit('impact',{targetId:e.id,targetType:e.type});explosion(e,true);hitGlow=.65;shake=round.guardActive?0:.18;}remove(e);}
   }
  }
  hostileLasers.update(phase==='playing'?dt:0);
  const effectDt=phase==='paused'?0:dt;
  for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.life-=effectDt;if(e.life<=0){group.remove(e.mesh);if(e.owned)e.mesh.geometry.dispose();e.mesh.material.dispose();effects.splice(i,1);continue;}if(e.velocity){e.mesh.position.addScaledVector(e.velocity,effectDt);e.mesh.rotation.x+=effectDt*2;}if(e.mesh.userData.ring)e.mesh.scale.setScalar(1+(1-e.life/e.max)*5);e.mesh.material.transparent=true;e.mesh.material.opacity=e.life/e.max;}
  const warning=entities.some(e=>e.charging),incoming=round.incoming>0;$('drone-alert').hidden=round.mode!=='drone'||phase!=='playing'||!warning&&!incoming;$('drone-alert').querySelector('span').textContent=incoming?'雷射來襲':'敵機蓄能';
  hitGlow=Math.max(0,hitGlow-effectDt*1.8);shake=Math.max(0,shake-dt);
  shield.position.copy(camera.position);camera.getWorldDirection(shieldUniforms.forward.value);backdrop.position.copy(camera.position);
  shieldUniforms.time.value=t*.001;shieldUniforms.strength.value=(round.guardActive?.75:0)+hitGlow;shieldUniforms.tint.value.set(round.guardActive?'#8fefff':'#eaa78f');shield.visible=shieldUniforms.strength.value>.01;
  $('meteor-vignette').style.opacity=round.guardActive?0:hitGlow*.55;
  if(elapsed-lastUI>.08||lastUI<0){lastUI=elapsed;$('meteor-heat-fill').style.width=heat+'%';$('meteor-heat-label').textContent=overheated?'散熱中':'雷射溫度';document.body.classList.toggle('meteor-hot',overheated);}
 }
 return{sync,tick,pointerDown,pointerMove,stopFire,pause:()=>emit('pause'),get active(){return !!round;},get playing(){return phase==='playing';},get shake(){return reduced?0:shake;}};
}
