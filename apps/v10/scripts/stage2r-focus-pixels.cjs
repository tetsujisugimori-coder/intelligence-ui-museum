// Same-engine differential rendering. No cross-browser golden image or WCAG verdict.
const fs=require('node:fs'),path=require('node:path');
function geometry(e){
 const r=e.getBoundingClientRect(),root=getComputedStyle(e),unknown=[];
 const ancestors=[];
 for(let a=e;a;a=a.parentElement){const s=getComputedStyle(a),b=a.getBoundingClientRect();ancestors.push({tag:a.tagName,clipPath:s.clipPath,overflowX:s.overflowX,overflowY:s.overflowY,visibility:s.visibility,opacity:s.opacity,rect:b.toJSON()});
  if(s.transform!=='none'||s.filter!=='none'||s.perspective!=='none'||s.mixBlendMode!=='normal'||(s.maskImage&&s.maskImage!=='none')||(s.backdropFilter&&s.backdropFilter!=='none'))unknown.push('unsupported compositing/transform');
 }
 const boxes=[{pseudo:'element',x:r.x,y:r.y,width:r.width,height:r.height}];
 const s=getComputedStyle(e,'::after'),num=x=>parseFloat(x);
 if(s.content!=='none'&&s.content!=='normal'&&s.display!=='none'&&s.visibility==='visible'&&Number(s.opacity)>0){
  if(s.position!=='absolute'||root.position==='static'||s.transform!=='none'||s.filter!=='none'||(s.maskImage&&s.maskImage!=='none'))unknown.push('unsupported pseudo geometry/compositing');
  else{
   const width=num(s.width)+(s.boxSizing==='border-box'?0:num(s.paddingLeft)+num(s.paddingRight)+num(s.borderLeftWidth)+num(s.borderRightWidth));
   const height=num(s.height)+(s.boxSizing==='border-box'?0:num(s.paddingTop)+num(s.paddingBottom)+num(s.borderTopWidth)+num(s.borderBottomWidth));
   const x=r.x+e.clientLeft+num(s.left)+num(s.marginLeft),y=r.y+e.clientTop+num(s.top)+num(s.marginTop);
   if([x,y,width,height].every(Number.isFinite))boxes.push({pseudo:'::after',x,y,width,height});else unknown.push('unresolved pseudo box');
  }
 }
 return {boxes,ancestors,unknown,viewport:{width:innerWidth,height:innerHeight},active:document.activeElement===e,focusVisible:e.matches(':focus-visible')};
}
function measure(images,clip,boxes){
 const [on,off,off2,on2]=images;
 if(images.some(i=>i.width!==on.width||i.height!==on.height))return {pass:false,reason:'image dimensions changed'};
 const delta=(a,b,i)=>Math.max(...[0,1,2].map(k=>Math.abs(a.data[i+k]-b.data[i+k])));
 // Ignore tiny raster noise, and require the change to disappear and return twice.
 const changed=[];let unstable=0;
 for(let y=0;y<on.height;y++)for(let x=0;x<on.width;x++){
  const i=(y*on.width+x)*4;
  if(delta(on,on2,i)>8||delta(off,off2,i)>8){unstable++;continue;}
  if(delta(on,off,i)>=24&&delta(on2,off2,i)>=24)changed.push({x:x+clip.x,y:y+clip.y});
 }
 const indicators=boxes.map(b=>{
  // Supported indicator extent: at most 24 CSS px around its own box.
  const points=changed.filter(p=>p.x>=b.x-24&&p.x<=b.x+b.width+24&&p.y>=b.y-24&&p.y<=b.y+b.height+24);
  const spanX=points.length?Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x))+1:0;
  const spanY=points.length?Math.max(...points.map(p=>p.y))-Math.min(...points.map(p=>p.y))+1:0;
  const minimum=Math.max(16,Math.ceil((b.width+b.height)*0.5));
  return {...b,pixels:points.length,minimum,spanX,spanY,pass:points.length>=minimum&&spanX>=b.width*.5&&spanY>=b.height*.5};
 });
 return {pass:unstable===0&&indicators.some(b=>b.pass),unstable,changed:changed.length,indicators,threshold:{channelDelta:24,stabilityDelta:8},reason:unstable?'unstable render':changed.length?'visible indicator extent evaluated':'no rendered indicator difference'};
}
async function focusPixels(page,locator,modules,output){
 // Wait for finite focus/press transitions by state, never a fixed sleep/retry.
 const handle=await locator.elementHandle();
 try{await page.waitForFunction(e=>e.getAnimations({subtree:true}).every(a=>['finished','idle'].includes(a.playState)),handle,{timeout:5000});}finally{await handle.dispose();}
 const g=await locator.evaluate(geometry);
 if(g.unknown.length||!g.active||!g.focusVisible)return {pass:false,status:'UNVERIFIED',...g};
 const x=Math.max(0,Math.floor(Math.min(...g.boxes.map(b=>b.x))-24)),y=Math.max(0,Math.floor(Math.min(...g.boxes.map(b=>b.y))-24));
 const right=Math.min(g.viewport.width,Math.ceil(Math.max(...g.boxes.map(b=>b.x+b.width))+24)),bottom=Math.min(g.viewport.height,Math.ceil(Math.max(...g.boxes.map(b=>b.y+b.height))+24));
 if(g.boxes.some(b=>b.x<0||b.y<0||b.x+b.width>g.viewport.width||b.y+b.height>g.viewport.height))return {pass:false,status:'UNVERIFIED',reason:'capture extent outside viewport',...g};
 const clip={x,y,width:right-x,height:bottom-y};
 // PNG decoder already bundled by fixed Playwright 1.56.1; no product/lock change.
 // Missing/incompatible decoder throws and is rejected by the runner.
 const {PNG}=require(path.join(path.dirname(require.resolve(path.join(modules,'playwright-core/package.json'))),'lib/utilsBundle.js'));
 const buffers=[];let token;
 try{
  buffers.push(await page.screenshot({clip,animations:'disabled',scale:'css'}));
  token=await locator.evaluate(e=>{
   const style=document.createElement('style');style.id='museum-focus-suppression';
   style.textContent='#Select .stage [role=button],#Select .stage [role=button]::after {outline:none!important;box-shadow:none!important;transition:none!important}';document.head.append(style);return style.id;
  });
  const suppressed=await locator.evaluate(e=>[null,'::after'].every(p=>{const s=getComputedStyle(e,p);return (parseFloat(s.outlineWidth)===0||s.outlineStyle==='none')&&s.boxShadow==='none'}));
  if(!suppressed)return {pass:false,status:'UNVERIFIED',reason:'indicator suppression ineffective',...g};
  buffers.push(await page.screenshot({clip,animations:'disabled',scale:'css'}));
  buffers.push(await page.screenshot({clip,animations:'disabled',scale:'css'}));
 }finally{if(token)await page.evaluate(id=>document.getElementById(id)?.remove(),token);}
 buffers.push(await page.screenshot({clip,animations:'disabled',scale:'css'}));
 const after=await locator.evaluate(geometry);
 const stableGeometry=JSON.stringify(g)===JSON.stringify(after);
 const result=measure(buffers.map(b=>PNG.sync.read(b)),clip,g.boxes);
 if(output)buffers.forEach((b,i)=>fs.writeFileSync(`${output}-${['on','off','off2','on2'][i]}.png`,b));
 return {...g,...result,pass:stableGeometry&&result.pass,status:stableGeometry&&!result.unstable?(result.pass?'PASS':'FAIL'):'UNVERIFIED',stableGeometry,clip};
}
module.exports={focusPixels,measure};
