'use strict';
// Quiet cut-paper silhouettes. The player has no hair, gender or costume.
const roomCallingArt=`<svg viewBox="0 0 88 108" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
 <path d="M86 104H28Q27 80 42 71L52 66V56Q37 54 35 42L29 39 35 31Q35 14 51 10Q72 5 79 23Q86 42 69 54V65Q88 72 88 94Z" fill="#e9d8b6"/>
 <path d="M85 103H32Q31 83 48 76L59 69 64 67Q84 73 85 93Z" fill="#f5e6c8"/>
 <path d="M68 56Q82 47 80 30Q76 13 61 12Q43 11 39 27L38 34 33 39 40 42Q41 51 52 53L56 62 66 63Z" fill="#f5e6c8"/>
 <path d="M39 42h7" stroke="#79674e" stroke-width="1.8" stroke-linecap="round"/>
 <path d="M69 92Q64 97 58 91L38 70 27 58Q24 54 27 50L35 43Q39 40 41 43Q43 46 39 49L34 54 42 62 70 79Q77 85 69 92Z" fill="#f5e6c8"/>
 <path d="M34 54l6-5M42 62l19 17" fill="none" stroke="#c6ab82" stroke-width="1.4" stroke-linecap="round"/>
 <g class="call-voice" fill="none" stroke="#68816c" stroke-width="3" stroke-linecap="round"><path d="M24 32q-4 7 0 14"/><path d="M16 26q-8 13 0 26"/><path d="M8 20q-12 19 0 38"/></g>
</svg>`;
// The paper edge rotates within a fixed radius; the illustration stays upright.
function travelPaperFrame(){
 const points=Array.from({length:32},(_,i)=>{const a=i*Math.PI/16,r=i%2?40.5:44;return `${(54+Math.cos(a)*r).toFixed(2)},${(46+Math.sin(a)*r).toFixed(2)}`;}).join(' ');
 return `<g class="travel-frame"><polygon points="${points}" fill="#aab699"/></g><circle cx="54" cy="46" r="37" fill="#f5ebd2"/>`;
}
function roomHomeArt(){return `<svg viewBox="0 0 120 110" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${travelPaperFrame()}<defs><clipPath id="travel-home-window"><circle cx="54" cy="46" r="35"/></clipPath></defs><g clip-path="url(#travel-home-window)"><path d="M18 10H92V62H18Z" fill="#eee4ca"/><path d="M18 61H92V84H18Z" fill="#c6a376"/><path d="M18 61H92M18 72H92M35 62L31 84M71 62L76 84" stroke="#aa875f" stroke-width="1.3"/><path d="M27 23h22v29H27Z" fill="#a5bdb0" stroke="#fff6df" stroke-width="3"/><path d="M38 24v27M28 37h20" stroke="#fff6df" stroke-width="2"/><path d="M23 20h7l-2 34h-7ZM47 20h7l3 34h-8Z" fill="#bd876b"/><ellipse cx="66" cy="65" rx="18" ry="4" fill="#b39166" opacity=".5"/></g></svg>`;}
function roomMapArt(home){if(home)return roomHomeArt();return `<svg viewBox="0 0 120 110" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${travelPaperFrame()}<defs><clipPath id="travel-map-window"><circle cx="54" cy="46" r="35"/></clipPath></defs><g clip-path="url(#travel-map-window)">
 <path d="M18 11H54L43 81H18Z" fill="#dedfc1"/><path d="M54 11H91V81H43Z" fill="#e8ebd1"/>
 <path d="M15 65Q42 44 92 53M46 10Q42 42 58 83" fill="none" stroke="#fffaf0" stroke-width="6"/>
 <path d="M21 70Q46 50 87 59" fill="none" stroke="#c2cbaa" stroke-width="1.2"/>
 <g transform="translate(24 26)"><path d="M3 14L17 3 31 14V36H3Z" fill="#fff1d2"/><path d="M0 14L17 0 34 14 31 18 17 7 3 18Z" fill="#b47759"/><path d="M8 20h7v8H8Z" fill="#8eaa9c"/><path d="M21 22h6v14h-6Z" fill="#6e836a"/></g>
 <path d="M73 23c-7 0-11 5-11 11 0 8 11 17 11 17s11-9 11-17c0-6-4-11-11-11Z" fill="#6b856e"/><circle cx="73" cy="34" r="4.5" fill="#f5ebd2"/>
 <path d="M27 68l1-5 3 3 3-3-1 6M75 65l1-5 3 3 3-3-1 6" fill="#8a9e79"/>
 </g></svg>`;}
