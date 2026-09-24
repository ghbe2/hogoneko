const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage();
 await page.goto(pathToFileURL(path.resolve('art/cat-directions/cat-lab.html')).href);
 await page.click('#pause');
 fs.mkdirSync('art/cat-directions/room-assets',{recursive:true});
 for(const [name,preset] of [['tortie','G'],['tabby','F'],['tux','H']]){
  await page.click(`[data-preset="${preset}"]`);
  const svg=await page.evaluate(()=>{
   catLab.setPose('sit');
   const node=document.querySelector('#hero').cloneNode(true);
   node.setAttribute('xmlns','http://www.w3.org/2000/svg');
   node.setAttribute('viewBox','220 60 280 320');
   node.setAttribute('width','280');node.setAttribute('height','320');
   node.querySelectorAll('.floor,.part-outline').forEach(n=>n.remove());
   return new XMLSerializer().serializeToString(node);
  });
  fs.writeFileSync(`art/cat-directions/room-assets/${name}.svg`,svg);
 }
 await browser.close();
})();
