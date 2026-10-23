/* The flight deck owns ship damage. The standalone model only displays and repairs it. */
(()=>{
  'use strict';
  const KEY='explorer-ship-systems-v1';
  const systems=['engine','weapons','radar','fuel','radiator'];
  const labels={engine:'量子引擎',weapons:'武器系統',radar:'雷達系統',fuel:'油箱',radiator:'散熱板'};
  const parts={engine:['housings','nozzles','cores'],weapons:['mounts','turrets','barrels'],radar:['pedestal','antennae','sensors'],fuel:['tanks','pipes','covers'],radiator:['frames','cells','connectors']};
  const partLabels={housings:'外殼',nozzles:'噴口',cores:'能量核心',mounts:'固定座',turrets:'砲塔',barrels:'砲管',pedestal:'底座',antennae:'天線',sensors:'探測頭',tanks:'油槽',pipes:'輸送管',covers:'維修蓋',frames:'翼架',cells:'散熱格',connectors:'連接件'};
  const ship=document.querySelector('.explorer-ship-art');
  const panel=document.querySelector('.ship-panel');
  const enginePanel=document.getElementById('engine-panel');
  if(!ship||!panel)return;

  function read(){
    try{
      const raw=JSON.parse(localStorage.getItem(KEY))||{};
      const seen=new Set();
      const damage=(Array.isArray(raw.damage)?raw.damage:[]).filter(item=>{
        if(typeof item?.id!=='string'||!parts[item.system]?.includes(item.part)||!['fault','battle'].includes(item.kind)||seen.has(item.id))return false;
        seen.add(item.id);return true;
      });
      return {damage,log:Array.isArray(raw.log)?raw.log:[],last:raw.last&&typeof raw.last==='object'?raw.last:{}};
    }catch{return {damage:[],log:[],last:{}};}
  }
  function write(state){
    state.damage=state.damage.slice(-15);
    state.log=state.log.slice(-30);
    try{localStorage.setItem(KEY,JSON.stringify(state));}catch(error){console.warn('飛船檢修紀錄無法儲存',error);}
    refresh();sendState();
  }
  function pick(options,last){
    const choices=options.filter(item=>item.key!==last);
    const pool=choices.length?choices:options;
    return pool[Math.floor(Math.random()*pool.length)];
  }
  function addFault(system,source){
    const state=read();
    if(state.damage.some(item=>item.system===system&&item.kind==='fault'))return;
    const available=parts[system].filter(part=>!state.damage.some(item=>item.system===system&&item.part===part)).map(part=>({system,part,key:part}));
    if(!available.length)return;
    const chosen=pick(available,state.last['fault_'+system]);
    state.last['fault_'+system]=chosen.part;
    add(state,chosen.system,chosen.part,'fault',source);
  }
  function addBattle(source){
    const state=read();
    const available=systems.flatMap(system=>parts[system].filter(part=>!state.damage.some(item=>item.system===system&&item.part===part)).map(part=>({system,part,key:system+'.'+part})));
    if(!available.length)return;
    const chosen=pick(available,state.last.battle);
    state.last.battle=chosen.key;
    add(state,chosen.system,chosen.part,'battle',source);
  }
  function add(state,system,part,kind,source){
    const at=Date.now();
    state.damage.push({id:`${at}-${Math.random().toString(36).slice(2,8)}`,system,part,kind,source,at});
    state.log.push({system,text:`${source}：${partLabels[part]}${kind==='fault'?'故障':'戰損'}`,at});
    write(state);
  }
  function clearFault(system){
    const state=read(),old=state.damage.length;
    state.damage=state.damage.filter(item=>!(item.system===system&&item.kind==='fault'));
    if(state.damage.length===old)return;
    state.log.push({system,text:`${labels[system]}已完成檢修`,at:Date.now()});
    write(state);
  }

  const style=document.createElement('style');
  style.textContent=`
    .explorer-ship-art{cursor:pointer;transition:filter .25s,transform .25s}
    .explorer-ship-art:hover{filter:drop-shadow(0 14px 22px #37bfe577);transform:scale(1.018)}
    .explorer-ship-art:focus-visible{outline:2px solid #91ddf5;outline-offset:-3px;border-radius:12px}
    .ship-systems-launch{position:absolute;left:18px;bottom:15px;z-index:4;min-height:44px;padding:8px 12px;background:#12344b;border:1px solid #70bfd2;border-radius:8px;color:#e1f6fa;font:inherit;cursor:pointer}
    .ship-systems-engine-launch{position:relative;left:auto;bottom:auto;display:block;margin:14px 0;width:100%}
    .ship-systems-launch:focus-visible{outline:3px solid #b5eaff}.ship-systems-launch.damaged{border-color:#ff9a80;color:#ffcfb7;box-shadow:0 0 15px #ff493c75}
    .ship-systems-overlay[hidden]{display:none!important}.ship-systems-overlay{position:fixed;inset:0;z-index:20000;background:#080d14;display:flex;flex-direction:column;overflow:hidden}
    .ship-systems-head{height:55px;min-height:55px;padding:6px max(14px,env(safe-area-inset-right));display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #3e6173;background:#101e2a;color:#eff7fb;box-sizing:border-box}
    .ship-systems-head strong{font-size:17px}.ship-systems-head button{min-width:90px;min-height:42px;padding:8px 14px;background:#234255;border:1px solid #85c8d9;border-radius:8px;color:#e4f8fa;font:inherit;cursor:pointer}
    .ship-systems-overlay iframe{width:100%;height:calc(100dvh - 55px);border:0;flex:1;background:#080c11}
    @media(max-width:760px){.ship-systems-launch{left:10px;bottom:8px;font-size:12px}.ship-systems-engine-launch{left:auto;bottom:auto}.ship-systems-head{height:50px;min-height:50px}.ship-systems-overlay iframe{height:calc(100dvh - 50px)}}`;
  style.textContent+='.ship-systems-head{height:64px;min-height:64px}.ship-systems-head button{min-height:48px}.ship-systems-overlay iframe{height:calc(100dvh - 64px)}';
  document.head.append(style);
  const launch=document.createElement('button');
  launch.type='button';launch.className='ship-systems-launch';panel.append(launch);
  const engineLaunch=document.createElement('button');
  engineLaunch.type='button';engineLaunch.className='ship-systems-launch ship-systems-engine-launch';
  const engineTitle=enginePanel?.querySelector('#engine-title');
  if(engineTitle)engineTitle.after(engineLaunch);
  else enginePanel?.append(engineLaunch);
  const overlay=document.createElement('div');
  overlay.className='ship-systems-overlay';
  overlay.hidden=true;
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  overlay.setAttribute('aria-label','阿屁號 3D 船體檢修');
  overlay.innerHTML='<div class="ship-systems-head"><strong>阿屁號 · 船體檢修</strong><button type="button">返回艦橋</button></div><iframe title="阿屁號 3D 船體檢修" allow="fullscreen"></iframe>';
  document.body.append(overlay);
  const frame=overlay.querySelector('iframe'),closeButton=overlay.querySelector('button');
  let previousFocus=null;
  function refresh(){
    const count=read().damage.length;
    launch.textContent=count?`船體檢修 · ${count} 處警示`:'查看 3D 船體';
    engineLaunch.textContent=count?`開啟 3D 檢修 · ${count} 處警示`:'開啟 3D 船體';
    for(const button of [launch,engineLaunch])button.classList.toggle('damaged',!!count);
    ship.setAttribute('aria-label',count?`阿屁號飛船，${count} 處損傷，點選查看 3D 船體`:'阿屁號飛船，點選查看 3D 船體');
    ship.title=count?`有 ${count} 處損傷，點選檢修`:'點選查看 3D 船體';
  }
  function sendState(){
    if(overlay.hidden||!frame.contentWindow)return;
    frame.contentWindow.postMessage({type:'ship-systems-state',damage:read().damage,scrap:Number(window.resources?.scrap)||0},location.origin);
  }
  function open(){
    if(!overlay.hidden)return;
    previousFocus=document.activeElement;
    overlay.hidden=false;
    window.shipSystemsOverlayOpen=true;
    document.body.classList.add('ship-systems-open');
    frame.src='ship-study/index.html?embed=1';
    closeButton.focus();
  }
  function close(){
    if(overlay.hidden)return;
    overlay.hidden=true;
    window.shipSystemsOverlayOpen=false;
    document.body.classList.remove('ship-systems-open');
    frame.src='about:blank'; // Free the WebGL context on iPad.
    if(window.fuelLeakActive)window.resumeFuelLeakDialog?.();
    previousFocus?.focus?.({preventScroll:true});
  }
  window.openShipSystemsOverlay=open;
  launch.addEventListener('click',open);
  engineLaunch.addEventListener('click',open);
  closeButton.addEventListener('click',close);
  window.closeShipSystemsOverlay=close;
  ship.tabIndex=0;ship.setAttribute('role','button');
  ship.addEventListener('click',open);
  ship.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();open();}});
  overlay.addEventListener('keydown',event=>{if(event.key==='Escape')close();});
  frame.addEventListener('load',sendState);

  const originalFailure=window.startEngineFailureState;
  if(typeof originalFailure==='function')window.startEngineFailureState=function(...args){
    const result=originalFailure.apply(this,args);
    if(window.engineFailed&&!window.enginePractice){
      addFault('engine','量子引擎故障');
      window.switchTab?.('engine',true);
    }
    return result;
  };
  const originalLeak=window.triggerFuelLeak;
  if(typeof originalLeak==='function')window.triggerFuelLeak=function(...args){
    const result=originalLeak.apply(this,args);
    if(result&&!args[0])addFault('fuel','油箱破裂');
    return result;
  };
  window.addEventListener('ship-engine-repaired',()=>clearFault('engine'));
  window.addEventListener('ship-fuel-repaired',()=>clearFault('fuel'));
  window.addEventListener('ship-mission-completed',event=>addBattle(`任務完成 · ${event.detail?.planet||'未知星球'}`));
  window.addEventListener('ship-meteor-damage',event=>addBattle(event.detail?.mode==='drone'?'無人機來襲 · 船體戰損':'隕石撞擊 · 船體戰損'));
  window.addEventListener('storage',event=>{if(event.key===KEY){refresh();sendState();}});
  const originalResources=window.updateResources;
  if(typeof originalResources==='function')window.updateResources=function(...args){
    const result=originalResources.apply(this,args);sendState();return result;
  };

  function finishEngineFromModel(){
    if(!window.engineFailed)return;
    window.stopAlarm?.();
    clearInterval(window.engineTimerInt);
    window.engineTimerInt=null;
    window.engineFailed=false;
    window.enginePhase=0;
    document.getElementById('zone-engine')?.classList.remove('engine-alert-state');
    for(const id of ['cool','mag','shd'])document.getElementById('sub-btn-'+id)?.classList.remove('active-target');
    for(const id of ['r','y','b']){const button=document.getElementById('ebtn-'+id);if(button){button.disabled=true;button.classList.remove('active-target');}}
    window.restoreHUDMission?.();
    window.updateEngineRoomUI?.();
    window.updateLockdownUI?.();
    if(window.jumpTargetPlanet){const planet=window.jumpTargetPlanet;window.jumpTargetPlanet=null;window.arrivePlanet?.(planet);}
  }
  window.addEventListener('message',event=>{
    if(event.origin!==location.origin||event.source!==frame.contentWindow||overlay.hidden)return;
    const data=event.data;
    if(data?.type==='ship-systems-ready'){sendState();return;}
    if(data?.type==='ship-systems-close'){close();return;}
    if(data?.type==='ship-systems-cockpit'){close();window.switchTab?.('control',true);window.openImmersiveCockpit?.();return;}
    if(data?.type!=='ship-system-repair-request'||typeof data.id!=='string')return;
    const state=read();
    const item=state.damage.find(entry=>entry.id===data.id);
    if(!item){frame.contentWindow.postMessage({type:'ship-system-repair-denied',reason:'零件狀態已更新'},location.origin);sendState();return;}
    state.damage=state.damage.filter(entry=>entry.id!==item.id);
    state.log.push({system:item.system,text:`${labels[item.system]} · ${partLabels[item.part]}已更換`,at:Date.now()});
    write(state);
    if(item.kind==='fault'&&item.system==='engine')finishEngineFromModel();
    if(item.kind==='fault'&&item.system==='fuel')window.finishFuelLeakFromShip?.();
  });
  // Emergencies do not survive a page reload. Preserve unfinished physical damage
  // as ordinary damage so a new emergency can still choose another part.
  const startup=read();
  if(startup.damage.some(item=>item.kind==='fault')){
    startup.damage=startup.damage.map(item=>item.kind==='fault'?{...item,kind:'battle'}:item);
    write(startup);
  }else refresh();
})();
