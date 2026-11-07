'use strict';
// Diagnostic-only native DOM fixture. No SDK/product code is modified.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),os=require('node:os'),{execFileSync}=require('node:child_process');
const pw=require('../../tools/stage-a-browser/node_modules/playwright');
const out=path.resolve(process.env.FIFTH_FIXTURE_OUT||'.work/fifth-focus-fixture');if(fs.existsSync(out))throw Error('Fresh output required');fs.mkdirSync(out,{recursive:true});
const html=`<!doctype html><meta charset=utf-8><style>body{padding:40px}[role=button]{display:inline-block;padding:16px;border:1px solid black}[role=button]:focus-visible{outline:3px solid orange;outline-offset:4px}#popup{padding:20px;border:1px solid}</style><input id=anchor type=checkbox><span id=trigger role=button tabindex=0>Native fixture</span><button id=after>Next</button>`;
function setup(timing){
 const t=document.querySelector('#trigger');window.events=[];
 const take=(type,e)=>events.push({type,ms:performance.now(),key:e?.key,trusted:e?.isTrusted,active:document.activeElement?.id,visible:t.matches(':focus-visible'),outline:getComputedStyle(t).outline,scrollY});
 for(const type of ['focusin','focusout','keydown','keyup','pointerdown','pointerup'])document.addEventListener(type,e=>take(type,e),true);
 t.addEventListener('keydown',e=>{if(e.key!==' ')return;e.preventDefault();const p=document.createElement('div');p.id='popup';p.tabIndex=0;p.textContent='Press Escape';document.body.append(p);p.focus({preventScroll:true});take('popup-open');
 const restore=()=>{p.remove();take('restore-before');t.focus({preventScroll:true});take('restore-after');window.restored=true;};
 p.addEventListener('keydown',e=>{if(e.key!=='Escape')return;e.preventDefault();if(timing==='keydown-sync')restore();else if(timing==='keydown-next-task')setTimeout(restore,0);});
 p.addEventListener('keyup',e=>{if(e.key==='Escape'&&timing==='keyup-sync')restore();});
 });
 window.take=take;
}
(async()=>{const rows=[];for(const engine of (process.env.FIFTH_FIXTURE_ENGINES||'webkit,chromium').split(',')){const b=await pw[engine].launch();for(const route of ['direct','tab','legacy'])for(const timing of ['keydown-sync','keydown-next-task','keyup-sync'])for(let i=1;i<=5;i++){
 const p=await b.newPage({viewport:{width:375,height:1000}});const row={engine,browser:b.version(),route,timing,i,errors:[]};rows.push(row);p.on('pageerror',e=>row.errors.push(String(e)));
 try{await p.setContent(html);await p.evaluate(setup,timing);await p.locator('#anchor').click();const t=p.locator('#trigger');if(route==='tab')await p.keyboard.press('Tab');else{await t.focus();if(route==='legacy'){await p.keyboard.press('Tab');await p.keyboard.press('Shift+Tab');}}
 await p.keyboard.press('Space');await p.waitForFunction(()=>document.activeElement?.id==='popup');await p.keyboard.down('Escape');row.beforeKeyup=await p.evaluate(()=>({active:document.activeElement?.id,visible:document.querySelector('#trigger').matches(':focus-visible'),events:window.events.slice()}));await p.keyboard.up('Escape');await p.waitForFunction(()=>window.restored===true);await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));row.final=await t.evaluate(e=>({active:document.activeElement===e,visible:e.matches(':focus-visible'),outline:getComputedStyle(e).outline,events:window.events}));
 const name=`${engine}-${route}-${timing}-${i}`,on=await p.screenshot({animations:'disabled'});fs.writeFileSync(path.join(out,name+'-on.png'),on);
 await p.addStyleTag({content:'#trigger{outline:none!important}'});const off=await p.screenshot({animations:'disabled'});fs.writeFileSync(path.join(out,name+'-off.png'),off);
 const {PNG}=require('../../tools/stage-a-browser/node_modules/playwright-core/lib/utilsBundle.js');const a=PNG.sync.read(on),c=PNG.sync.read(off);let changed=0;for(let k=0;k<a.data.length;k+=4)if(a.data[k]!==c.data[k]||a.data[k+1]!==c.data[k+1]||a.data[k+2]!==c.data[k+2])changed++;row.paintChangedPixels=changed;row.images=[name+'-on.png',name+'-off.png'];row.completed=row.final.active&&!row.errors.length;
 }catch(e){row.error=String(e);row.completed=false;}finally{await p.close();}
 }await b.close();}
 const sha=b=>crypto.createHash('sha256').update(b).digest('hex');const git=x=>execFileSync('git',x,{encoding:'utf8'}).trim();fs.writeFileSync(path.join(out,'fixture-results.json'),JSON.stringify({kind:'diagnostic native fixture, not SDK causal proof or product acceptance',head:git(['rev-parse','HEAD']),tree:git(['rev-parse','HEAD^{tree}']),dirty:git(['status','--porcelain']),sourceSha256:sha(fs.readFileSync(__filename)),os:os.platform(),release:os.release(),node:process.version,rows},null,2));fs.writeFileSync(path.join(out,'SHA256SUMS.json'),JSON.stringify(Object.fromEntries(fs.readdirSync(out).map(f=>[f,sha(fs.readFileSync(path.join(out,f)))])),null,2));console.log(JSON.stringify({trials:rows.length,incomplete:rows.filter(r=>!r.completed).length,groups:Object.fromEntries([...new Set(rows.map(r=>r.engine+'/'+r.route+'/'+r.timing))].map(k=>[k,rows.filter(r=>r.engine+'/'+r.route+'/'+r.timing===k).map(r=>({visible:r.final?.visible,paint:r.paintChangedPixels}))]))}));process.exitCode=rows.some(r=>!r.completed)?1:0;
})().catch(e=>{console.error(e);process.exitCode=1;});
