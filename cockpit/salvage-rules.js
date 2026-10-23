export const SALVAGE_TOTAL=6;
export const GRAB_SECONDS=1.35;
export const RETURN_SECONDS=1.15;
export const SALVAGE_KINDS={cell:{name:'能量電池',color:'#8ce8ce',icon:'fuel'},gear:{name:'機械零件',color:'#efc47a',icon:'screw'},crystal:{name:'晶體',color:'#bcabff',icon:'crystal'}};
export function createSalvageRound(random=Math.random){
 const kinds=['cell','gear','crystal','cell','gear','crystal'];
 for(let i=kinds.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[kinds[i],kinds[j]]=[kinds[j],kinds[i]];}
 return {pieces:kinds.map((kind,i)=>({id:i+1,kind,recovered:false})),stage:'ready',selectedId:null,bin:null,startedAt:0,recovered:0,mistakes:0,lastWrongBin:null};
}
export function grabSalvage(round,id){
 const s=round.salvage,p=s?.pieces.find(p=>p.id===id);
 if(round.mode!=='salvage'||!Number.isSafeInteger(id)||!p||p.recovered||s.stage!=='ready')return false;
 s.stage='grabbing';s.selectedId=id;s.startedAt=round.elapsed;s.lastWrongBin=null;return true;
}
export function sortSalvage(round,kind){
 const s=round.salvage,p=s?.pieces.find(p=>p.id===s.selectedId);
 if(round.mode!=='salvage'||s?.stage!=='carrying'||!p||p.recovered||!Object.hasOwn(SALVAGE_KINDS,kind))return false;
 if(kind!==p.kind){s.mistakes++;s.lastWrongBin=kind;return true;}
 s.stage='returning';s.bin=kind;s.startedAt=round.elapsed;s.lastWrongBin=null;return true;
}
export function advanceSalvage(round){
 const s=round.salvage;if(!s)return false;
 if(s.stage==='grabbing'&&round.elapsed-s.startedAt>=GRAB_SECONDS){s.stage='carrying';s.startedAt=round.elapsed;}
 if(s.stage==='returning'&&round.elapsed-s.startedAt>=RETURN_SECONDS){
  const piece=s.pieces.find(p=>p.id===s.selectedId);
  if(piece&&!piece.recovered){piece.recovered=true;s.recovered++;round.destroyed=s.recovered;round.points=s.recovered*10;}
  s.stage='ready';s.selectedId=null;s.bin=null;
 }
 return s.recovered===SALVAGE_TOTAL;
}
