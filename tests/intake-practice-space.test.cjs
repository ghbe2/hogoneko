const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context=vm.createContext({assert,Math,app:{clientWidth:320,clientHeight:520},roomPlacementBounds:()=>({floorTop:301.5263157894737,floorBottom:444}),furnitureHeight:id=>({box:84,bowl:45,water:45,litter:65}[id]),getRoom:s=>s.rooms[0],firstActive:()=>true});
const source=fs.readFileSync('game-first-activity.js','utf8');vm.runInContext(source.slice(0,source.indexOf('SHOP_CATALOG.push')),context);
vm.runInContext(`
const state={campaign:{phase:'intake'},onboarding:{guide:'moveFurniture'},rooms:[{floor:[{itemId:'bowl',x:16.25,y:58.461538461538474},{itemId:'water',x:33.75,y:75.38461538461539},{itemId:'litter',x:68.75,y:72.88461538461539},{itemId:'box',x:3.75,y:69.23076923076923}]}]};
assert(!intakeBoxCanMove(state.rooms[0].floor,intakePlacementFrame(state)));
const fixed=repairIntakePlacement(state);assert(intakeBoxCanMove(fixed.rooms[0].floor,intakePlacementFrame(fixed)));
for(let i=0;i<50;i++){let placed=[];for(const id of FIRST_FURNITURE){const pending=[id,...FIRST_FURNITURE.filter(n=>n!==id&&!placed.some(p=>p.itemId===n))],plan=planIntakeFurniture(state,placed,pending,true);assert(plan);placed.push(plan.find(p=>p.itemId===id));}const frame=intakePlacementFrame(state);assert(intakeBoxCanMove(placed,frame));assert(placed.every(p=>intakePositionClear(p,placed,frame)));}
`,context);
console.log('PASS blocked save repaired; 50 sequential layouts retain clear 24px box movement');
