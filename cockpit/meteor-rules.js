export const ROUND_SECONDS=60;
export {createSalvageRound,grabSalvage,sortSalvage,advanceSalvage} from './salvage-rules.js?v=20261023l';
export const SHOT_INTERVAL=.18;
export const HEAT_PER_SHOT=11;
export const COOLING_PER_SECOND=28;
export const SHIELD_DURATION=2.5;
export const SHIELD_COOLDOWN=8;
export const TYPES={rock:{points:10,hp:1},ice:{points:12,hp:1},large:{points:15,hp:2},ore:{points:25,hp:1},fragment:{points:5,hp:1},drone:{points:20,hp:1,mode:'drone'},droneShield:{points:35,hp:2,mode:'drone',core:true},droneAce:{points:60,hp:3,mode:'drone',core:true}};
export const DRONE_CHARGE=.9,DRONE_PROJECTILE_TIME=1.2,DRONE_MAX_VOLLEYS=2;
export function droneFireAt(type,volley=1){return 2.8+(volley-1)*(type==='droneAce'?2.8:3.4);}
export function registerEnemy(round,id,type){
 if(round.mode!=='drone'||TYPES[type]?.mode!=='drone'||!Number.isSafeInteger(id)||id<1||id>200||round.enemies.has(id)||round.seen.has(id))return false;
 round.enemies.set(id,{type,born:round.elapsed,volley:0});return true;
}
export function registerEnemyVolley(round,id,type,volley){
 const enemy=round.enemies.get(id);
 if(round.mode!=='drone'||!enemy||enemy.type!==type||round.seen.has(id)||!Number.isSafeInteger(volley)||volley!==enemy.volley+1||volley>DRONE_MAX_VOLLEYS||round.elapsed+.15<enemy.born+droneFireAt(type,volley))return false;
 enemy.volley=volley;round.hostileShots++;round.incoming.push({due:round.elapsed+DRONE_PROJECTILE_TIME,type});return true;
}
export function spawnInterval(mode,wave){return(mode==='drone'?[1.65,1.4,1.15]:[1.4,1.15,.9])[Math.max(0,Math.min(2,wave-1))];}
export function waveAt(elapsed){return Math.min(3,1+Math.floor(Math.max(0,elapsed)/20));}
export function rewardsFor({destroyed,ore,points=0,mode='meteor',training=false,aborted=false}){
 if(training||aborted)return{scrap:0,crystal:0};
 if(mode==='salvage')return destroyed===6?{scrap:6,crystal:3}:{scrap:0,crystal:0};
 if(mode==='drone')return{scrap:Math.min(18,Math.floor(Math.max(0,points)/100)),crystal:Math.min(12,Math.max(0,Math.floor(ore)))};
 return{scrap:Math.min(15,Math.floor(Math.max(0,destroyed)/3)),crystal:Math.min(12,Math.max(0,Math.floor(ore))*2)};
}
export function starsFor(destroyed,mode='meteor'){return destroyed>=(mode==='drone'?18:24)?3:destroyed>=(mode==='drone'?8:12)?2:destroyed>0?1:0;}
export function coolWeapon(heat,overheated,dt,multiplier=1){
 const value=Math.max(0,heat-Math.max(0,dt)*COOLING_PER_SECOND*Math.max(.5,Math.min(3,multiplier)));
 return{heat:value,overheated:overheated&&value>25};
}
// One target can either be intercepted or hit the ship, never both.
export function resolveTarget(round,id,kind,type){
 if(!Number.isSafeInteger(id)||id<1||id>200||!Object.hasOwn(TYPES,type)||!['destroy','impact','escape'].includes(kind)||round.seen.has(id))return false;
 if((TYPES[type].mode||'meteor')!==(round.mode||'meteor'))return false;
 if(kind==='impact'&&round.mode==='drone'||kind==='escape'&&round.mode!=='drone')return false;
 round.seen.add(id);
 if(kind==='destroy'){
  round.destroyed++;round.points+=TYPES[type].points;if(type==='ore'||TYPES[type].core)round.ore++;
  if(round.mode==='drone'){round.combo=round.elapsed-(round.lastKill??-Infinity)<=4?(round.combo||0)+1:1;round.lastKill=round.elapsed;round.bestCombo=Math.max(round.bestCombo||0,round.combo);round.points+=Math.min(5,round.combo-1)*5;}
 }
 return true;
}
