/* Save durable adventure progress separately from the existing fuel, wallet,
   achievements and ship-repair stores. Combat, alarms and timers never resume. */
(()=>{
 'use strict';
 const KEY='explorer-progress-v1',VERSION=1;
 if(window.ExplorerProgress||typeof window.getExplorationProgress!=='function'||typeof window.restoreExplorationMission!=='function')return;
 const el=id=>document.getElementById(id);
 const objects=()=>[...(window.PLANETS||[]),window.MOON_DATA,window.ASTEROID_BELT_DATA,window.OUTPOST_DATA].filter(Boolean);
 const planet=id=>objects().find(p=>p.id===id);
 const finite=(value,fallback)=>value!==null&&value!==''&&Number.isFinite(Number(value))?Number(value):fallback;
 const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
 const definitions={shield:{base:50,stat:'shieldMax',start:100,step:50},cool:{base:30,stat:'coolingRate',start:1,step:.5},scan:{base:50,stat:'scanSpeed',start:1,step:.5}};
 let restoring=false,depth=0,lastEncoded='',unsupportedVersion=false,storageFailed=false;

 function normalize(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
  const version=finite(raw.version??raw.schemaVersion,0);
  if(version>VERSION){unsupportedVersion=true;return null;}
  const levels={};
  for(const [key,def]of Object.entries(definitions)){
   const oldStat=finite(raw.upgrades?.[def.stat],def.start);
   const inferred=Math.round((oldStat-def.start)/def.step);
   const saved=raw.shopLevels?.[key]??raw.shop?.[key]?.currentLevel??raw.levels?.[key];
   levels[key]=clamp(Math.floor(finite(saved,inferred)),0,window.shopItems?.[key]?.maxLevel??(key==='scan'?3:5));
  }
  const nav=raw.navigation&&typeof raw.navigation==='object'?raw.navigation:raw;
  const locationId=planet(nav.locationId??nav.arrivedId)?.id||'earth';
  const m=nav.mission,missionPlanet=planet(m?.planetId??m?.id);
  const task=typeof m?.task==='string'?m.task.trim().slice(0,180):'';
  const mission=missionPlanet&&task?{planetId:missionPlanet.id,planetName:missionPlanet.name,task,reached:m.reached===true}:null;
  if(mission&&['salvage','meteor','survey'].includes(m.activity)){
   const defaultGoal=m.activity==='salvage'?3:m.activity==='meteor'?5:1;
   mission.activity=m.activity;mission.goal=clamp(Math.floor(finite(m.goal,defaultGoal)),1,10000);
   mission.progress=clamp(Math.floor(finite(m.progress,0)),0,mission.goal);
  }
  const shieldMax=100+levels.shield*50;
  const output=raw.engine?.outputMode??raw.engineOutputMode??'standard';
  return {version:VERSION,navigation:{locationId,targetId:planet(nav.targetId)?.id||null,mission},shopLevels:levels,shield:clamp(finite(raw.shield??raw.shieldLevel,shieldMax),0,shieldMax),engine:{outputMode:Object.hasOwn(window.ExplorerEngineModes||{standard:1,economy:1,boost:1},output)?output:'standard',radiator:raw.engine?.radiator===true}};
 }

 function read(){
  try{return normalize(JSON.parse(localStorage.getItem(KEY)));}
  catch{return null;}
 }

 function snapshot(){
  const nav=window.getExplorationProgress();
  return normalize({version:VERSION,navigation:nav,shopLevels:Object.fromEntries(Object.keys(definitions).map(key=>[key,window.shopItems[key].currentLevel])),shield:window.shieldLevel,engine:{outputMode:window.getEngineOutputMode?.()||'standard',radiator:el('engine-radiator')?.getAttribute('aria-pressed')==='true'}});
 }

 function save(){
  if(restoring||depth||unsupportedVersion)return false;
  const data=snapshot();if(!data)return false;
  const encoded=JSON.stringify(data);if(encoded===lastEncoded)return !storageFailed;
  try{localStorage.setItem(KEY,encoded);lastEncoded=encoded;storageFailed=false;return true;}
  catch{storageFailed=true;return false;}
 }

 function applyLevels(levels){
  for(const [key,def]of Object.entries(definitions)){
   const item=window.shopItems[key],level=levels[key];
   item.currentLevel=level;
   let cost=def.base;for(let i=0;i<level;i++)cost=Math.floor(cost*1.5);
   item.costScrap=key==='shield'?cost:0;item.costCrystal=key==='shield'?0:cost;
   window.upgrades[def.stat]=def.start+def.step*level;
   const display=el('upg-'+key)?.querySelector('.upgrade-cost');
   if(display)display.textContent=(item.costScrap?item.costScrap+' ⚙️ ':'')+(item.costCrystal?item.costCrystal+' 💎':'');
  }
 }

 function restore(data){
  restoring=true;window.restoringGameProgress=true;
  try{
   applyLevels(data.shopLevels);
   // Use the native arrival hooks for both the 3D view and the private fuel
   // distance origin. Their station refill/reward effects are guarded while
   // restoring; reopening a save must not grant a free repair or refill.
   const location=planet(data.navigation.locationId);
   if(location)window.arrivePlanet(location);
   window.restoreExplorationMission(data.navigation.mission);
   if(location)window.renderMissionArrival?.(location);
   const target=planet(data.navigation.targetId);
   window.currentTargetId=target?.id||null;
   window.selectedPlanet=target||planet(data.navigation.mission?.planetId)||location||null;
   if(el('target-display'))el('target-display').textContent=target?.name||'--';
   const jump=el('btn-jump');if(jump){jump.disabled=!target;jump.textContent=target?'🚀 啟動躍遷 ('+target.name+')':'🚀 啟動躍遷';}
   window.shieldLevel=data.shield;window.updateShield?.(0);
   window.setEngineOutputMode?.(data.engine.outputMode);
   const radiator=el('engine-radiator');
   if(radiator&&(radiator.getAttribute('aria-pressed')==='true')!==data.engine.radiator)radiator.click();
   window.refreshShopUI?.();window.refreshShipFuel?.();window.restoreHUDMission?.();
   window.switchTab?.('control',true);window.refreshCockpitState?.();
  }finally{window.restoringGameProgress=false;restoring=false;}
 }

 // Nested actions (for example buying an upgrade spends resources before
 // increasing its level) commit once, after the complete native action.
 for(const name of ['assignMission','arrivePlanet','buyUpgrade','updateShield','updateResources','setEngineOutputMode','lockTargetFromMap','logoutSystem']){
  const original=window[name];if(typeof original!=='function')continue;
  window[name]=function(...args){depth++;try{return original.apply(this,args);}finally{depth--;if(!depth)save();}};
 }
 for(const id of ['mission-confirm-deck','mission-confirm-arrival','engine-radiator']){
  const button=el(id);if(button)button.addEventListener('click',()=>save());
 }
 addEventListener('ship-mission-completed',()=>save());
 addEventListener('ship-engine-repaired',()=>save());
 addEventListener('pagehide',()=>save());
 document.addEventListener('visibilitychange',()=>{if(document.hidden)save();});
 window.ExplorerProgress=Object.freeze({save,getState:snapshot,get storageFailed(){return storageFailed;}});
 window.saveGameProgress=save;
 const stored=read();if(stored)restore(stored);save();
})();
