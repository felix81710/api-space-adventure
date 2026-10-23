// Shared by the native game and the 3D control surface.
(()=>{
 const modes={
  economy:{label:'節能',icon:'economy',output:65,fuelMultiplier:.85,tempOffset:-200,stabilityOffset:0,color:'#9ae4b3',coreColor:'#43d9a1',spin:.65},
  standard:{label:'標準',icon:'engine',output:100,fuelMultiplier:1,tempOffset:0,stabilityOffset:0,color:'#9fdcff',coreColor:'#58bfff',spin:1},
  boost:{label:'高輸出',icon:'boost',output:130,fuelMultiplier:1.2,tempOffset:600,stabilityOffset:.8,color:'#ffd08c',coreColor:'#ffa759',spin:1.6}
 };
 for(const mode of Object.values(modes))Object.freeze(mode);
 window.ExplorerEngineModes=Object.freeze(modes);
})();
