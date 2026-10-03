'use strict';
// UI contract: play scenes fit one viewport. Only growing collections scroll.
const fitStyle=document.createElement('style');fitStyle.textContent=`
.campaign-scroll{overflow:visible;display:flex;flex-direction:column;gap:12px;padding:16px;min-height:0}
.campaign-scroll>*{flex-shrink:0}
#app:has(.modal-layer,.release-overlay) .debug-quickbar,#app:has(.modal-layer,.release-overlay) .screen-guide,.campaign-frame:has(.clinic-sequence,.naming-scene) .screen-guide,.campaign-frame:has(.clinic-sequence,.naming-scene) .debug-quickbar{display:none}
.notebook-overview .nickname-card{display:none}
.notebook-overview .notebook-scroll{grid-template-rows:auto auto auto minmax(60px,1fr)}.notebook-overview .identity-chips span{font-size:10px}.notebook-overview .cat-days,.notebook-overview .heart-visual small,.notebook-overview .body-chart-head small,.notebook-overview .photo-section h3{font-size:10px}.notebook-overview .weight-canvas{height:70px}.notebook-overview .body-chart svg{height:56px}.notebook-overview .chart-days{font-size:9px}.notebook-overview .photo-strip{height:60px}.notebook-overview .mini-photo{height:58px}
.campaign-scroll>.field-scene,.campaign-scroll>.capture-inspect,.campaign-scroll>.graduation-stage,.campaign-scroll>.result-scene{flex:1;min-height:100px;height:auto!important;margin:0}
.campaign-scroll>.clinic-sequence,.campaign-scroll>.naming-scene{flex:1;min-height:0;height:100%;display:flex;flex-direction:column;justify-content:center;padding:0;gap:14px}
.storybook .clinic-sequence>.exam-room{height:100%;min-height:0;aspect-ratio:auto;flex:1;background-size:contain!important;background-repeat:no-repeat}
.clinic-summary-card{width:100%;height:100%;min-height:0;display:flex;flex-direction:column}
.storybook .clinic-summary-card>.diagnosis-visual{flex:1;min-height:80px;max-height:240px;height:auto;aspect-ratio:auto;background-size:cover!important}
.diagnosis-copy{padding:12px 16px}.diagnosis-copy p{display:none}
.clinic-summary-receipt{padding:10px 16px}.clinic-summary-receipt h2{margin:0 0 8px;font-size:14px}.clinic-summary-receipt .receipt{padding:0}.clinic-summary-receipt .receipt-row{padding:6px 0}
.clinic-summary-card .diagnosis-copy{padding:10px 16px}.clinic-summary-card .clinic-summary-receipt{margin:0 12px 10px;padding:10px 12px}.clinic-summary-receipt .receipt-stamp{display:none}
.storybook .naming-scene>.naming-portrait{flex:1;width:100%;min-height:80px;max-height:420px;height:auto;aspect-ratio:auto;background-size:cover!important}
.naming-question h1{margin:6px 0;font-size:22px}.naming-input{flex:none;min-height:44px;font-size:18px}
.campaign-scroll>.result-copy{flex:none}.result-copy h1{font-size:22px;margin:4px 0}.result-copy p{margin:8px 0;line-height:1.7}
.campaign-scroll>.shop-sheet{display:flex;flex-direction:column;flex:1;min-height:0;gap:10px}.shop-sheet>.book-shop-scene{height:clamp(80px,18dvh,160px)!important;flex:none}.shop-sheet>.shop-products{overflow-y:auto;min-height:0;flex:1;touch-action:pan-y;align-content:start;padding:3px}
.release-shop-heading h1{margin:0;font-size:21px}.shop-sheet>.shop-notice{margin:0}
.surgery-sheet{min-height:0;margin:auto 0;gap:8px}.surgery-room{height:clamp(70px,18dvh,150px)}
.schedule-panel{display:flex;flex-direction:column;min-height:0}.schedule-scroll{flex:1;min-height:0;padding:4px 10px;overflow-y:auto}.schedule-panel>.schedule-actions{margin:0;padding:8px 10px 12px;flex:none}
.schedule-week{flex:none;display:grid;gap:4px;grid-template-rows:repeat(7,minmax(0,1fr))}.schedule-week .timeline-card{padding:4px 8px;min-height:0;display:flex;flex-direction:row;align-items:center;gap:8px}.schedule-week .timeline-card small{flex:0 0 53px;font-size:10px}.schedule-week .timeline-card strong{font-size:12px;margin:0}.schedule-week .timeline-card span{display:none}.schedule-week .timeline-card::before{top:50%;transform:translateY(-50%)}
.schedule-week .timeline-card.quiet{display:flex}.schedule-week .timeline-card.quiet small{font-size:10px}
.schedule-week .timeline-card:not(.quiet){display:grid;grid-template-columns:70px minmax(0,1fr);gap:0 8px}.schedule-week .timeline-card:not(.quiet) small{grid-row:span 2}.schedule-week .timeline-card:not(.quiet) span{display:block;font-size:10px;line-height:1.2;margin:0}
.surgery-cat{height:100%;width:100px;bottom:0}.surgery-cat .game-cat-svg{height:100%!important}
@media(max-height:650px){
 .notebook-overview .cat-days{display:none}.notebook-overview .weight-canvas{height:56px}.notebook-overview .body-chart svg{height:42px}.notebook-overview .photo-strip{height:44px}.notebook-overview .mini-photo{height:42px}
 .campaign-scroll{padding:12px;gap:10px}.campaign-actions{padding:8px 12px 12px;gap:8px}.campaign-button{min-height:44px;font-size:13px}
 .field-kit{gap:8px;padding:0}.field-kit .gear-card{min-height:60px;padding:6px}.field-kit .gear-card>span{font-size:24px}.field-kit .gear-card small{display:none}.field-kit .field-switch{min-height:36px;margin-top:3px}
 .surgery-sheet{gap:6px}.surgery-room{height:70px}.surgery-check{padding:5px 0}.surgery-sheet h1{margin:0;font-size:18px}.surgery-sheet .medical-footnote{display:none}
 .naming-scene{gap:10px!important}.naming-question h1{font-size:20px}.result-copy h1{font-size:20px}.result-copy p{font-size:12px}
 .wallet-sheet>p:not(.shop-notice){display:none}.wallet-sheet .ad-preview{padding:10px}.wallet-sheet .ad-preview>span{font-size:24px}
 .schedule-panel .sheet-head{padding:8px 12px}.schedule-panel .sheet-head>small{display:none}.schedule-panel .sheet-head h2{margin:0;font-size:18px}
}
`;document.head.append(fitStyle);
const beforeFitRender=render;
let fitScheduleDay=null;
render=function(state){
 const previousScroll=app.querySelector('.schedule-scroll'),previousTop=previousScroll?.scrollTop,today=getCat(state).body.days;
 beforeFitRender(state);
 const panel=app.querySelector('.schedule-panel'),scroll=panel?.querySelector('.schedule-scroll'),timeline=panel?.querySelector('.schedule-timeline');
 if(panel&&scroll&&timeline){
  const actions=scroll.querySelector('.schedule-actions');if(actions)panel.append(actions);
  if(!timeline.querySelector('.schedule-week')){
   const cards=[...timeline.children];for(let i=0;i<cards.length;i+=7){const week=document.createElement('section');week.className='schedule-week';cards.slice(i,i+7).forEach(card=>week.append(card));timeline.append(week);}
  }
  const available=scroll.clientHeight-8;timeline.querySelectorAll('.schedule-week').forEach(week=>{week.style.height=available+'px';week.style.gridTemplateRows=[...week.children].map(card=>card.classList.contains('quiet')?'minmax(0,1fr)':'minmax(0,2fr)').join(' ');});
  scroll.scrollTop=previousTop!==undefined&&fitScheduleDay===today?previousTop:scroll.scrollHeight;fitScheduleDay=today;
 }
};render(gameState);
