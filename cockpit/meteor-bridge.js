import {ROUND_SECONDS,SHIELD_DURATION,SHIELD_COOLDOWN,rewardsFor,starsFor,resolveTarget,waveAt,registerEnemy,registerEnemyVolley,createSalvageRound,grabSalvage,sortSalvage,advanceSalvage} from './meteor-rules.js?v=20261023l';

// Native flight state owns the round clock, shield damage and one-time payout.
let round=null,lastTick=performance.now(),lastSecond=-1;
const refresh=()=>window.refreshCockpitState?.();
function reportMissionProgress(){if(!round)return;const gained=round.destroyed-(round.missionReported||0);round.missionReported=round.destroyed;if(!round.training&&gained>0)window.recordExplorationActivity?.(round.mode,gained);}
function lock(on){window.meteorDefenseActive=on;window.combatActive=on;document.body.classList.toggle('meteor-defense-active',on);window.updateLockdownUI?.();}
const style=document.createElement('style');style.textContent='.meteor-defense-active #emergency-stop,.meteor-defense-active #reward-toast{display:none!important}';document.head.append(style);
window.getMeteorDefenseState=()=>round?{id:round.id,mode:round.mode,phase:round.phase,elapsed:Math.round(round.elapsed*100)/100,timeLeft:round.mode==='salvage'?null:Math.ceil(ROUND_SECONDS-round.elapsed),wave:waveAt(round.elapsed),points:round.points,destroyed:round.destroyed,ore:round.ore,combo:round.elapsed-round.lastKill<=4?round.combo:0,bestCombo:round.bestCombo,incoming:round.incoming.length,hostileShots:round.hostileShots,blocked:round.blocked,shots:round.shots,shield:round.shield,shieldMax:round.shieldMax,guardActive:round.guardUntil>round.elapsed,guardCooldown:Math.max(0,Math.ceil(round.nextGuard-round.elapsed)),rewards:round.rewards,stars:starsFor(round.destroyed,round.mode),reason:round.reason,training:round.training,encounter:!!window.jumpTargetPlanet,cooling:Number(window.upgrades?.coolingRate)||1,salvage:round.mode==='salvage'?JSON.parse(JSON.stringify(round.salvage)):null}:null;
function open(options={}){
 if(round||window.isSystemLocked?.()||window.isJumping)return false;
 window.switchTab?.('control',true);window.openImmersiveCockpit?.();
 const shield=Number(window.shieldLevel)||0,mode=['drone','salvage'].includes(options.mode)?options.mode:'meteor',training=mode!=='salvage'&&shield<=0;
 round={id:crypto.randomUUID(),mode,phase:options.select&&!window.jumpTargetPlanet?'select':'intro',elapsed:0,points:0,destroyed:0,ore:0,combo:0,bestCombo:0,lastKill:-Infinity,enemies:new Map(),incoming:[],hostileShots:0,blocked:0,shots:0,seen:new Set(),seq:0,shield:training?100:shield,shieldMax:training?100:Number(window.upgrades?.shieldMax)||100,guardUntil:0,nextGuard:0,lastImpact:-Infinity,lastShot:-Infinity,rewards:{scrap:0,crystal:0},training,reason:null,settled:false,salvage:mode==='salvage'?createSalvageRound():null};
 lock(true);lastTick=performance.now();lastSecond=-1;refresh();return true;
}
window.openMeteorDefense=open;
window.openShootingGames=()=>open({select:true});
window.openDroneDefense=()=>open({mode:'drone'});
window.openSpaceSalvage=()=>open({mode:'salvage'});
function finish(reason){
 if(!round||round.settled)return;
 reportMissionProgress();
 round.settled=true;round.phase='result';round.reason=reason;
 round.rewards=rewardsFor(round);window.combatActive=false;window.updateLockdownUI?.();
 if(round.rewards.scrap||round.rewards.crystal)window.updateResources?.(round.rewards.scrap,round.rewards.crystal);
 if(!round.training&&round.destroyed>0){const name=document.getElementById('loc-display')?.textContent||'深空航道',objects=[...(window.PLANETS||[]),window.MOON_DATA,window.ASTEROID_BELT_DATA,window.OUTPOST_DATA].filter(Boolean),planet=objects.find(p=>name===p.name||name.startsWith(p.name.split(' ')[0]));window.recordAchievement?.({kind:round.mode==='salvage'?'太空打撈':round.mode==='drone'?'無人機攔截':'隕石攔截',planetId:planet?.id||'earth',planetName:name,task:round.mode==='salvage'?'回收 '+round.destroyed+' 個太空零件':'攔截 '+round.destroyed+(round.mode==='drone'?' 架無人機':' 顆隕石'),rewards:round.rewards});}
 if(!round.training&&round.impacts>=3)window.dispatchEvent(new CustomEvent('ship-meteor-damage',{detail:{mode:round.mode}}));
 if(reason==='complete')window.playSuccess?.();else window.playAlert?.();refresh();
}
function leave(){
 if(!round)return;
 round=null;lock(false);refresh();
 const destination=window.jumpTargetPlanet;window.jumpTargetPlanet=null;
 if(destination)window.arrivePlanet?.(destination);else window.switchTab?.('control',true);
}
// The parent pause sheet controls this native round; resuming never advances its clock.
window.pauseMeteorSession=()=>{if(round?.phase!=='playing')return false;round.phase='paused';refresh();return true;};
window.resumeMeteorSession=()=>{if(round?.phase!=='paused'||document.hidden||window.isGamePaused?.())return false;round.phase='playing';lastTick=performance.now();refresh();return true;};
window.leaveMeteorSession=leave;
window.onMeteorCockpitReady=()=>{if(round&&['playing','paused'].includes(round.phase))leave();};
function takeHit(type){
 if(round.guardUntil>round.elapsed){round.blocked++;return;}
 if(round.elapsed-round.lastImpact<=.6)return;
 round.combo=0;round.lastKill=-Infinity;round.lastImpact=round.elapsed;round.impacts=(round.impacts||0)+1;
 const damage=round.mode==='drone'?(type==='droneAce'?8:type==='droneShield'?6:4):type==='large'?9:6;
 if(round.training)round.shield=Math.max(0,round.shield-damage);else{window.updateShield?.(-damage);round.shield=Number(window.shieldLevel)||0;}
 if(round.shield<=0)finish('shield');window.playTone?.(82,'triangle',.13,.035);
}
window.handleCockpitMeteorAction=data=>{
 if(data.action==='open'){open();return;}
 if(!round||data.roundId!==round.id||!Number.isSafeInteger(data.seq)||data.seq<=round.seq)return;
 round.seq=data.seq;
 const action=data.action;
 if(action==='leave'||action==='abort'){leave();return;}
 if(document.hidden||window.isGamePaused?.())return;
 if(action==='select'&&round.phase==='select'&&['meteor','drone','salvage'].includes(data.mode)){round.mode=data.mode;round.phase='intro';if(data.mode==='salvage'){round.training=false;round.salvage=createSalvageRound();}refresh();return;}
 if(action==='choose'&&['intro','result'].includes(round.phase)&&!window.jumpTargetPlanet){leave();open({select:true});return;}
 if(action==='again'&&round.phase==='result'&&!window.jumpTargetPlanet){const mode=round.mode;leave();open({mode});return;}
 if(action==='start'&&round.phase==='intro'){round.phase='playing';lastTick=performance.now();refresh();return;}
 if(action==='pause'&&round.phase==='playing'){round.phase='paused';refresh();return;}
 if(action==='resume'&&round.phase==='paused'){round.phase='playing';lastTick=performance.now();refresh();return;}
 if(round.phase!=='playing')return;
 if(round.mode==='salvage'){
  if(data.action==='salvage-grab'&&grabSalvage(round,data.targetId)){window.playTone?.(420,'sine',.12,.03);refresh();}
  if(data.action==='salvage-sort'&&sortSalvage(round,data.kind)){window.playTone?.(round.salvage.lastWrongBin?220:740,'sine',.12,.03);refresh();}
  return;
 }
 if(action==='enemy-spawn'){registerEnemy(round,data.targetId,data.targetType);return;}
 if(action==='enemy-fire'){if(registerEnemyVolley(round,data.targetId,data.targetType,data.volley)){window.playTone?.(310,'triangle',.06,.025);refresh();}return;}
 if(action==='shot'){
  const now=performance.now();if(now-round.lastShot<100)return;round.lastShot=now;round.shots++;
  window.playTone?.(230,'sawtooth',.055,.025);return;
 }
 if(action==='guard'&&round.elapsed>=round.nextGuard){round.guardUntil=round.elapsed+SHIELD_DURATION;round.nextGuard=round.elapsed+SHIELD_COOLDOWN;window.playTone?.(390,'sine',.16,.04);refresh();return;}
 if(!['destroy','impact','escape'].includes(action)||!resolveTarget(round,data.targetId,action,data.targetType))return;
 if(action==='destroy'){if(data.targetType==='ore'||round.mode!=='meteor')window.playTone?.(round.mode!=='meteor'?600+Math.min(round.combo,5)*90:940,'sine',.1,.025);}
 else if(action==='impact')takeHit(data.targetType);
 reportMissionProgress();
 refresh();
};
const combat=window.initCanvasCombat;
window.initCanvasCombat=function(type,...args){if(type==='meteor'&&open())return;return combat?.call(this,type,...args);};
const emergency=window.emergencyStop;
window.emergencyStop=function(...args){if(round){leave();return;}return emergency?.apply(this,args);};
document.addEventListener('visibilitychange',()=>{if(document.hidden)window.pauseMeteorSession();});
const timer=setInterval(()=>{
 const now=performance.now(),dt=Math.min(1,(now-lastTick)/1000);lastTick=now;
 if(round?.phase!=='playing')return;
 if(document.hidden||window.isGamePaused?.()){window.pauseMeteorSession();return;}
 if(round.mode==='salvage'){round.elapsed+=dt;const complete=advanceSalvage(round);reportMissionProgress();if(complete)finish('complete');else refresh();return;}
 round.elapsed=Math.min(ROUND_SECONDS,round.elapsed+dt);
 if(round.elapsed>=ROUND_SECONDS){finish('complete');return;}
 let incomingChanged=false;
 for(let i=round.incoming.length-1;i>=0;i--)if(round.incoming[i].due<=round.elapsed){const hit=round.incoming.splice(i,1)[0];incomingChanged=true;takeHit(hit.type);if(round.phase!=='playing')break;}
 if(incomingChanged)refresh();
 const second=Math.floor(round.elapsed);if(second!==lastSecond){lastSecond=second;refresh();}
},100);
addEventListener('pagehide',event=>{if(!event.persisted)clearInterval(timer);});
