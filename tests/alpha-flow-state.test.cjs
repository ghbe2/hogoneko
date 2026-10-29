// State-level review only: no browser, rendering, or simulated screenshots.
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const context = vm.createContext({assert, console, Date, Math, Number});
vm.runInContext(`
let now = new Date(2026,9,29,12).getTime();
const CONFIG={stage1:{campaign:{}}};
const gameNow=()=>now, getCat=s=>s.cats[0];
const syncRealTime=s=>s, pendingFamilyLetter=s=>s.letter||null;
const isGraduationReady=()=>true, splitGuideText=t=>[t];
let surgeryEligibility, pendingVisit, reconcileVisit;
let reduceGameState=(s,a)=>{
 if(a.type==='OPEN_OUTING')return {...s,campaign:{...s.campaign,phase:'town'}};
 if(a.type==='OPEN_NOTEBOOK')return {...s,ui:{...s.ui,modal:'notebook'}};
 if(a.type==='TEST_ARRIVE')return {...s,campaign:{...s.campaign,phase:'shop',shopId:'clinic'}};
 if(a.type==='TEST_HOME')return {...s,campaign:{...s.campaign,phase:'room'}};
 if(a.type==='TEST_PAY')return {...s,coins:-2};
 if(a.type==='FAMILY_CLOSE'&&s.letter?.claimed)return {...s,letter:null};
 return s;
};
function fresh(day=1){return {coins:20,cats:[{id:'first',status:'raising',age:'adult',initialAge:'adult',body:{days:day-1,weight:2200,foodLevel:2,litter:0,vomit:0},surgery:null}],campaign:{phase:'room'},onboarding:{homeTour:'done'},ui:{modal:null},alpha:{firstCatId:'first',seen:{}},album:[]};}
let gameState=fresh();
`, context);
const care = fs.readFileSync('game-care-plan.js','utf8');
vm.runInContext(care.slice(0,care.indexOf('const carePlanRender=')),context);
const alpha = fs.readFileSync('game-alpha-meeting.js','utf8');
vm.runInContext(alpha.slice(alpha.indexOf('const ALPHA_DAY='),alpha.indexOf('const PAW_COIN=')),context);
vm.runInContext(alpha.slice(alpha.indexOf('function alphaFirst('),alpha.indexOf('// Retain the delayed fallback')),context);
vm.runInContext(`
// Daily notices: one basic message per calendar day, no second-cat replay.
let s=fresh();assert.equal(alphaLesson(s)[0],'food');
s=reduceGameState({...s,ui:{alphaNotice:{key:'food',text:'food'}}},{type:'ALPHA_NOTICE_NEXT'});
assert.equal(alphaLesson(s),undefined);
now+=86400000;s.cats[0].body.days=1;assert.equal(alphaLesson(s)[0],'taste');
s.alpha.seen.taste=true;s.alpha.lastMessageDay=ALPHA_DAY();assert.equal(alphaLesson(s),undefined);
now+=86400000;s.cats[0].body.days=2;assert.equal(alphaLesson(s)[0],'reward');
s.alpha.firstCatId='previous';assert.equal(alphaLesson(s),null);
console.log('PASS daily messages, same-day suppression, second-cat exclusion');

// Booking is possible on day 4 for surgery on day 5; fasting starts only on booking.
s=fresh(3);assert.equal(surgeryEligibility(s).canBook,false);
s=fresh(4);assert.equal(surgeryEligibility(s).canBook,true);
assert.equal(alphaLesson(s)[0],'ready');
s.ui.modal='notebook';s=reduceGameState(s,{type:'ASK_SURGERY_BOOKING'});
s=reduceGameState(s,{type:'BOOK_SURGERY'});
assert.equal(carePlan(getCat(s)).surgeryDay,5);
assert.equal(getCat(s).body.foodLevel,0);assert.equal(getCat(s).body.surgeryFoodStored,2);
assert.equal(alphaGoal(s).key,'surgery');
s=reduceGameState(s,{type:'CANCEL_CARE_SURGERY'});
assert.equal(getCat(s).body.foodLevel,2);assert.equal(getCat(s).body.surgeryFoodStored,undefined);
assert.equal(surgeryEligibility(s).canBook,true);
s.ui.careBookingOpen=true;s=reduceGameState(s,{type:'BOOK_SURGERY'});
s.cats[0].body.days=4;s.ui.modal=null;s.ui.alphaNotice=null;
assert.equal(surgeryEligibility(s).ready,true);assert.equal(alphaLesson(s)[0],'surgery:5');
let under=JSON.parse(JSON.stringify(s));under.cats[0].body.weight=1990;
under=reduceGameState(under,{type:'START_SURGERY'});
assert.equal(carePlan(getCat(under)).surgeryDay,null);assert.equal(getCat(under).body.foodLevel,2);
let missed=JSON.parse(JSON.stringify(s));missed.cats[0].body.days=5;
missed=applySurgeryFasting(missed);assert.equal(carePlan(getCat(missed)).surgeryDay,null);
assert.equal(getCat(missed).body.foodLevel,2);
console.log('PASS day-4 booking, day-5 eligibility, cancellation, low weight, missed appointment, restored food');

// Actual completion date, rather than a fixed calendar day, controls the event.
for(const surgeryDay of [5,8,12]){
 let n=fresh(surgeryDay);n.cats[0].surgery={status:'done',completedDay:surgeryDay};
 n.cats[0].body.surgeryFoodStored=2;n.cats[0].body.foodLevel=0;
 n=applySurgeryFasting(n);assert.equal(getCat(n).body.foodLevel,2);
 assert.equal(carePlan(getCat(n)).eventDay,surgeryDay+2);
 n.alpha.seen={food:true,taste:true,reward:true,ready:true};
 n.cats[0].body.days=surgeryDay;assert.equal(alphaLesson(n)[0],'eve:'+(surgeryDay+2));
 n.cats[0].body.days=surgeryDay+1;assert.equal(alphaLesson(n)[0],'event:'+(surgeryDay+2));
 assert.equal(alphaGoal(n).days,0);
}
console.log('PASS surgery food recovery, delayed-surgery event timing, eve and event notices');

// Travel guidance must end on arrival and stay gone on a later independent trip.
s=fresh();s.alpha.firstCatId='previous';
s=reduceGameState(s,{type:'ALPHA_ROUTE',route:'alpha-clinic'});
assert.equal(s.ui.alphaDestination,'clinic');
s=reduceGameState(s,{type:'TEST_ARRIVE'});assert.equal(s.ui.alphaDestination,null);
s=reduceGameState(s,{type:'TEST_HOME'});s=reduceGameState(s,{type:'OPEN_OUTING'});
assert.equal(s.ui.alphaDestination,null);
console.log('PASS map destination cleared after arrival and on later outings');

// The album prompt requires actually closing a claimed letter.
s=fresh();s.alpha.firstCatId='previous';
s=reduceGameState(s,{type:'FAMILY_CLOSE'});assert(!s.ui.alphaAlbumPrompt);
s.letter={claimed:false};s=reduceGameState(s,{type:'FAMILY_CLOSE'});assert(!s.ui.alphaAlbumPrompt);
s.letter.claimed=true;s=reduceGameState(s,{type:'FAMILY_CLOSE'});assert(s.ui.alphaAlbumPrompt);
s=reduceGameState(s,{type:'ALPHA_ALBUM_DONE'});assert.equal(s.ui.modal,'notebook');assert.equal(s.ui.alphaAlbumPrompt,false);
s=fresh();s.alpha.firstCatId='previous';s.campaign={phase:'shop',shopId:'clinic'};
s=reduceGameState(s,{type:'TEST_PAY'});assert.equal(s.ui.alphaNotice.key,'debt');
console.log('PASS letter claim/close/album progression and medical-debt explanation');
`,context);
