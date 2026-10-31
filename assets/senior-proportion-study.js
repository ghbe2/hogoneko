'use strict';
// Preview only. The completed clinic receptionist is the proportional reference.
function fitSeniorToReception(svg){
 const upper=svg.querySelector('.senior-upper'),body=upper.querySelector('.actor-breath')||upper;
 const jacket=body.children[0],shirt=body.children[1];
 // Keep the authored head, neck, hands and companion cat. Give the torso an
 // abdomen below the held cat; the waist now sits at the receptionist's ratio.
 jacket.setAttribute('d','M91 98Q77 101 68 114Q61 125 61 143L60 175Q65 195 64 211L61 225Q82 231 109 225Q136 231 159 225L156 211Q155 193 160 175L158 143Q157 125 148 114Q139 101 126 98Z');
 shirt.setAttribute('d','M91 95L109 117L128 95L136 224Q109 231 82 224Z');
 const legs=svg.querySelector('svg>path');
 legs.setAttribute('d','M67 216H151L154 251L145 349H117L110 260L102 349H74L64 252Z');
 const details=document.createElementNS('http://www.w3.org/2000/svg','g');details.setAttribute('class','senior-lower-study');
 details.innerHTML='<path d="M110 238V260M75 345H102M117 345H145" fill="none" stroke="#656b59" stroke-width="1.5"/><path d="M74 347Q88 351 102 347L103 357H67Q64 352 74 347Z M117 347Q130 351 145 347L154 353Q156 358 148 358H116Z" fill="#655d4d"/>';
 legs.after(details);
 const shadow=svg.querySelector('ellipse');if(shadow)shadow.setAttribute('cy','359');
 if(body.classList.contains('actor-breath'))body.style.transformOrigin='109px 225px';
 svg.setAttribute('viewBox','0 0 220 370');return svg;
}
