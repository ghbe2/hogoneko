const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('game-v022.js','utf8').split('let quickHoldRelease')[0];let handler;
class Element{constructor(inGame,editable){this.inGame=inGame;this.editable=editable;}closest(selector){return selector==='#app'?this.inGame:this.editable;}}
vm.runInNewContext(source,{Element,window:{addEventListener(type,fn){if(type==='contextmenu')handler=fn;}}});
for(const [label,inGame,editable,expected]of[['button',true,false,true],['new modal after hold',true,false,true],['room background',true,false,true],['name input',true,true,false],['outside game',false,false,false]]){let prevented=false;handler({target:new Element(inGame,editable),preventDefault(){prevented=true;},stopImmediatePropagation(){}});assert.equal(prevented,expected,label);}
console.log('PASS context menu suppression across game and modal; text editing preserved');
