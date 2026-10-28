'use strict';
// Shared by the real game and the review page; no separate demo reactions.
const CAT_REACTIONS=Object.freeze({
 superMatch:{label:'超好き',pose:'knead',mood:'happy',description:'目を細めて、前足を交互に動かす。'},
 match:{label:'好き',pose:'sit',mood:'happy',description:'穏やかな表情で、こちらを見つめる。'},
 neutral:{label:'ふつう',pose:'sit',mood:'neutral',description:'落ち着いた姿勢で、様子をうかがう。'},
 dislike:{label:'嫌い',pose:'cower',mood:'wary',description:'体を低くして、警戒する。'},
 superDislike:{label:'超嫌い',pose:'alert',mood:'angry',description:'身構えて、強く拒む表情を見せる。'}
});
// Per-action choices, NOT three whole personality presets. Preference scores
// remain owned by the matchup table; this table only chooses visible behavior.
const CAT_BEHAVIOR_TYPES={
 human:['ひと','knead','settle','bat','eat','settle'],
 cat:['なかま','settle','sniff','hunt','eat','disengage'],
 friend:['ともだち','settle','sniff','bat','sniff','disengage'],
 prey:['えもの','sniff','sniff','pin','sniff','disengage'],
 touch:['ふれあい','knead','settle','bat','eat','disengage'],
 solo:['ひとり','settle','sniff','pin','sniff','disengage'],
 chase:['おいかけ','sniff','sniff','hunt','eat','disengage'],
 ambush:['まちぶせ','settle','sniff','pin','sniff','cower'],
 high:['たかいとこ','sniff','sniff','bat','eat','disengage'],
 hide:['かくれが','settle','sniff','pin','sniff','cower'],
 sun:['ひなた','settle','settle','bat','eat','disengage'],
 food:['ごはん','settle','sniff','bat','eat','disengage'],
 scent:['におい','sniff','sniff','pin','sniff','disengage'],
 scratch:['つめとぎ','settle','sniff','bat','sniff','disengage'],
 familiar:['いつもの','settle','sniff','bat','sniff','cower'],
 first:['はじめて','sniff','sniff','hunt','sniff','disengage']
};
const CAT_BEHAVIOR_PRIORITY={pet:['touch','human','solo','hide','cat','friend','sun','familiar','scent','first','ambush','prey','high','scratch','food','chase'],call:['human','solo','hide','familiar','friend','cat','first','scent','food','touch','sun','high','ambush','chase','prey','scratch'],play:['chase','ambush','prey','high','first','cat','hide','solo','scent','scratch','friend','touch','human','sun','familiar','food'],food:['food','scent','familiar','first','hide','solo','prey','friend','cat','human','touch','sun','high','chase','ambush','scratch']};
function catReactionPlan(types=[],affinity='neutral',operation='pet'){
 const op=['food','feed','water'].includes(operation)?'food':operation==='play'?'play':operation==='call'?'call':'pet';
 const priority=CAT_BEHAVIOR_PRIORITY[op],selected=priority.find(t=>types.includes(t))||'sun',row=CAT_BEHAVIOR_TYPES[selected];
 const level=['superMatch','match','neutral','dislike','superDislike'].indexOf(affinity),positive=level>=0&&level<=2;
 let pose=row[{pet:1,call:2,play:3,food:4}[op]],lead=null;
 const delay=[.15,.35,.65][Math.min(Math.max(level,0),2)];
 if(positive){if(op==='food'){lead=pose==='sniff'?'sniff':null;pose='eat';}else if(op==='play'){lead=pose==='pin'?'stalk':null;}else{lead=pose==='sniff'?'sniff':null;pose=['knead','settle','sniff'][level];}}
 else {pose=level===3?'avoid':row[5]==='cower'?'cower':'disengage';}
 const motion=positive&&['play','food'].includes(op)?`reaction${level}:${pose}`:pose;
 return {type:selected,operation:op,pose,motion,lead,delay,mood:positive?(level<2?'happy':'neutral'):'wary',voice:positive&&level<2&&op==='call'&&selected==='human'?'meow':'silent'};
}
function catAffinityPose(affinity,operation='pet',types=[]){const p=catReactionPlan(types,affinity,operation);return[p.motion,p.mood];}
