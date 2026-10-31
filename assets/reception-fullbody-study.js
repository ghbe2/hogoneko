'use strict';
// Preview only: retain the complete production upper body, append below the counter.
function completeReceptionBody(svg){
 const staff=svg.querySelector('.reception-staff');
 const lower=document.createElementNS('http://www.w3.org/2000/svg','g');
 lower.setAttribute('class','reception-lower-study');
 lower.innerHTML=`
 <path d="M292 339H320L317 424H295Z" fill="#cea487"/>
 <path d="M342 339H369L365 424H344Z" fill="#c69c80"/>
 <path d="M294 418Q305 424 317 418L319 432Q312 437 290 434L286 430Z" fill="#655f51"/>
 <path d="M344 418Q355 424 365 418L374 428Q377 434 367 435H343Z" fill="#655f51"/>
 <path d="M286 272H373Q380 299 379 347Q330 352 280 347Q279 300 286 272Z" fill="#758b80"/>
 <path d="M331 293L332 346" fill="none" stroke="#687e74" stroke-width="1.5"/>
 <path d="M281 344Q330 348 378 344" fill="none" stroke="#879d90" stroke-width="1.5"/>`;
 const abdomen=document.createElementNS('http://www.w3.org/2000/svg','g');
 abdomen.setAttribute('class','reception-abdomen-study');
 abdomen.innerHTML=`<path d="M274 220L383 220L386 234Q378 251 375 267L378 284Q354 289 330 285Q307 290 280 284L283 266Q279 248 272 233Z" fill="#91a69a"/>
 <path d="M329 235V274L324 286" fill="none" stroke="#7f958a" stroke-width="1.5"/>
 <circle cx="329" cy="250" r="1.7" fill="#e6ebda"/><circle cx="329" cy="268" r="1.7" fill="#e6ebda"/>
 <path d="M288 263L307 265M351 265L370 263" fill="none" stroke="#7f958a" stroke-width="1.5"/>`;
 // The original art ends at the counter, above the waist. Extend the jacket
 // behind that edge, and use its existing breathing joint to keep the seam closed.
 (staff.querySelector('.actor-breath')||staff).prepend(abdomen);
 // Legs are stationary while the original torso's small breath motion is preserved.
 staff.prepend(lower);
 return svg;
}
