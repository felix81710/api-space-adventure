// Shared, code-native pictograms for the 3D console and its touch menu.
// Shapes and colors identify actions together; text is only a parent-facing aid.
export const iconPalette={
 mission:{color:'#9af1d3',cap:'#224c4d',label:'任務'},
 map:{color:'#a9d7ff',cap:'#2a4264',label:'星圖'},
 scan:{color:'#8de4f5',cap:'#204c60',label:'雷達'},
 weapons:{color:'#ffb58f',cap:'#55382f',label:'武器'},
 jump:{color:'#fff0c5',cap:'#95723c',label:'出發'},
 ship:{color:'#bbdfea',cap:'#294755',label:'檢修'},
 fuel:{color:'#b2eab9',cap:'#2c4c3b',label:'補給'},
 engine:{color:'#d5c4ff',cap:'#403b5a',label:'引擎'},
 shield:{color:'#a2d9ff',cap:'#2a455b',label:'護盾'},
 economy:{color:'#b9e6b7',cap:'#2d4d3e',label:'節能'},
 radiator:{color:'#a5dbed',cap:'#2a4a5a',label:'散熱'}
};
const layer=(d,fill='none',stroke='main',width=1.7)=>({d,fill,stroke,width});
const shapes={
 salvage:[layer('M12 2v6m-5-2 5 3 5-3M7 7l-4 6 3 6m11-12 4 6-3 6M6 19l3-3m9 3-3-3','none','main',2),layer('M9 12h6v8H9z','accent','none'),layer('M10 22h4','none','main',1.5)],
 boost:[layer('M13 1L4 14h7l-1 9 10-14h-7z','main','none'),layer('M2 4l3-3m15 19 3-3','none','accent',1.6)],
 training:[layer('M18 12a7 7 0 1 1-14 0 7 7 0 0 1 14 0','none','main',1.8),layer('M14 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0','none','main',1.6),layer('M11 12l9-9m-1 0h3v3m-2-3v4h-4','none','accent',2),layer('M5 19l-2 3m14-3 2 3M11 10v4m-2-2h4','none','main',1.5)],
 cargo:[layer('M4 5h16v13H4z','main','none'),layer('M10 5h4v13h-4z','accent','none'),layer('M1 9h3m16 0h3M7 21h3m4 0h3','none','main',1.8),layer('M6 8h2m8 0h2M6 15h2m8 0h2','none','ink',1.2)],
 station:[layer('M8 8h8v9H8z','main','none'),layer('M1 7h5v11H1zm17 0h5v11h-5z','main','none'),layer('M12 1v6m-3-3h6M8 20h8','none','accent',1.5),layer('M10 10h4v4h-4z','ink','none')],
 games:[layer('M7 6h10c4 0 6 9 4 12-1 2-4-2-6-2H9c-2 0-5 4-6 2C1 15 3 6 7 6z','main','none'),layer('M7 9v6m-3-3h6','none','ink',1.7),layer('M16 10h.1m3 3h.1','none','ink',2.8)],
 drone:[layer('M12 6l4 3 7-2-2 10-5-2-4 4-4-4-5 2L1 7l7 2z','main','none'),layer('M8 10h8v4H8z','ink','none'),layer('M10 12h4M3 4l2-2m16 2-2-2','none','accent',1.6)],
 combo:[layer('M13 1L4 14h7l-1 9 10-14h-7z','main','none')],
 meteor:[layer('M8 2l10 2 5 8-5 10-11 1-6-9z','main','none'),layer('M6 9l4-2 4 3-1 5-5 1-3-3z','ink','none'),layer('M17 5l3 6m-6 7 4-2M4 5L1 2','none','accent',1.5)],
 mission:[layer('M6 4h3V2h6v2h3v17H6z','main','none'),layer('M9 4h6v3H9z','ink','none'),layer('M12 9l1.2 2.4 2.7.4-2 1.9.5 2.7-2.4-1.3-2.4 1.3.5-2.7-2-1.9 2.7-.4z','accent','none'),layer('M9 18h6','none','ink',1.1)],
 map:[layer('M18.4 11.8a6.4 6.4 0 1 1-12.8 0 6.4 6.4 0 0 1 12.8 0','main','none'),layer('M7 8c3 0 1.5 3 4 3s1 4 3 5','none','ink',1.2),layer('M4.5 9.8C-2 15.5 2.5 19.4 13 15.3S25 6 18.3 7.8','none','accent',1.8),layer('M20 2v3m-1.5-1.5h3','none','accent',1.3)],
 scan:[layer('M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0'),layer('M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0','none','main',1),layer('M12 3v9l6.4-6.4','none','accent',2),layer('M12 12L12 3A9 9 0 0 1 18.4 5.6z','accent','none'),layer('M8 14a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3','main','none'),layer('M17 13a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2','main','none')],
 jump:[layer('M12 1.5c4 3.6 5.2 7.9 4 13H8c-1.2-5.1 0-9.4 4-13z','main','none'),layer('M8 10l-4 4v5l5-3m7-6 4 4v5l-5-3','accent','none'),layer('M14 7.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0','ink','none'),layer('M9.5 18l2.5 5 2.5-5','accent','none'),layer('M2 3l1.5 2M22 3l-1.5 2','none','accent',1.2)],
 weapons:[layer('M5 4h4v11H5zm10 0h4v11h-4z','main','none'),layer('M3 14h18v5H3zM7 19h10v3H7z','main','none'),layer('M7 1v3m10-3v3','none','accent',2.2),layer('M9 16h6','none','ink',1.6)],
 fuel:[layer('M7 3h10v3h2v15H5V6h2z','main','none'),layer('M12 7c-1.2 2-3.3 4.2-3.3 6a3.3 3.3 0 0 0 6.6 0c0-1.8-2.1-4-3.3-6z','ink','none'),layer('M7 18h10','none','accent',1.2)],
 ship:[layer('M11 1l3 8 7 6v3l-8-2-2 5-2-5-8 2v-3l7-6z','main','none'),layer('M11 5l1.4 5H9.6z','ink','none'),layer('M18 15l-4 5m4-5a3.2 3.2 0 0 0 4-3.6l-2 1-1-1 1-2A3.2 3.2 0 0 0 18 15','none','accent',1.7)],
 engine:[layer('M6 3h12v4H6zM5 8h14v8H5z','main','none'),layer('M3 10H1m22 0h-2M3 14H1m22 0h-2','none','main',1.6),layer('M9 9h6v6H9z','ink','none'),layer('M6 18l2 4 2-4m4 0 2 4 2-4','accent','none')],
 radiator:[layer('M10 5h4v15h-4z','main','none'),layer('M2 7h6v11H2zm14 0h6v11h-6z','main','none'),layer('M5 7v11m-3-7h6m-6 4h6m11-8v11m-3-7h6m-6 4h6','none','ink',1),layer('M9 3l1-2m4 2-1-2','none','accent',1.5)],
 economy:[layer('M20 3C8 1 2 8 6 15c6 6 14-1 14-12z','main','none'),layer('M4 21L16 8','none','accent',2),layer('M9 12l-1-4m5 1 4 1','none','ink',1)],
 shield:[layer('M12 2l9 3v6c0 5-4 9-9 12-5-3-9-7-9-12V5z','main','none'),layer('M8 12l3 3 5-6','none','ink',2.3)],
 check:[layer('M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0','main','none'),layer('M8 12l3 3 5-6','none','ink',2)],
 warning:[layer('M12 2L23 21H1z','main','none'),layer('M12 8v6m0 3v1','none','ink',2)],
 lock:[layer('M7 10V7a5 5 0 0 1 10 0v3'),layer('M4 10h16v12H4z','main','none'),layer('M12 14v4','none','ink',2)],
 reset:[layer('M5 3H2v5m17-5h3v5M2 16v5h5m15-5v5h-5'),layer('M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0'),layer('M12 9v6m-3-3h6','none','accent',1.2)],
 menu:[layer('M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z','main','none')],
 dashboard:[layer('M2 4h20v15H2z'),layer('M5 7h7v5H5z','main','none'),layer('M15 8h4m-4 4h4M5 15h14','none','accent',1.7),layer('M8 22h8m-4-3v3')],
 sound:[layer('M2 9h5l6-5v16l-6-5H2z','main','none'),layer('M17 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14','none','accent',1.7)],
 muted:[layer('M2 9h5l6-5v16l-6-5H2z','main','none'),layer('M17 9l6 6m0-6-6 6','none','accent',2)],
 light:[layer('M17 9c0 3-2 4-2 7H9c0-3-2-4-2-7a5 5 0 0 1 10 0','main','none'),layer('M10 19h4m-3 3h2M12 0v2M2 8h2m16 0h2M4 2l2 2m12 0 2-2','none','accent',1.7)],
 screw:[layer('M7 2h10v5H7zM9 8h6v11l-3 4-3-4z','main','none'),layer('M8 12l8-2m-8 6 8-2m-7 6 6-2','none','ink',1.2)],
 crystal:[layer('M6 3h12l5 7-11 13L1 10z','main','none'),layer('M6 3l3 7 3-7 3 7 3-7M1 10h22M9 10l3 13 3-13','none','ink',1)],
 drag:[layer('M3 12h18m-4-4 4 4-4 4M7 8l-4 4 4 4','none','main',2)],
 plus:[layer('M12 4v16M4 12h16','none','main',2.5)]
};
const role=(name,color,accent,ink)=>name==='none'?'none':name==='main'?color:name==='accent'?accent:ink;
export function drawIcon(ctx,name,x,y,size,{color='#b8e5f2',accent='#ffffff',ink='#102b3a',alpha=1}={}){
 ctx.save();ctx.translate(x-size/2,y-size/2);ctx.scale(size/24,size/24);ctx.globalAlpha*=alpha;ctx.lineCap='round';ctx.lineJoin='round';
 for(const p of shapes[name]||shapes.ship){const path=new Path2D(p.d);if(p.fill!=='none'){ctx.fillStyle=role(p.fill,color,accent,ink);ctx.fill(path);}if(p.stroke!=='none'){ctx.strokeStyle=role(p.stroke,color,accent,ink);ctx.lineWidth=p.width;ctx.stroke(path);}}
 ctx.restore();
}
export function iconSvg(name){return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">'+(shapes[name]||shapes.ship).map(p=>'<path d="'+p.d+'" fill="'+role(p.fill,'currentColor','var(--icon-accent, #ecf8ff)','var(--icon-ink, #173345)')+'" stroke="'+role(p.stroke,'currentColor','var(--icon-accent, #ecf8ff)','var(--icon-ink, #173345)')+'" stroke-width="'+p.width+'" stroke-linecap="round" stroke-linejoin="round"/>').join('')+'</svg>';}
