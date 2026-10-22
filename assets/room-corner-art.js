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
function roomHomeArt(){return `<svg viewBox="0 0 120 110" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M0 0H105V55Q96 58 94 69L76 82 48 77 27 86 0 80Z" fill="#dac8a6"/><path d="M0 0H99V52L72 64 0 53Z" fill="#eee4ca"/><path d="M0 53L72 64 99 52V62L76 80 48 75 27 84 0 78Z" fill="#c6a376"/><path d="M0 53L72 64 99 52M24 58l-4 21M58 62l-9 13M0 68l79 6" fill="none" stroke="#aa875f" stroke-width="1.4"/><path d="M9 8h27v31H9Z" fill="#a5bdb0" stroke="#fff6df" stroke-width="4"/><path d="M22 9v28M10 24h24" stroke="#fff6df" stroke-width="2"/><path d="M4 3h8l-2 39H3ZM35 3h7l3 39h-9Z" fill="#bd876b"/><ellipse cx="65" cy="65" rx="27" ry="5" fill="#b39166" opacity=".5"/></svg>`;}
function roomMapArt(home){if(home)return roomHomeArt();return `<svg viewBox="0 0 120 110" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
 <path d="M0 0H104Q110 6 103 13L110 39Q111 44 105 47L80 58 63 82Q59 88 52 86L26 80 7 88Q1 91 0 85Z" fill="#b3bda0" opacity=".55"/>
 <path d="M0 0H96L102 37Q103 41 98 43L73 53 56 76 28 70 0 82Z" fill="#f5ebd2"/>
 <path d="M29 0L28 70 56 76 65 0Z" fill="#dedfc1"/><path d="M65 0L56 76 73 53 98 43 96 0Z" fill="#eef0d6"/>
 <path d="M0 54Q23 34 46 42T96 22M18 0Q20 22 45 42L57 65" fill="none" stroke="#fffaf0" stroke-width="8"/>
 <path d="M0 60Q23 40 46 48T98 28" fill="none" stroke="#c2cbaa" stroke-width="2"/>
 <path d="M28 3v64m36-64-8 69" stroke="#c5c5a8" stroke-width="1" opacity=".7"/>
 <g transform="translate(${home?'20 14':'9 8'})"><path d="M0 20L23 2 48 17 26 35Z" fill="#b47759"/><path d="M5 23L25 8 43 20V44L24 53 5 43Z" fill="#f9edcc"/><path d="M24 32L43 20V44L24 53Z" fill="#d2bb90"/><path d="M0 20L23 2 48 17 44 23 23 10 4 26Z" fill="#b47759"/><path d="M12 29h8v10h-8Z" fill="#8eaa9c"/><path d="M29 35l8-4v13l-8 4Z" fill="#6e836a"/><path d="M8 42l14 4" stroke="#ddc8a0" stroke-width="2"/></g>
 ${home?'':'<path d="M79 10c-10 0-15 7-15 14 0 11 15 22 15 22s15-11 15-22c0-7-5-14-15-14Z" fill="#6b856e"/><circle cx="79" cy="24" r="6" fill="#f5ebd2"/>'}
 <path d="M6 66l2-7 3 5 5-5-1 9M87 48l2-6 3 4 4-3-1 6" fill="#8a9e79"/>
</svg>`;}
