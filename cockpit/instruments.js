import {drawIcon,iconPalette} from './icons.js?v=20261023l';

function round(c,x,y,w,h,r=16){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
function circle(c,x,y,r,fill,stroke=null){c.beginPath();c.arc(x,y,r,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}}
function label(c,text,x,y,size=24,color='#83a9bc',align='center'){c.font=`500 ${size}px "Microsoft JhengHei",sans-serif`;c.textAlign=align;c.textBaseline='middle';c.fillStyle=color;c.fillText(text,x,y);}
function surface(c,w,h,icon,title){
 const g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,'#19384b');g.addColorStop(.55,'#0b2535');g.addColorStop(1,'#05131e');c.fillStyle=g;c.fillRect(0,0,w,h);
 c.lineWidth=2;c.strokeStyle='#6d9caf55';round(c,15,15,w-30,h-30,19);c.stroke();
 c.strokeStyle='#729bad0c';c.lineWidth=1;for(let x=40;x<w;x+=64){c.beginPath();c.moveTo(x,85);c.lineTo(x,h-30);c.stroke();}for(let y=85;y<h;y+=64){c.beginPath();c.moveTo(25,y);c.lineTo(w-25,y);c.stroke();}
 drawIcon(c,icon,57,49,40,{color:iconPalette[icon]?.color||'#a9d7ed',accent:'#fff'});label(c,title,91,50,24,'#7ea7b8','left');
 c.fillStyle='#a5d5df';c.fillRect(w-85,43,33,5);c.fillStyle='#466b7e';c.fillRect(w-46,43,10,5);
 c.strokeStyle='#7ba5b72b';c.beginPath();c.moveTo(35,83);c.lineTo(w-35,83);c.stroke();
}

export function paintKey(c,w,h,action,state){
 c.clearRect(0,0,w,h);const theme=iconPalette[action]||iconPalette.ship;
 const complete=action==='mission'&&state.missionComplete;
 const warning=action==='ship'&&state.damage.length>0||action==='engine'&&state.engineFailed||action==='fuel'&&state.fuel<20;
 const blocked=state.locked&&!['ship','engine'].includes(action)||action==='jump'&&!state.jumpReady;
 const color=warning?'#ffab82':theme.color;
 c.lineWidth=2;const rim=c.createLinearGradient(0,0,0,h);rim.addColorStop(0,color+'70');rim.addColorStop(.55,color+'10');rim.addColorStop(1,color+'35');c.strokeStyle=rim;round(c,8,8,w-16,h-16,15);c.stroke();
 const size=Math.min(h*.68,w*.70),cx=w/2,cy=h*.43;
 c.save();c.shadowColor=blocked||action==='jump'?'transparent':color;c.shadowBlur=14;drawIcon(c,complete?'check':action,cx,cy,size,{color:action==='jump'?'#173544':color,accent:action==='jump'?'#a95627':'#e7fbff',ink:action==='jump'?'#f4dfa8':'#0b2634',alpha:blocked?.68:1});c.restore();
 label(c,complete?'領獎':theme.label,w/2,h*.85,Math.max(20,h*.115),action==='jump'?'#173443':'#bed5df');
 if(blocked)drawIcon(c,'lock',w-40,38,36,{color:'#ebcf93',ink:'#173345'});
 if(warning)drawIcon(c,'warning',w-41,39,44,{color:'#ffad7d',ink:'#3c211b'});
}

export function paintToggle(c,w,h,action,on){
 c.clearRect(0,0,w,h);const color=iconPalette[action].color;
 drawIcon(c,action,w*.3,h*.4,Math.min(w*.46,h*.62),{color:on?color:'#8ca9b7',accent:on?'#e9fff0':'#bdcdd3',ink:'#142b39'});
 circle(c,w*.82,h*.24,h*.085,on?'#a9e6bf':'#344c5e',on?'#dcffe1':'#8096a2');
 label(c,iconPalette[action].label,w*.49,h*.86,h*.145,'#c1d3da');
}

export function paintDrills(c,w,h){
 const gold=c.createLinearGradient(0,0,w,h);gold.addColorStop(0,'#e7cc87');gold.addColorStop(.55,'#bb9550');gold.addColorStop(1,'#765728');c.fillStyle=gold;c.fillRect(0,0,w,h);
 c.lineWidth=w*.012;c.strokeStyle='#f9e5a8';round(c,w*.045,h*.035,w*.91,h*.93,w*.055);c.stroke();
 drawIcon(c,'training',w*.5,h*.34,w*.65,{color:'#293a3e',accent:'#293a3e',ink:'#e4c177'});
 label(c,'演習',w*.5,h*.64,w*.17,'#23373d');
 for(const [i,icon] of ['meteor','drone','salvage'].entries())drawIcon(c,icon,w*(.24+i*.26),h*.86,w*.14,{color:'#31464a',accent:'#f9e2a4',ink:'#b79250'});
}

export function paintEngineStatus(c,w,h,state,t=0){
 const failed=!!state.engineFailed,damaged=(state.damage||[]).some(d=>d.system==='engine');
 const color=failed?'#ff9e75':damaged?'#f3c77c':'#9bf0df',status=failed?'故障':damaged?'待檢修':state.isJumping?'躍遷中':'正常';
 const bg=c.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#19364a');bg.addColorStop(1,'#07131e');c.fillStyle=bg;c.fillRect(0,0,w,h);
 c.strokeStyle=color+'80';c.lineWidth=w*.009;round(c,w*.035,h*.025,w*.93,h*.95,w*.055);c.stroke();
 label(c,'量子引擎',w*.5,h*.105,w*.108,'#c6e8ee');
 const x=w*.5,y=h*.37,r=w*.2,phase=(t||0)*.0007;
 const halo=c.createRadialGradient(x-r*.2,y-r*.2,0,x,y,r*1.9);halo.addColorStop(0,'#efffff');halo.addColorStop(.23,color);halo.addColorStop(.55,failed?'#e6654b':'#3b86bb');halo.addColorStop(1,'#10283b00');circle(c,x,y,r*1.9,halo);
 c.save();c.translate(x,y);for(let i=0;i<3;i++){c.save();c.rotate(phase+i*Math.PI/3);c.strokeStyle=color+(i?'a0':'ee');c.lineWidth=w*.012;c.beginPath();c.ellipse(0,0,r*1.55,r*.5,0,0,Math.PI*2);c.stroke();c.restore();}c.restore();
 drawIcon(c,failed||damaged?'warning':'check',w*.28,h*.66,w*.115,{color,ink:'#13323a'});label(c,status,w*.56,h*.66,w*.13,color);
 label(c,String(state.temp||'3,450 K'),w*.5,h*.81,w*.125,'#e3f5fa');
 const quant=Math.max(0,Math.min(100,parseFloat(String(state.quant||99.8))||0));
 c.fillStyle='#03101b';round(c,w*.13,h*.91,w*.74,h*.027,w*.01);c.fill();c.fillStyle=color;round(c,w*.13,h*.91,w*.74*quant/100,h*.027,w*.01);c.fill();
}

export function drawPlanet(c,id,x,y,r,thumbs){
 if(id==='outpost'){
  circle(c,x,y,r,'#0a2234','#708e9f');c.save();c.translate(x,y);c.fillStyle='#467d9b';c.fillRect(-r*.92,-r*.38,r*.61,r*.76);c.fillRect(r*.31,-r*.38,r*.61,r*.76);c.strokeStyle='#9acada';c.lineWidth=2;for(let i=1;i<4;i++){const xx=-r*.92+i*r*.15;c.beginPath();c.moveTo(xx,-r*.38);c.lineTo(xx,r*.38);c.stroke();c.beginPath();c.moveTo(-xx,-r*.38);c.lineTo(-xx,r*.38);c.stroke();}c.fillStyle='#a2b4bb';round(c,-r*.19,-r*.7,r*.38,r*1.4,r*.1);c.fill();c.strokeStyle='#d0e3e8';c.lineWidth=r*.1;c.beginPath();c.ellipse(0,0,r*.56,r*.26,0,0,7);c.stroke();circle(c,0,0,r*.13,'#b1ebef');c.restore();return;
 }
 if(id==='asteroid-belt'){
  circle(c,x,y,r,'#0a2030','#5d7b8c');for(let i=0;i<8;i++){const a=i*2.399,rr=r*(.18+(i%3)*.22),px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr,rad=r*(i%2?.19:.25);c.beginPath();for(let j=0;j<6;j++){const ang=j/6*Math.PI*2,l=rad*(j%2?.8:1.1);j?c.lineTo(px+Math.cos(ang)*l,py+Math.sin(ang)*l):c.moveTo(px+Math.cos(ang)*l,py+Math.sin(ang)*l);}c.closePath();c.fillStyle=i%2?'#897c6c':'#bcaa8b';c.fill();c.strokeStyle='#d6c6a5';c.lineWidth=2;c.stroke();}return;
 }
 if(!id){c.save();c.setLineDash([7,10]);c.lineWidth=3;circle(c,x,y,r,'#102d41','#6a9aaf');c.restore();drawIcon(c,'plus',x,y,r*.75,{color:'#c2dbe6'});return;}
 if(id==='saturn'){c.strokeStyle='#cfba90';c.lineWidth=r*.18;c.beginPath();c.ellipse(x,y,r*1.42,r*.38,-.28,0,Math.PI*2);c.stroke();}
 const colors={earth:'#4c9ac9',mercury:'#9e9b93',venus:'#d4b66b',moon:'#aeb2b0',mars:'#b85f43',jupiter:'#c6aa89',saturn:'#d2bf91',uranus:'#8bc0cb',neptune:'#3660ba'};
 c.save();circle(c,x,y,r,null);c.clip();c.fillStyle=colors[id]||'#5b8598';c.fillRect(x-r,y-r,r*2,r*2);
 if(thumbs[id])c.drawImage(thumbs[id],x-r*1.6,y-r,r*3.2,r*2);
 if(id==='moon')for(let i=0;i<12;i++){const a=i*2.399,rr=r*(.2+(i%4)*.17);circle(c,x+Math.cos(a)*rr,y+Math.sin(a)*rr,r*(.05+(i%3)*.025),'#6e777b99','#d8dcda55');}
 const shade=c.createRadialGradient(x-r*.35,y-r*.35,0,x+r*.15,y+r*.1,r*1.3);shade.addColorStop(0,'#e7f7ff12');shade.addColorStop(.58,'#02070b00');shade.addColorStop(.91,'#02070b99');shade.addColorStop(1,'#02070be6');c.fillStyle=shade;c.fillRect(x-r,y-r,r*2,r*2);c.restore();c.lineWidth=2;circle(c,x,y,r,null,'#c2e8ef77');
}
function gauge(c,icon,value,max,x,y,width,color){
 drawIcon(c,icon,x+38,y+14,62,{color,accent:'#eaffff',ink:'#0c2533'});
 const filled=Math.max(0,Math.min(10,Math.ceil(value/Math.max(1,max)*10))),start=x+90,unit=(width-122)/10;
 for(let i=0;i<10;i++){c.fillStyle=i<filled?color:'#385565';round(c,start+i*unit,y-11,unit-7,39,5);c.fill();}
 label(c,String(value),x+width-34,y+59,32,'#cbe1e9','right');label(c,icon==='fuel'?'燃料':'護盾',x+90,y+59,24,'#7d9fb0','left');
}
export function paintMission(c,w,h,state,thumbs){
 surface(c,w,h,'mission','探索任務');
 const active=!!state.targetId,cardX=w*.2,planetX=w*.76,centerY=h*.37;
 circle(c,cardX,centerY,104,'#163b4c','#5b9c9e');drawIcon(c,'mission',cardX,centerY,150,{color:active?'#a4f1cf':'#8baebc',accent:'#f4ce88',ink:'#183746'});
 c.save();c.setLineDash([8,12]);c.strokeStyle=active?'#b5d5df':'#4a6f83';c.lineWidth=4;c.beginPath();c.moveTo(cardX+125,centerY);c.bezierCurveTo(w*.43,centerY-55,w*.49,centerY-55,planetX-135,centerY);c.stroke();c.restore();drawIcon(c,'jump',w*.48,centerY-7,70,{color:active?'#f4d49b':'#688a9b',accent:'#d3edf4',ink:'#153142'});
 drawPlanet(c,state.targetId,planetX,centerY,110,thumbs);
 const destination=active?state.target.replace(/\s*\(.+?\)/,''):'選一顆星球';label(c,destination,planetX,centerY+146,35,'#d5e5e9');label(c,active?'任務已接收':'點一下接任務',cardX,centerY+146,27,'#8fbfbf');
 if(active){const title=String(state.mission).replace(/^\S*\s/,'');label(c,title.slice(0,20),w/2,h*.69,23,'#6e94a8');}
 c.fillStyle='#6c98a733';c.fillRect(40,h-146,w-80,2);
 gauge(c,'fuel',state.fuel,state.fuelMax,40,h-99,w*.46,state.fuel<20?'#ed9a73':'#a2ddbc');
 gauge(c,'shield',state.shield,state.shieldMax||100,w*.51,h-99,w*.45,'#90cbec');
}
export function paintRadar(c,w,h,state,t=0){
 surface(c,w,h,'scan','雷達');const cx=w*.49,cy=h*.55,r=h*.365;
 c.strokeStyle='#547e92';c.lineWidth=2;for(let i=1;i<=4;i++){c.beginPath();c.arc(cx,cy,r*i/4,0,Math.PI*2);c.stroke();}
 c.strokeStyle='#3c6378';for(let i=0;i<8;i++){const a=i/8*Math.PI*2;c.beginPath();c.moveTo(cx+Math.cos(a)*r*.1,cy+Math.sin(a)*r*.1);c.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);c.stroke();}
 const a=t*.00045;c.beginPath();c.moveTo(cx,cy);c.arc(cx,cy,r,a-.65,a);c.closePath();c.fillStyle='#8ee6d52a';c.fill();c.strokeStyle='#b3e6dc';c.lineWidth=4;c.beginPath();c.moveTo(cx,cy);c.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);c.stroke();
 for(let i=0;i<5;i++){const b=i*2.399,rr=r*(.24+(i%3)*.23),x=cx+Math.cos(b)*rr,y=cy+Math.sin(b)*rr;circle(c,x,y,i===2?11:7,i===2?'#efd1a0':'#b8e8da');circle(c,x,y,18,null,i===2?'#efd1a055':'#b8e8da33');}
 drawIcon(c,'ship',cx,cy,49,{color:'#deeff7',ink:'#193e51',accent:'#93ccd9'});const danger=/警告|戰鬥/.test(state.threat||'');drawIcon(c,danger?'warning':'shield',w-99,150,76,{color:danger?'#f4a17c':'#9cddbd',ink:'#183e46'});label(c,'360°',w-99,h-65,26,'#719db1');
}
export function paintSystems(c,w,h,state,t=0){
 surface(c,w,h,'ship','船體檢查');const cx=w/2,cy=h*.52;
 c.strokeStyle='#83b8cc18';c.lineWidth=2;circle(c,cx,cy,h*.34,null,'#83b8cc20');circle(c,cx,cy,h*.24,null,'#83b8cc18');
 c.save();c.translate(cx,cy);const hull=c.createLinearGradient(-110,0,110,0);hull.addColorStop(0,'#567786');hull.addColorStop(.5,'#aac0c3');hull.addColorStop(1,'#5d7985');c.fillStyle=hull;c.strokeStyle='#d1e3e5';c.lineWidth=3;c.beginPath();c.moveTo(0,-205);c.lineTo(49,-82);c.lineTo(57,-26);c.lineTo(205,91);c.lineTo(205,115);c.lineTo(61,77);c.lineTo(61,148);c.lineTo(-61,148);c.lineTo(-61,77);c.lineTo(-205,115);c.lineTo(-205,91);c.lineTo(-57,-26);c.lineTo(-49,-82);c.closePath();c.fill();c.stroke();
 c.fillStyle='#285b75';c.beginPath();c.moveTo(0,-172);c.quadraticCurveTo(35,-123,27,-72);c.lineTo(-27,-72);c.quadraticCurveTo(-35,-123,0,-172);c.fill();c.strokeStyle='#8bd4e5';c.beginPath();c.moveTo(0,-155);c.lineTo(0,-77);c.stroke();
 for(const side of [-1,1]){c.fillStyle='#224252';c.beginPath();c.moveTo(side*71,15);c.lineTo(side*173,91);c.lineTo(side*73,65);c.closePath();c.fill();for(let j=0;j<3;j++){c.strokeStyle='#77a2b3';c.beginPath();c.moveTo(side*(77+j*23),24+j*17);c.lineTo(side*(77+j*23),67+j*6);c.stroke();}c.fillStyle='#3b5665';round(c,side<0?-85:57,-59,28,62,5);c.fill();}
 for(const x of [-42,0,42]){circle(c,x,144,17,'#1b3b4c','#c4d6d7');circle(c,x,145,10,'#85cfe5');}circle(c,0,-21,19,'#395463','#c1d2d3');c.restore();
 const slots=[['engine',cx,h*.87,cx,cy+140],['weapons',w*.14,h*.38,cx-70,cy-40],['radar',w*.84,h*.24,cx,cy-25],['fuel',w*.14,h*.77,cx-34,cy+52],['radiator',w*.86,h*.7,cx+131,cy+62]];
 for(const [system,x,y,px,py]of slots){const action=system==='radar'?'scan':system;const damaged=state.damage.some(d=>d.system===system)||(system==='engine'&&state.engineFailed),color=damaged?'#f6a17f':iconPalette[action].color;
  c.strokeStyle=damaged?'#e28f6d':'#477c96';c.lineWidth=3;c.beginPath();c.moveTo(x,y);c.lineTo(px,py);c.stroke();circle(c,px,py,8,damaged?'#f6a17f':'#9ed7d5');
  circle(c,x,y,61,damaged?'#4e2d28':'#15384c',damaged?'#e9a084':'#648fa4');drawIcon(c,action,x,y,75,{color,accent:'#effaff',ink:'#173347'});
  drawIcon(c,damaged?'warning':'check',x+45,y-47,31,{color:damaged?'#ffba8e':'#a3d8b8',ink:'#173347'});label(c,iconPalette[action].label,x,y+80,23,damaged?'#e5ad91':'#658da1');
 }
}
