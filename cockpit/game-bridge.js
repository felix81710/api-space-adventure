/* The game remains the owner of missions, resources and repairs. The cockpit
   renders that state and sends only a small allowlist of control actions. */
(()=>{
 'use strict';
 if(typeof window.switchTab!=='function')return;
 const $=id=>document.getElementById(id);
 let preferCockpit=new URLSearchParams(location.search).get('view')!=='dashboard';
 let priorShipOpen=false,resumeAfterShip=false,navigating=false,arrivingInCockpit=false,lastState='';
 const style=document.createElement('style');
 style.textContent=`
 .cockpit-layer[hidden]{display:none!important}.cockpit-layer{position:fixed;inset:0;z-index:8000;background:#080e15;overflow:hidden}.cockpit-layer iframe{width:100%;height:100%;border:0;display:block;background:#080e15}.cockpit-active:after{display:none!important}.cockpit-active #task-overlay{position:fixed!important;z-index:9600!important}.cockpit-active.cockpit-warp #task-overlay{visibility:hidden!important}.cockpit-entry{position:fixed;right:max(18px,env(safe-area-inset-right));bottom:calc(86px + env(safe-area-inset-bottom));z-index:600;min-height:44px;padding:10px 17px;border:1px solid #80b5c9;border-radius:7px;color:#d9edf3;background:#122d3eee;font:15px "Microsoft JhengHei",sans-serif;cursor:pointer;box-shadow:0 6px 20px #0007}.cockpit-entry:focus-visible{outline:3px solid #d7f4ff;outline-offset:3px}.cockpit-entry[hidden]{display:none!important}@media(max-height:600px){.cockpit-entry{bottom:76px;font-size:13px;padding:8px 13px}}`;
 document.head.append(style);
 const layer=document.createElement('section');layer.className='cockpit-layer';layer.hidden=true;layer.setAttribute('aria-label','沉浸式駕駛艙');
 const frame=document.createElement('iframe');frame.title='阿屁號沉浸式駕駛艙';frame.allow='fullscreen';layer.append(frame);document.body.append(layer);
 const entry=document.createElement('button');entry.className='cockpit-entry';entry.type='button';entry.textContent='⟐ 進入駕駛艙';entry.hidden=true;document.body.append(entry);
 const covered=[$('view-control'),document.querySelector('header'),document.querySelector('#main-nav')].filter(Boolean);
 function isBooted(){const boot=$('boot-screen');return boot&&getComputedStyle(boot).display==='none';}
 function open(){
  if(!isBooted()||window.shipSystemsOverlayOpen||!layer.hidden)return;
  if(window.combatActive&&!window.meteorDefenseActive||document.querySelector('dialog[open]'))return;
  layer.hidden=false;entry.hidden=true;window.cockpitOverlayOpen=true;document.body.classList.add('cockpit-active');
  for(const el of covered)el.inert=true;
  frame.src='cockpit/index.html?embed=1';lastState='';frame.focus();
 }
 function close(){
  if(layer.hidden)return;
  layer.hidden=true;window.cockpitOverlayOpen=false;document.body.classList.remove('cockpit-active','cockpit-warp');
  for(const el of covered)el.inert=false;
  frame.src='about:blank'; // Release the cabin's WebGL context before loading another 3D view.
  entry.hidden=!isBooted();
 }
 window.openImmersiveCockpit=()=>{preferCockpit=true;open();};
 entry.onclick=()=>{
  if(window.isSystemLocked?.()&&!window.engineFailed){window.playAlert?.();return;}
  preferCockpit=true;
  const base=window.switchTab;navigating=true;base('control',true);navigating=false;open();
 };
 const originalSwitch=window.switchTab;
 window.switchTab=function(tab,force=false){
  if(tab==='arrival'&&arrivingInCockpit)return originalSwitch.call(this,'control',true);
  // Keep an automatic engine alarm in the cockpit until the pilot chooses a
  // repair console. The existing countdown and emergency stop remain active.
  if(tab==='engine'&&window.engineFailed&&!layer.hidden&&!navigating){sendState(true);notice('引擎故障 · 點右側引擎面板開始檢修');return;}
  const result=originalSwitch.call(this,tab,force);
  if(!document.getElementById('view-'+tab)?.classList.contains('active'))return result;
  if(tab==='control'&&preferCockpit&&!window.shipSystemsOverlayOpen)open();else if(tab!=='control')close();
  return result;
 };
 // Run every existing arrival hook (fuel, missions, station, damage) while keeping the cabin visible.
 const originalArrival=window.arrivePlanet;
 window.arrivePlanet=function(planet,...args){
  const stay=preferCockpit&&(window.isJumping||!layer.hidden);arrivingInCockpit=stay;
  try{const result=originalArrival.call(this,planet,...args);if(stay){originalSwitch.call(this,'control',true);open();sendState(true);notice('已抵達 '+planet.name);}return result;}
  finally{arrivingInCockpit=false;}
 };
 const originalLogout=window.logoutSystem;
 window.logoutSystem=function(...args){const result=originalLogout?.apply(this,args);if(!isBooted()){close();entry.hidden=true;}return result;};
 const originalShipOpen=window.openShipSystemsOverlay;
 if(originalShipOpen)window.openShipSystemsOverlay=function(...args){if(!layer.hidden){resumeAfterShip=true;close();}return originalShipOpen.apply(this,args);};
 function damage(){try{const d=JSON.parse(localStorage.getItem('explorer-ship-systems-v1'))?.damage;return Array.isArray(d)?d.filter(x=>x&&typeof x.system==='string').map(x=>({system:x.system,part:x.part})):[];}catch{return[];}}
 function readState(){
  const locationName=$('loc-display')?.textContent.trim()||'地球軌道';
  const objects=[...(window.PLANETS||[]),window.MOON_DATA,window.OUTPOST_DATA,window.ASTEROID_BELT_DATA].filter(Boolean);
  const current=objects.find(p=>p.name===locationName||locationName.startsWith(p.name.split(' ')[0]));
  const fuel=$('fuel-meter');
  const rawMission=$('main-mission-text-title')?.textContent.trim()||'等待探索指令';
  const mission=window.getActiveExplorationMission?.();
  const telemetry=window.engineTelemetry?.();
  return {
   location:locationName,planetId:current?.id||'earth',mission:rawMission,missionComplete:!!$('mission-confirm-deck')&&!$('mission-confirm-deck').hidden,
   missionTargetId:mission?.planetId||null,missionTarget:mission?.planetName||null,missionTask:mission?.task||null,
   missionActivity:mission?.activity||null,missionProgress:Number(mission?.progress)||0,missionGoal:Number(mission?.goal)||0,missionReached:!!mission?.reached,
   target:window.currentTargetId?objects.find(p=>p.id===window.currentTargetId)?.name||'航向已鎖定':'尚未鎖定',targetId:window.currentTargetId||null,
   fuel:Number(window.getShipFuel?.())||0,fuelMax:Number(fuel?.max)||100,travelCost:Number(window.getShipTravelCost?.())||0,
   shield:Math.round(Number(window.shieldLevel)||0),shieldMax:Number(window.upgrades?.shieldMax)||100,scrap:Number(window.resources?.scrap)||0,crystal:Number(window.resources?.crystal)||0,threat:$('threat-display')?.textContent||'安全',
   damage:damage(),jumpReady:!!window.currentTargetId&&!window.isJumping&&!window.isSystemLocked?.(),engineFailed:!!window.engineFailed,locked:!!window.isSystemLocked?.(),isJumping:!!window.isJumping,
   economy:$('engine-economy')?.getAttribute('aria-pressed')==='true',radiator:$('engine-radiator')?.getAttribute('aria-pressed')==='true',
   muted:$('sound-toggle')?.getAttribute('aria-pressed')==='true',temp:!window.engineFailed&&telemetry?Math.round(telemetry.temp).toLocaleString()+' K':$('data-temp')?.textContent||'3,450 K',quant:!window.engineFailed&&telemetry?telemetry.quant.toFixed(1)+' %':$('data-quant')?.textContent||'99.8 %',meteor:window.getMeteorDefenseState?.()||null
  };
 }
 function sendState(force=false){
  if(layer.hidden||!frame.contentWindow)return;
  const snapshot=readState(),encoded=JSON.stringify(snapshot);
  document.body.classList.toggle('cockpit-warp',snapshot.isJumping&&!!$('hyperspace-container'));
  if(!force&&encoded===lastState)return;lastState=encoded;
  frame.contentWindow.postMessage({type:'cockpit-state',state:snapshot},location.origin);
 }
 function notice(text){if(!layer.hidden)frame.contentWindow?.postMessage({type:'cockpit-notice',text},location.origin);}
 window.refreshCockpitState=()=>sendState(true);
 function nativeClick(id){const el=$(id);if(el&&!el.disabled)el.click();}
 function navigate(tab){navigating=true;window.switchTab(tab);navigating=false;}
 const actions={
  dashboard(){preferCockpit=false;close();$('view-control')?.scrollTo({top:0});},
  mission(){if(window.getActiveExplorationMission?.()){window.startExplorationActivity?.();sendState(true);return;}window.assignMission?.();sendState(true);const snapshot=readState();notice((snapshot.missionTarget||snapshot.target)+' · 任務已接收');},
  missionPlay(){window.startExplorationActivity?.();sendState(true);},
  aux(){/* Local auxiliary switches provide tactile feedback without changing flight systems. */},
  complete(){nativeClick('mission-confirm-deck');sendState(true);notice('任務完成 · 獎勵已收到');},
  station(){if(readState().planetId==='outpost')navigate('arrival');},
  map(){navigate('map');},scan(){window.executeScan?.();},
  jump(){
   if(!window.currentTargetId){notice('請先接收任務，或從星圖鎖定目的地');return;}
   // Let the native departure flow explain insufficient fuel instead of swallowing the tap.
   window.executeJump?.();sendState(true);
   if(!window.isJumping){const note=$('fuel-status')?.textContent||'燃料不足，請先補給';notice(note);}
  },
  ship(){window.openShipSystemsOverlay?.();},engine(){navigate('engine');},weapons(){window.openShootingGames?.();},meteors(){window.openShootingGames?.();},
  fuel(){nativeClick('collect-open');},economy(){nativeClick('engine-economy');notice($('engine-extra-status')?.textContent||'推進模式已更新');},
  radiator(){nativeClick('engine-radiator');notice($('engine-extra-status')?.textContent||'散熱狀態已更新');},
  shield(){nativeClick('engine-shield');notice($('engine-extra-status')?.textContent||'防護力場狀態已更新');},sound(){nativeClick('sound-toggle');}
 };
 addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==frame.contentWindow||layer.hidden)return;
  if(event.data?.type==='cockpit-meteor'){window.handleCockpitMeteorAction?.(event.data);return;}
  if(event.data?.type==='cockpit-ready'){window.onMeteorCockpitReady?.();sendState(true);return;}
  if(event.data?.type!=='cockpit-action')return;
  const action=event.data.action;if(typeof action!=='string'||!Object.hasOwn(actions,action))return;
  if(window.isGamePaused?.()&&!['sound','dashboard'].includes(action))return;
  if(window.meteorDefenseActive&&action!=='sound')return;
  if(window.isSystemLocked?.()&&!['ship','engine','sound','dashboard'].includes(action)){notice('目前有警報或任務進行中，請先完成處理');return;}
  window.initAudio?.();window.playTone?.(action==='jump'?180:620,'sine',.045,.04);
  actions[action]();sendState(true);
 });
 frame.addEventListener('load',()=>sendState(true));
 const interval=setInterval(()=>{
  if(!isBooted()){entry.hidden=true;return;}
  const shipOpen=!!window.shipSystemsOverlayOpen;
  if(priorShipOpen&&!shipOpen&&resumeAfterShip){resumeAfterShip=false;if(preferCockpit&&$('view-control')?.classList.contains('active'))open();}
  priorShipOpen=shipOpen;
  if(!layer.hidden)sendState();else entry.hidden=shipOpen;
 },500);
 // Safari may keep this page alive in its back/forward cache; updates must resume with it.
 addEventListener('pagehide',event=>{if(!event.persisted)clearInterval(interval);});
 const start=()=>{if(isBooted()&&$('view-control')?.classList.contains('active')&&preferCockpit)open();};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
