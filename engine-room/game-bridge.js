/* The original game owns engine state, timers and repairs. This room is a 3D control surface. */
(()=>{
 'use strict';
 if(typeof window.switchTab!=='function')return;
 const $=id=>document.getElementById(id),style=document.createElement('style');
 style.textContent='.engine-room-layer[hidden]{display:none!important}.engine-room-layer{position:fixed;inset:0;z-index:8500;background:#050b13}.engine-room-layer iframe{display:block;width:100%;height:100%;border:0}.engine-room-active #emergency-stop{display:none!important}';document.head.append(style);
 const layer=document.createElement('section');layer.className='engine-room-layer';layer.hidden=true;layer.setAttribute('aria-label','立體量子引擎艙');
 const frame=document.createElement('iframe');frame.title='阿屁號 3D 量子引擎艙';frame.allow='fullscreen';layer.append(frame);document.body.append(layer);
 const covered=[$('view-engine'),document.querySelector('header'),$('main-nav'),document.querySelector('.cockpit-entry')].filter(Boolean);
 let last='',resumeAfterShip=false,previousShip=false;
 const booted=()=>getComputedStyle($('boot-screen')).display==='none';
 function open(){if(!booted()||!layer.hidden||window.shipSystemsOverlayOpen)return;layer.hidden=false;window.quantumEngineRoomOpen=true;document.body.classList.add('engine-room-active');for(const n of covered)n.inert=true;last='';frame.src='engine-room/index.html?embed=1';frame.focus();}
 function close(){if(layer.hidden)return;layer.hidden=true;window.quantumEngineRoomOpen=false;document.body.classList.remove('engine-room-active');for(const n of covered)n.inert=false;frame.src='about:blank';}
 const switchTab=window.switchTab;
 window.switchTab=function(tab,...args){
  // Release this WebGL context before the cockpit or map creates its next one.
  if(tab!=='engine'&&(!window.isSystemLocked?.()||args[0]===true)){close();resumeAfterShip=false;}
  const result=switchTab.call(this,tab,...args);
  if(tab==='engine'&&$('view-engine')?.classList.contains('active'))open();
  else if(!$('view-engine')?.classList.contains('active'))close();
  return result;
 };
 window.openQuantumEngineRoom=()=>{if(window.isSystemLocked?.()&&!window.engineFailed)return;window.switchTab('engine',true);};
 const shipOpen=window.openShipSystemsOverlay;
 if(shipOpen)window.openShipSystemsOverlay=function(...args){if(!layer.hidden){resumeAfterShip=true;close();}return shipOpen.apply(this,args);};
 const logout=window.logoutSystem;
 window.logoutSystem=function(...args){const result=logout?.apply(this,args);if(!booted()){close();resumeAfterShip=false;}return result;};
 function state(){
  const failed=!!window.engineFailed,telemetry=window.engineTelemetry?.()||{temp:3450,quant:99.8};
  const numeric=id=>Number(String($(id)?.textContent||'').replace(/[^0-9.]/g,''));
  const practice=failed&&!!window.enginePractice;
  return{failed,practice,paused:!!window.isGamePaused?.(),outputMode:window.getEngineOutputMode?.()||'standard',phase:failed?Number(window.enginePhase)||1:0,time:practice?null:failed?Math.max(0,Number(window.engineTimeLeft)||0):0,
   coolant:Number($('slider-coolant')?.value)||0,plasma:Number($('slider-plasma')?.value)||0,
   coolantRange:failed?[window.targetCoolantMin,window.targetCoolantMax]:null,plasmaRange:failed?[window.targetPlasmaMin,window.targetPlasmaMax]:null,
   sub:failed&&window.enginePhase===2?window.targetSubControl:null,
   reboot:failed&&window.enginePhase===3?window.engineSequence?.[window.engineStep]:null,
   rebootStep:failed?Number(window.engineStep)||0:0,
   temp:failed?numeric('data-temp')||8500:Math.round(telemetry.temp),quant:failed?numeric('data-quant')||50:Math.round(telemetry.quant*10)/10,
   economy:$('engine-economy')?.getAttribute('aria-pressed')==='true',radiator:$('engine-radiator')?.getAttribute('aria-pressed')==='true',
   locked:!!window.isSystemLocked?.(),fuel:Number(window.getShipFuel?.())||0,shield:Number(window.shieldLevel)||0};
 }
 function send(force=false){if(layer.hidden||!frame.contentWindow)return;const snapshot=state(),encoded=JSON.stringify(snapshot);if(!force&&encoded===last)return;last=encoded;frame.contentWindow.postMessage({type:'quantum-engine-state',state:snapshot},location.origin);}
 function notice(text){frame.contentWindow?.postMessage({type:'quantum-engine-notice',text},location.origin);}
 function nativeClick(id){const b=$(id);if(b&&!b.disabled)b.click();}
 const actions={
  back(){if(window.engineFailed&&window.enginePractice)window.emergencyStop?.();window.switchTab('control',true);window.openImmersiveCockpit?.();},
  drill(){if(!window.isSystemLocked?.())window.manualEngineFailure?.();},
  mode(data){if(window.setEngineOutputMode?.(data.id))notice($('engine-extra-status')?.textContent||'');},
  emergency(){if(window.engineFailed)window.emergencyStop?.();},
  coolant(data){setLever('coolant',data.value);},plasma(data){setLever('plasma',data.value);},
  sub(data){if(['cool','mag','shd'].includes(data.id))window.handleSubControl?.(data.id);},
  reboot(data){if(!['r','y','b'].includes(data.id)||!window.engineFailed||window.enginePhase!==3)return;const b=$('ebtn-'+data.id);if(b&&!b.disabled)b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true}));},
  economy(){nativeClick('engine-economy');notice($('engine-extra-status')?.textContent||'');},
  radiator(){nativeClick('engine-radiator');notice($('engine-extra-status')?.textContent||'');},
  shield(){nativeClick('engine-shield');notice($('engine-extra-status')?.textContent||'');},
  ship(){window.openShipSystemsOverlay?.();}
 };
 function setLever(id,value){if(typeof value!=='number'||!Number.isFinite(value))return;const input=$('slider-'+id);if(!input)return;input.value=Math.round(Math.max(0,Math.min(100,value)));window.checkEngineStatus?.();}
 addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==frame.contentWindow||layer.hidden)return;
  const data=event.data;if(data?.type==='quantum-engine-ready'){send(true);return;}
  if(data?.type!=='quantum-engine-action'||typeof data.action!=='string'||!Object.hasOwn(actions,data.action))return;
  if(window.isGamePaused?.()&&!['back','emergency'].includes(data.action))return;
  if(window.isSystemLocked?.()&&!window.engineFailed&&!['back','ship'].includes(data.action))return;
  if(window.engineFailed&&['mode','economy','radiator','shield','drill'].includes(data.action))return;
  window.initAudio?.();if(!['coolant','plasma'].includes(data.action))window.playTone?.(560,'sine',.04);
  actions[data.action](data);send(true);
 });
 frame.addEventListener('load',()=>send(true));
 const interval=setInterval(()=>{const ship=!!window.shipSystemsOverlayOpen;if(previousShip&&!ship&&resumeAfterShip){resumeAfterShip=false;if($('view-engine')?.classList.contains('active'))open();}previousShip=ship;send();},150);
 // Preserve state synchronisation when Safari restores a cached page.
 addEventListener('pagehide',event=>{if(!event.persisted)clearInterval(interval);});
})();
