'use strict';
function visitorGroup(svg,cls,markup){const g=document.createElementNS('http://www.w3.org/2000/svg','g');g.setAttribute('class',cls);g.innerHTML=markup;return g;}
function fitVisitorBody(svg,child=false){
 svg.querySelectorAll('.adoption-companion').forEach(n=>n.remove());
 const torso=svg.querySelector('.adoption-torso'),body=torso.querySelector('.actor-breath')||torso,head=body.querySelector('.adoption-head'),look=head.closest('.actor-look')||head;
 const stretch=visitorGroup(svg,'visitor-body-study','');
 // Extend the existing garment and arms as one unit; leave the authored head
 // and neck in place. Preserve age, glasses, hats, bags and color differences.
 for(const n of [...body.children])if(n!==look)stretch.append(n);
 const torsoScale=child?1.22:1.62,hip=90+(154-90)*torsoScale;
 stretch.setAttribute('transform',`translate(60 90) scale(${child?1.25:1.7} ${torsoScale}) translate(-60 -90)`);body.prepend(stretch);
 const oldArm=stretch.querySelector('.adoption-arm');
 const coat=oldArm.querySelector('path').getAttribute('stroke'),skin=oldArm.querySelector('path:last-child').getAttribute('stroke');
 oldArm.remove();
 const farArm=visitorGroup(svg,'visitor-arm-far',`<path d="M39 101Q33 121 35 140L34 155" fill="none" stroke="${coat}" stroke-width="12" stroke-linecap="round"/><path d="M34 154L34 162" stroke="${skin}" stroke-width="7" stroke-linecap="round"/>`);
 const nearArm=visitorGroup(svg,'adoption-arm visitor-arm-near',`<path d="M76 101Q82 122 78 140L77 155" fill="none" stroke="${coat}" stroke-width="12" stroke-linecap="round"/><path d="M77 154L76 162" stroke="${skin}" stroke-width="7" stroke-linecap="round"/>`);
 stretch.prepend(farArm);stretch.append(nearArm);
 const foot=child?292:352;
 const legs=visitorGroup(svg,'visitor-shaped-legs','');
 const original=svg.querySelector('.adoption-leg-b');original.before(legs);
 // The far arm must sit behind the whole silhouette, including the trousers.
 // Preserve the same torso/breath/garment coordinate chain after reparenting.
 const rear=visitorGroup(svg,'visitor-rear-arm-layer','');
 const rearBreath=body===torso?visitorGroup(svg,'',''):body.cloneNode(false);
 rearBreath.removeAttribute('id');
 const rearStretch=visitorGroup(svg,'visitor-rear-arm-scale','');
 rearStretch.setAttribute('transform',stretch.getAttribute('transform'));
 rearStretch.append(farArm);rearBreath.append(rearStretch);rear.append(rearBreath);
 legs.before(rear);
 svg.querySelectorAll('.adoption-leg-a,.adoption-leg-b').forEach(n=>n.remove());
 svg.dataset.visitorHip=hip;svg.dataset.visitorFoot=foot;svg.dataset.visitorChild=String(child);
 drawVisitorLegs(svg,0,false,1);
 svg.querySelector('ellipse[fill="#655b4820"]')?.remove();
 return svg;
}
function drawVisitorLegs(svg,t,walking,direction){
 svg.classList.toggle('is-walking',walking);
 const baseHip=Number(svg.dataset.visitorHip),cycle=t/1.5*Math.PI*2,bob=walking?-1.8*(1-Math.cos(cycle*2)):0,hip=baseHip+bob,floor=Number(svg.dataset.visitorFoot),child=svg.dataset.visitorChild==='true',width=child?12:16,spread=walking?(child?4:6):(child?12:18);
 const pieces=[];
 for(let i=0;i<2;i++){
  const phase=(t/1.5+i*.5)%1,stance=phase<.62;
  const stride=48*.62*1.5,progress=stance?phase/.62:(phase-.62)/.38;
  const u=progress,hermite=(2*u*u*u-3*u*u+1)*(-stride/2)+(u*u*u-2*u*u+u)*(-48*.38*1.5)+(-2*u*u*u+3*u*u)*(stride/2)+(u*u*u-u*u)*(-48*.38*1.5);
  const dx=walking?(stance?stride/2-stride*progress:hermite)*direction:0;
  const lift=walking&&!stance?Math.sin(progress*Math.PI)**2*(child?6:9):0;
  const near=i===1,depth=0;
  const hx=60+(near?-spread:spread),ax=hx+dx,ay=floor-8-lift,hy=hip+9;
  // The supporting leg stays almost straight; the advancing knee bends forward.
  const bend=walking?(stance?2+3*Math.sin(progress*Math.PI):Math.sin(progress*Math.PI)*(child?14:20)):0;
  const kx=(hx+ax)/2+bend*direction,ky=hy+(ay-hy)*.51;
  const color=near?'#777970':'#6d7268';
  pieces.push(`<g class="visitor-shape-leg" data-depth="${near?'near':'far'}" data-ground-y="${floor-depth}" data-stance="${!walking||stance}" data-foot-x="${ax}" data-foot-y="${ay+8}"><path d="M${hx-width} ${hip-6}Q${hx-width-2} ${hy+20} ${kx-width*.7} ${ky}L${ax-8} ${ay}Q${ax} ${ay+2} ${ax+8} ${ay}L${kx+width*.7} ${ky}Q${hx+width+2} ${hy+20} ${hx+width} ${hip-6}Z" fill="${color}"/><path d="M${ax-8} ${ay-3}Q${ax} ${ay} ${ax+8} ${ay-3}L${ax+8+direction*8} ${ay+4}Q${ax+8+direction*8} ${ay+8} ${ax+5} ${ay+8}H${ax-9}Q${ax-12} ${ay+5} ${ax-8} ${ay-3}Z" fill="#645e52"/><path d="M${ax-7} ${ay-4}L${ax+7} ${ay-4}" stroke="#5d6659" stroke-width="1.3"/></g>`);
 }
 pieces.unshift(`<path class="visitor-pelvis" d="M${60-spread-width} ${hip-8}H${60+spread+width}L${60+spread+width} ${hip+18}Q60 ${hip+26} ${60-spread-width} ${hip+18}Z" fill="#777970"/>`);
 svg.querySelector('.visitor-shaped-legs').innerHTML=pieces.join('');
 const torso=svg.querySelector('.adoption-torso');torso.setAttribute('transform',walking?`translate(60 ${bob}) scale(.86 1) translate(-60 0) rotate(${Math.sin(cycle)*.6} 60 ${baseHip})`:'');
 svg.querySelector('.visitor-rear-arm-layer').setAttribute('transform',torso.getAttribute('transform'));
 const arm=svg.querySelector('.visitor-arm-near'),far=svg.querySelector('.visitor-arm-far');
 // Project both shoulders into the walking plane. Do not swing the wide,
 // front-facing arms across the abdomen; keep a relaxed elbow and wrist.
 for(const [part,near] of [[arm,true],[far,false]]){
  if(!part)continue;
  const paths=part.querySelectorAll('path');
  if(walking){
   const sx=near?39:76,angle=(near?-1:1)*Math.cos(cycle)*10;
   part.setAttribute('transform',`rotate(${angle} ${sx} 101)`);
   paths[0].setAttribute('d',`M${sx} 101L${sx} 125Q${sx} 128 ${sx+1} 131L${sx+4} 158`);
   paths[0].setAttribute('stroke-width',near?'10':'9');
   paths[1].setAttribute('d',`M${sx+4} 158L${sx+5} 165`);
   paths[1].setAttribute('stroke-width','6');
  }else{
   part.removeAttribute('transform');
   paths[0].setAttribute('d',near?'M76 101Q82 122 78 140L77 155':'M39 101Q33 121 35 140L34 155');
   paths[0].setAttribute('stroke-width','12');
   paths[1].setAttribute('d',near?'M77 154L76 162':'M34 154L34 162');
   paths[1].setAttribute('stroke-width','7');
  }
 }

}
