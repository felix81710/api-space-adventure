// Ship inspection. In the game, damage state is supplied by the parent page.
const names={engine:'量子引擎',weapons:'武器系統',radar:'雷達系統',fuel:'油箱',radiator:'散熱板'};
const parts={engine:['housings','nozzles','cores'],weapons:['mounts','turrets','barrels'],radar:['pedestal','antennae','sensors'],fuel:['tanks','pipes','covers'],radiator:['frames','cells','connectors']};
const partNames={housings:'引擎外殼',nozzles:'噴口',cores:'能量核心',mounts:'武器固定座',turrets:'砲塔',barrels:'砲管',pedestal:'雷達底座',antennae:'天線',sensors:'探測頭',tanks:'燃料槽',pipes:'輸送管',covers:'維修蓋',frames:'翼架',cells:'散熱格',connectors:'連接件'};
const anchors={engine:[-4.85,.17,0],weapons:[1.45,.6,-1.2],radar:[-1.7,1.75,0],fuel:[-2.25,-.5,-1.1],radiator:[-1.5,.18,-3.0]};
const offsets={
  engine:{housings:[-.22,.06,0],nozzles:[-.95,.02,0],cores:[-1.65,.10,0]},
  weapons:{mounts:[0,0,0],turrets:[0,.5,0],barrels:[1.05,.72,0]},
  radar:{pedestal:[0,0,0],antennae:[0,.55,0],sensors:[0,1.05,0]},
  fuel:{tanks:[0,0,0],pipes:[0,-.53,0],covers:[0,-1.05,0]},
  radiator:{frames:[0,0,0],cells:[0,.48,0],connectors:[0,.97,0]}
};
const order=Object.keys(names);

export function initSystems({THREE,scene,camera,canvas,controls,model,onCockpit,onRepairRequest}){
  const hud=document.getElementById('hud'),icon=document.getElementById('hud-icon');
  const title=document.getElementById('hud-title'),step=document.getElementById('hud-step');
  const nodes=Object.fromEntries(order.map(system=>[system,{}]));
  const cockpitMeshes=[];
  model.traverse(object=>{
    if(object.isMesh&&object.material?.name==='Layered cobalt canopy')cockpitMeshes.push(object);
    const system=object.userData?.system,part=object.userData?.part;
    if(!nodes[system]||!parts[system].includes(part))return;
    if(object.parent?.userData?.system===system&&object.parent?.userData?.part===part)return;
    (nodes[system][part]??=[]).push(object);
    object.userData.rest=object.position.clone();
    object.userData.target=object.position.clone();
  });
  let damage=[],selected=null,selectedPart=null,exploded=false,flashUntil=0,pendingRepair=null;
  const previousDamage={fault:null,battle:null};
  let focusTransition=null,pointerDown=null,scraps=[];
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  const hitboxes=order.map(system=>{
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(system==='radiator'?.7:.55,10,8),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));
    mesh.position.set(...anchors[system]);mesh.userData.system=system;scene.add(mesh);return mesh;
  });
  const damageFor=system=>damage.filter(item=>item.system===system);
  const damagedPart=(system,part)=>damage.some(item=>item.system===system&&item.part===part);
  function showHud(heading,detail='',mode=''){
    title.textContent=heading;step.textContent=detail;
    hud.className=mode;icon.textContent=mode==='alert'?'⚠':mode==='repaired'?'✓':'⌖';
  }
  function refreshVisual(){
    for(const system of order)for(const [part,objects] of Object.entries(nodes[system])){
      const damaged=damagedPart(system,part);
      const selectedObject=selected===system&&selectedPart===part;
      const tone=damaged?'#ff422f':selectedObject?(performance.now()<flashUntil?'#24ba71':'#27a4bd'):selected===system?'#16475a':'#000000';
      const color=new THREE.Color(tone);
      for(const object of objects)object.traverse(mesh=>{
        if(!mesh.isMesh)return;
        for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material]){
          if(!material.emissive)continue;
          if(!material.userData.baseEmission)material.userData.baseEmission=material.emissive.clone();
          if(!material.userData.baseColor)material.userData.baseColor=material.color.clone();
          material.emissive.copy(material.userData.baseEmission).add(color);
          material.color.copy(material.userData.baseColor);
          if(damaged)material.color.lerp(new THREE.Color('#e94a39'),.53);
          else if(selectedObject)material.color.lerp(new THREE.Color('#6ccfe2'),.22);
        }
      });
    }
  }
  function setExploded(system,value){
    exploded=value;
    for(const [part,objects] of Object.entries(nodes[system])){
      const offset=new THREE.Vector3(...offsets[system][part]);
      for(const object of objects)object.userData.target.copy(object.userData.rest).add(value?offset:new THREE.Vector3());
    }
  }
  function collapseAll(){
    for(const group of Object.values(nodes))for(const objects of Object.values(group))for(const object of objects)object.userData.target.copy(object.userData.rest);
    exploded=false;
  }
  function focusOn(system){
    const point=new THREE.Vector3(...anchors[system]);
    const pending=damageFor(system),broken=pending[pending.length-1];
    if(broken)point.addScaledVector(new THREE.Vector3(...offsets[system][broken.part]),.45);
    const direction=camera.position.clone().sub(controls.target).normalize();
    const distance=(system==='radiator'?13:11)*Math.max(1,1.2/camera.aspect);
    focusTransition={start:performance.now(),fromCamera:camera.position.clone(),fromTarget:controls.target.clone(),toCamera:point.clone().addScaledVector(direction,distance),toTarget:point};
    controls.autoRotate=false;document.getElementById('spin').setAttribute('aria-pressed','false');
  }
  function select(system,part){
    if(!names[system])return;
    if(selected!==system){collapseAll();selected=system;selectedPart=part||null;setExploded(system,true);focusOn(system);}
    else selectedPart=part||null;
    refreshVisual();
    const pending=damageFor(system);
    if(pending.length){
      const target=pending[pending.length-1].part;
      showHud(`${names[system]} · ${partNames[target]}`,'再點此部位更換','alert');
    }else showHud(part?partNames[part]:names[system],'已拆解 · 點選零件查看');
  }
  function makeScrap(system,part){
    const offset=new THREE.Vector3(...offsets[system][part]);
    if(offset.lengthSq()<.08)offset.set(0,.9,0);
    for(const original of nodes[system][part]||[]){
      const copy=original.clone(true);
      copy.userData.nonInteractive=true;
      copy.position.copy(original.position);
      copy.traverse(mesh=>{
        if(!mesh.isMesh)return;
        mesh.material=Array.isArray(mesh.material)?mesh.material.map(material=>material.clone()):mesh.material.clone();
        for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material]){
          material.transparent=true;material.depthWrite=false;material.opacity=Math.min(.92,material.opacity);
          if(material.emissive)material.emissive.set('#d45730');
        }
      });
      original.parent.add(copy);
      scraps.push({object:copy,from:copy.position.clone(),to:copy.position.clone().addScaledVector(offset,1.8),start:performance.now()});
    }
  }
  function finishRepair(system,part){
    makeScrap(system,part);
    setExploded(system,false);
    selectedPart=part;flashUntil=performance.now()+1200;
    refreshVisual();
    showHud(`${partNames[part]}已更換`,damage.length?`仍有 ${damage.length} 處受損`:'故障排除','repaired');
    setTimeout(()=>{flashUntil=0;refreshVisual();},1250);
  }
  function replacePart(system,part){
    const item=damage.find(entry=>entry.system===system&&entry.part===part);
    if(!item||pendingRepair)return;
    if(onRepairRequest&&item.id){
      pendingRepair={id:item.id,system,part};
      showHud(`${partNames[part]}`,'正在更換…','alert');
      onRepairRequest(item);
      return;
    }
    damage=damage.filter(entry=>!(entry.system===system&&entry.part===part));
    finishRepair(system,part);
  }
  function setDamage(items){
    const next=[],seen=new Set();
    for(const item of Array.isArray(items)?items:[]){
      if(!item||!parts[item.system]?.includes(item.part))continue;
      const key=`${item.system}:${item.part}`;
      if(seen.has(key))continue;
      seen.add(key);
      next.push({id:typeof item.id==='string'?item.id:null,system:item.system,part:item.part,kind:item.kind});
    }
    damage=next;
    const repaired=pendingRepair&&!next.some(item=>item.id===pendingRepair.id);
    if(repaired){
      const {system,part}=pendingRepair;
      pendingRepair=null;
      finishRepair(system,part);
    }else{
      refreshVisual();
      if(!selected)reset();
      else if(damageFor(selected).length){
        const broken=damageFor(selected).at(-1);
        showHud(`${names[selected]} · ${partNames[broken.part]}`,'再點此部位更換','alert');
      }else showHud(selectedPart?partNames[selectedPart]:names[selected],'已拆解 · 點選零件查看');
    }
  }
  function repairDenied(reason){
    pendingRepair=null;
    showHud('無法更換零件',String(reason).slice(0,80),'alert');
  }
  function pick(clientX,clientY){
    const rect=canvas.getBoundingClientRect();
    pointer.set((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1);
    raycaster.setFromCamera(pointer,camera);
    const intersections=raycaster.intersectObjects(model.children,true);
    const canopyHit=raycaster.intersectObjects(cockpitMeshes,false)[0];
    if(canopyHit&&(!intersections.length||canopyHit.distance<=intersections[0].distance+.25))return {cockpit:true};
    let firstPartHit=null;
    const frontDistance=intersections[0]?.distance??Infinity;
    for(const hit of intersections){
      let object=hit.object,skip=false;
      while(object&&object!==model){
        if(object.userData?.nonInteractive){skip=true;break;}
        const system=object.userData?.system,part=object.userData?.part;
        if(names[system]&&parts[system].includes(part)){
          if(damagedPart(system,part)&&hit.distance<=frontDistance+.28)return {system,part};
          firstPartHit??={system,part};
          break;
        }
        object=object.parent;
      }
      if(skip)continue;
    }
    if(firstPartHit)return firstPartHit;
    // Thin antennae, pipes, and rails need a touch-friendly volume without a visible marker.
    let boxHit=null,bestDistance=Infinity;
    for(const system of order)for(const [part,objects] of Object.entries(nodes[system]))for(const object of objects){
      const bounds=new THREE.Box3().setFromObject(object).expandByScalar(.22);
      const point=raycaster.ray.intersectBox(bounds,new THREE.Vector3());
      if(!point)continue;
      const distance=point.distanceToSquared(camera.position);
      if(distance<bestDistance){bestDistance=distance;boxHit={system,part};}
    }
    if(boxHit)return boxHit;
    const hit=raycaster.intersectObjects(hitboxes)[0];
    if(hit)return {system:hit.object.userData.system,part:null};
    if(intersections.length){
      const point=intersections[0].point;
      const nearest=order.map(system=>({system,distance:point.distanceToSquared(new THREE.Vector3(...anchors[system]))})).sort((a,b)=>a.distance-b.distance)[0];
      return {system:nearest.system,part:null};
    }
    return null;
  }
  canvas.addEventListener('pointerdown',event=>{pointerDown={x:event.clientX,y:event.clientY};});
  canvas.addEventListener('pointerup',event=>{
    const start=pointerDown;pointerDown=null;
    if(!start||Math.hypot(event.clientX-start.x,event.clientY-start.y)>9)return;
    const hit=pick(event.clientX,event.clientY);
    if(!hit){if(selected)reset();return;}
    if(hit.cockpit){onCockpit?.();return;}
    if(selected===hit.system&&exploded&&hit.part&&damagedPart(hit.system,hit.part)){
      replacePart(hit.system,hit.part);
    }
    else select(hit.system,hit.part);
  });
  controls.addEventListener('start',()=>{focusTransition=null;});
  function reset(){collapseAll();selected=null;selectedPart=null;focusTransition=null;refreshVisual();
    if(damage.length)showHud(`⚠ ${damage.length} 處受損`,'點選發紅的部位','alert');
    else showHud('點選船體','查看五大系統 · 點駕駛艙進入面板');
  }
  function addRandomDamage(kind,systems){
    const available=systems.flatMap(system=>parts[system].filter(part=>!damagedPart(system,part)).map(part=>({system,part})));
    if(!available.length){showHud('所有零件都待更換','先點選發紅的部位維修','alert');return;}
    const alternatives=available.filter(item=>`${item.system}:${item.part}`!==previousDamage[kind]);
    const pool=alternatives.length?alternatives:available;
    const item=pool[Math.floor(Math.random()*pool.length)];
    previousDamage[kind]=`${item.system}:${item.part}`;
    damage.push({...item,kind});
    reset();select(item.system,item.part);
  }
  document.getElementById('demo-failure').onclick=()=>addRandomDamage('fault',['engine']);
  document.getElementById('demo-mission').onclick=()=>addRandomDamage('battle',order);
  function frame(time){
    if(focusTransition){
      let progress=Math.min(1,(time-focusTransition.start)/750);progress=progress*progress*(3-2*progress);
      camera.position.lerpVectors(focusTransition.fromCamera,focusTransition.toCamera,progress);
      controls.target.lerpVectors(focusTransition.fromTarget,focusTransition.toTarget,progress);
      if(progress>=1)focusTransition=null;
    }
    for(const group of Object.values(nodes))for(const objects of Object.values(group))for(const object of objects){
      if(object.position.distanceToSquared(object.userData.target)>0.000001)object.position.lerp(object.userData.target,.16);
      else object.position.copy(object.userData.target);
    }
    scraps=scraps.filter(item=>{
      const progress=Math.min(1,(time-item.start)/850),copy=item.object;
      copy.position.lerpVectors(item.from,item.to,progress);
      copy.scale.setScalar(1-.4*progress);
      copy.traverse(mesh=>{if(mesh.isMesh)for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material])material.opacity=Math.max(.01,1-progress);});
      if(progress<1)return true;
      copy.parent.remove(copy);
      copy.traverse(mesh=>{if(mesh.isMesh)for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material])material.dispose();});
      return false;
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  reset();
  return {reset,setDamage,repairDenied};
}
