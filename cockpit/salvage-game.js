import {iconSvg} from './icons.js?v=20261023l';
import {createSalvageModel} from './salvage-model.js?v=20261023l';
import {SALVAGE_KINDS,SALVAGE_TOTAL} from './salvage-rules.js?v=20261023l';

export function createSalvageGame({scene,camera,send,reduced=false}){
 const root=document.createElement('section');root.id='salvage-game';root.hidden=true;root.setAttribute('aria-label','太空打撈遊戲');
 root.innerHTML=`<header class="salvage-top"><div class="salvage-title"><i>${iconSvg('salvage')}</i><span>太空打撈<small>SPACE SALVAGE</small></span></div><div class="salvage-counter" aria-label="已回收零件"><i>${iconSvg('cargo')}</i><b id="salvage-count">0 / 6</b></div><button id="salvage-pause" aria-label="暫停太空打撈">Ⅱ</button><button id="salvage-stop" aria-label="終止太空打撈">■ <small>終止</small></button></header>
 <div id="salvage-targets" aria-label="漂浮的太空零件"></div><div id="salvage-guide" role="status" aria-live="polite"></div>
 <nav id="salvage-bins" aria-label="選擇同色同圖案回收艙"></nav>
 <div id="salvage-sheet" class="salvage-sheet"><div class="salvage-sheet-card" role="dialog" aria-modal="true" aria-label="太空打撈控制"><i class="salvage-emblem">${iconSvg('salvage')}</i><h2 id="salvage-sheet-title">太空打撈</h2><div id="salvage-intro"><div class="salvage-steps"><i>${iconSvg('screw')}</i><span>→</span><i>${iconSvg('salvage')}</i><span>→</span><i>${iconSvg('cargo')}</i></div><p>點零件，手臂幫你抓<br>放進同色、同圖案的回收艙</p><small>不限時間 · 收集 6 個零件</small></div><div id="salvage-results" hidden><div class="salvage-complete">${iconSvg('check')}<b>6 / 6</b></div><div class="salvage-rewards"><span>${iconSvg('screw')}<b id="salvage-scrap">+6</b></span><span>${iconSvg('crystal')}<b id="salvage-crystal">+3</b></span></div></div><p id="salvage-pause-note" hidden>零件和手臂都暫停了，慢慢來。</p><div class="salvage-actions"><button id="salvage-play" aria-label="開始太空打撈">▶ 開始打撈</button><button id="salvage-resume" aria-label="繼續太空打撈" hidden>▶ 繼續</button><button id="salvage-again" aria-label="再玩一次太空打撈" hidden>↻ 再玩一次</button><button id="salvage-leave" aria-label="返回駕駛艙">${iconSvg('dashboard')}返回駕駛艙</button><button id="salvage-choose" aria-label="選擇其他遊戲">${iconSvg('games')}換個遊戲</button></div></div></div>`;
 document.body.append(root);const $=id=>root.querySelector('#'+id),model=createSalvageModel({scene,camera,reduced}),buttons=new Map(),bins=new Map();
 root.querySelector('.salvage-actions').insertAdjacentHTML('beforeend','<button id="salvage-abort" aria-label="終止太空打撈並返回駕駛艙" hidden>■ 終止遊戲</button>');
 const colorNames={cell:'綠色',gear:'金色',crystal:'紫色'};
 let round=null,elapsed=0;
 for(const [kind,info]of Object.entries(SALVAGE_KINDS)){
  const b=document.createElement('button');b.className='salvage-bin';b.dataset.kind=kind;b.style.setProperty('--bin-color',info.color);b.setAttribute('aria-label',colorNames[kind]+info.name+'回收艙');
  b.innerHTML=`<i>${iconSvg(info.icon)}</i><span class="bin-slots" aria-hidden="true"><em></em><em></em></span><small>${colorNames[kind]}回收艙</small>`;b.onclick=()=>send('salvage-sort',{kind});$('salvage-bins').append(b);bins.set(kind,b);
 }
 for(const [id,action]of [['salvage-play','start'],['salvage-pause','pause'],['salvage-resume','resume'],['salvage-stop','abort'],['salvage-abort','abort'],['salvage-again','again'],['salvage-leave','leave'],['salvage-choose','choose']])$(id).onclick=()=>send(action);
 root.addEventListener('keydown',event=>{if(event.key==='Escape'&&round?.phase==='playing'){event.preventDefault();send('pause');}});
 function sync(snapshot){
  if(!snapshot){round=null;root.hidden=true;model.root.visible=false;return;}
  if(round?.id!==snapshot.id){elapsed=0;$('salvage-targets').replaceChildren();buttons.clear();
   for(const p of snapshot.salvage.pieces){const b=document.createElement('button'),info=SALVAGE_KINDS[p.kind];b.className='salvage-target';b.style.setProperty('--part-color',info.color);b.dataset.pieceId=p.id;b.setAttribute('aria-label','抓取'+colorNames[p.kind]+info.name+' '+p.id);b.innerHTML='<i>'+iconSvg('plus')+'</i>';b.onclick=()=>send('salvage-grab',{targetId:p.id});$('salvage-targets').append(b);buttons.set(p.id,b);}
  }
  round=snapshot;elapsed=Math.max(elapsed,snapshot.elapsed);root.hidden=false;const s=round.salvage,phase=round.phase,playing=phase==='playing';
  $('salvage-count').textContent=s.recovered+' / '+SALVAGE_TOTAL;
  $('salvage-pause').hidden=$('salvage-stop').hidden=!['playing','paused'].includes(phase);$('salvage-pause').disabled=!playing;
  $('salvage-sheet').hidden=playing;$('salvage-bins').hidden=!['playing','paused'].includes(phase);$('salvage-guide').hidden=!playing;
  $('salvage-intro').hidden=phase!=='intro';$('salvage-results').hidden=phase!=='result';$('salvage-pause-note').hidden=phase!=='paused';
  $('salvage-play').hidden=phase!=='intro';$('salvage-resume').hidden=phase!=='paused';$('salvage-again').hidden=phase!=='result';$('salvage-choose').hidden=phase==='paused';
  $('salvage-abort').hidden=phase!=='paused';
  $('salvage-sheet-title').textContent=phase==='result'?'回收完成！':phase==='paused'?'休息一下':'太空打撈';
  $('salvage-scrap').textContent='+'+round.rewards.scrap;$('salvage-crystal').textContent='+'+round.rewards.crystal;
  $('salvage-guide').innerHTML=iconSvg(s.stage==='ready'?'salvage':s.stage==='carrying'?'cargo':'drag')+'<span>'+(s.stage==='ready'?'點零件，伸手抓！':s.stage==='grabbing'?'抓到了，收回來…':s.stage==='carrying'?(s.lastWrongBin?'再找找同色、同圖案 ↻':'選同色、同圖案的回收艙'):'放進回收艙…')+'</span>';
  for(const p of s.pieces){const b=buttons.get(p.id);b.hidden=!playing||p.recovered||s.selectedId===p.id;b.disabled=!playing||s.stage!=='ready';}
  for(const [kind,b]of bins){b.disabled=!playing||s.stage!=='carrying';b.classList.toggle('wrong',s.lastWrongBin===kind);b.classList.toggle('carrying',playing&&s.stage==='carrying');const count=s.pieces.filter(p=>p.kind===kind&&p.recovered).length;[...b.querySelectorAll('em')].forEach((e,i)=>e.classList.toggle('filled',i<count));}
 }
 function tick(dt){
  if(!round)return;if(round.phase==='playing')elapsed+=dt;model.update(round,elapsed,innerWidth,innerHeight);
  if(round.phase!=='playing')return;
  for(const [id,b]of buttons){if(b.hidden)continue;const point=model.getTarget(id);if(!point)continue;point.project(camera);const size=Math.max(54,Math.min(100,innerHeight*.1));b.style.width=b.style.height=size+'px';b.style.left=((point.x*.5+.5)*innerWidth-size/2)+'px';b.style.top=((-point.y*.5+.5)*innerHeight-size/2)+'px';}
 }
 return{sync,tick,model};
}
