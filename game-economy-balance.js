'use strict';
// Approved household budget: 8 coins per cat/day, 12 food servings per pack, 40 seconds per toy durability unit.
const CARE_BALANCE={dailyCoins:8,dailyAdCoins:4,familyCoins:10,toyWearMs:40000};
CONFIG.economy.discoveryCoins=CARE_BALANCE.dailyCoins;CONFIG.economy.adRewardCoins=CARE_BALANCE.dailyAdCoins;RELEASE_ECONOMY.ad=CARE_BALANCE.dailyAdCoins;
for(const product of SHOP_CATALOG)if(product.category==='food'&&!getItem(product.id)?.unlimited)product.quantity=12;
function toyPlayMillisecondsLeft(state,id){if(getItem(id)?.unlimited)return Infinity;const copies=Math.max(0,Number(state.inventory[id])||0),units=copies?getDurability(state,id)+Math.max(0,copies-1)*getMaxDurability(id):0;return Math.max(0,units*CARE_BALANCE.toyWearMs-(state.toyWearMs?.[id]||0));}
function wearToyForTime(state,id,milliseconds){
 if(getItem(id)?.unlimited)return {inventory:state.inventory,durability:state.durability,broken:false,toyWearMs:state.toyWearMs};
 const total=(state.toyWearMs?.[id]||0)+Math.min(toyPlayMillisecondsLeft(state,id),Math.max(0,milliseconds));let units=Math.floor(total/CARE_BALANCE.toyWearMs),next=state,broken=false;
 while(units-->0){const worn=wearToy(next,id);next={...next,inventory:worn.inventory,durability:worn.durability};broken=broken||worn.broken;}
 return {inventory:next.inventory,durability:next.durability,broken,toyWearMs:{...state.toyWearMs,[id]:next.inventory[id]?total%CARE_BALANCE.toyWearMs:0}};
}
const balancedBenefit=productBenefit;
productBenefit=id=>id==='food_kitten'?'子猫が食べやすいごはん。子猫の体重が増えやすく、大人には好まれにくいです。':getItem(id)?.kind==='hand'?'好きな玩具ほど短い時間でなかよしに。消耗は使用時間に応じます。':getFood(id)?'好物なら、同じ量でも体重が増えやすくなります。':balancedBenefit(id);
