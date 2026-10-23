/* One explicit pause covers every control surface, including modal learning games. */
(()=>{
 'use strict';
 let paused=false,autoPausedMeteor=false,lastFocus=null,resumeAudio=false;
 let nextId=0;const timers=new Map(),now=()=>performance.now();
 const nativeSetTimeout=window.setTimeout.bind(window),nativeClearTimeout=window.clearTimeout.bind(window);
 window.isGamePaused=()=>paused||document.hidden;
 function arm(timer){
  if(window.isGamePaused())return;
  timer.started=now();timer.handle=nativeSetTimeout(()=>{if(window.isGamePaused()){timer.remaining=0;timer.handle=null;return;}timers.delete(timer.id);timer.fn(...timer.args);},timer.remaining);
 }
 window.setGameTimeout=(fn,delay=0,...args)=>{
  if(typeof fn!=='function')throw new TypeError('A game timer requires a function');
  const timer={id:++nextId,fn,args,remaining:Math.max(0,Number(delay)||0),started:now(),handle:null};
  timers.set(timer.id,timer);arm(timer);return timer.id;
 };
 window.clearGameTimeout=id=>{const timer=timers.get(id);if(!timer)return;nativeClearTimeout(timer.handle);timers.delete(id);};
 window.clearGameTimeouts=()=>{for(const timer of timers.values())nativeClearTimeout(timer.handle);timers.clear();};
 function freezeTimers(){for(const timer of timers.values()){if(timer.handle===null)continue;nativeClearTimeout(timer.handle);timer.remaining=Math.max(0,timer.remaining-(now()-timer.started));timer.handle=null;}}
 const style=document.createElement('style');
 style.textContent='#game-pause-sheet{color:#eaf8fa;background:radial-gradient(ellipse at top,#203c50,#071624 75%);border:1px solid #79b3c4;border-radius:24px;width:min(440px,90vw);padding:30px;text-align:center;box-sizing:border-box;box-shadow:0 24px 100px #000a}#game-pause-sheet::backdrop{background:#020812df;backdrop-filter:blur(10px)}#game-pause-sheet .pause-icon{display:block;font:700 68px/1.2 sans-serif;color:#a0dfd3}#game-pause-sheet h2{font-size:26px;margin:14px 0 8px}#game-pause-sheet p{color:#b5ccd4;line-height:1.7}#game-pause-sheet .pause-actions{display:grid;gap:12px;margin-top:24px}#game-pause-sheet button{min-height:60px;border:1px solid #6e9dad;border-radius:14px;background:#1c3b4d;color:#f0fbff;font-family:inherit;font-weight:600;font-size:20px;line-height:1.3;touch-action:manipulation;padding:12px;cursor:pointer}#game-pause-sheet #game-continue{background:#2c665d;border-color:#8bd6bd;font-size:24px}#game-pause-sheet button:focus-visible{outline:3px solid #f3d492;outline-offset:4px}body.game-session-paused *{animation-play-state:paused!important}';
 document.head.append(style);
 const sheet=document.createElement('dialog');sheet.id='game-pause-sheet';sheet.setAttribute('aria-labelledby','game-pause-title');
 sheet.innerHTML='<span class="pause-icon" aria-hidden="true">Ⅱ</span><h2 id="game-pause-title">休息一下</h2><p>飛船和遊戲都暫停了<br>準備好，再一起出發！</p><div class="pause-actions"><button id="game-continue" aria-label="繼續目前的遊戲">▶ 繼續</button><button id="game-pause-back" aria-label="結束目前活動並返回駕駛艙">⌂ 返回駕駛艙</button></div>';
 document.body.append(sheet);
 const continueButton=sheet.querySelector('#game-continue'),backButton=sheet.querySelector('#game-pause-back');
 const booted=()=>document.getElementById('boot-screen')?.style.display==='none';
 function show(){if(!paused||document.hidden||sheet.open)return;backButton.hidden=!booted();sheet.showModal();continueButton.focus();}
 window.pauseGameSession=()=>{
  if(paused)return false;
  paused=true;lastFocus=document.activeElement;freezeTimers();document.body.classList.add('game-session-paused');
  autoPausedMeteor=!!window.pauseMeteorSession?.();
  resumeAudio=window.audioCtx?.state==='running';if(resumeAudio)window.audioCtx.suspend().catch(()=>{});
  window.speechSynthesis?.cancel();window.dispatchEvent(new CustomEvent('game-session-pause'));show();return true;
 };
 window.resumeGameSession=()=>{
  if(!paused||document.hidden)return false;
  paused=false;if(sheet.open)sheet.close();document.body.classList.remove('game-session-paused');
  for(const timer of timers.values())arm(timer);
  if(autoPausedMeteor)window.resumeMeteorSession?.();autoPausedMeteor=false;
  if(resumeAudio&&document.getElementById('sound-toggle')?.getAttribute('aria-pressed')!=='true')window.audioCtx?.resume().catch(()=>{});resumeAudio=false;
  window.dispatchEvent(new CustomEvent('game-session-resume'));lastFocus?.focus?.();return true;
 };
 continueButton.onclick=()=>window.resumeGameSession();
 backButton.onclick=()=>{
  // The cockpit rejects entry while a modal is open. Keep clocks paused until cleanup finishes.
  if(sheet.open)sheet.close();
  if(window.cancelPausedActivity)window.cancelPausedActivity();
  else{
   window.clearGameTimeouts();window.leaveMeteorSession?.();
   const letters=document.getElementById('letter-game');if(letters?.open)document.getElementById('letter-close')?.click();
   const leak=document.getElementById('fuel-leak-dialog');if(leak?.open){document.getElementById('leak-assist')?.click();document.getElementById('leak-close')?.click();}
   if(window.isSystemLocked?.())window.emergencyStop?.();
   window.switchTab?.('control',true);window.openImmersiveCockpit?.();
  }
  autoPausedMeteor=false;window.resumeGameSession();
 };
 sheet.addEventListener('cancel',event=>event.preventDefault());
 document.addEventListener('visibilitychange',()=>{if(document.hidden)window.pauseGameSession();else show();});
 window.addEventListener('pagehide',()=>window.pauseGameSession());
 window.addEventListener('pageshow',()=>show());
})();
