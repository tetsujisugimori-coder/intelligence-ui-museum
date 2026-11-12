'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const SOURCE_HASH='a2dab597ff18fb5708a5b12d0b1628b59a50d29774aa18c7dd59b114edb30bf1';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function build({engine='webkit',focus='legacy',repeats=20}){
 if(!['webkit','chromium'].includes(engine)||!['legacy','direct','tab'].includes(focus)||!Number.isSafeInteger(repeats)||repeats<1||repeats>20)throw Error('Invalid fourth condition');
 const source=fs.readFileSync(path.join(__dirname,'original-browser.cjs'),'utf8');if(sha(source)!==SOURCE_HASH)throw Error('Original hash changed');let code=source;
 const replace=(from,to)=>{if(code.split(from).length!==2)throw Error('Nonunique source anchor: '+from.slice(0,60));code=code.replace(from,to);};
 replace('async function condition(browser,engine,width,theme,text,url) {','async function condition(browser,engine,width,theme,text,url,attempt) {');
 replace('const id=`${engine}-${width}-${theme}-${text}`','const id=`${engine}-${width}-${theme}-${text}-fresh${attempt}`');
 replace("for(const width of (fault?[1280]:[320,375,390,1280]))for(const theme of (fault?['light']:['light','dark']))for(const text of (fault?[100]:[100,200]))await condition(b,engine,width,theme,text,`http://127.0.0.1:${server.address().port}`)",`for(let attempt=1;attempt<=${repeats};attempt++)await condition(b,engine,375,'light',100,\`http://127.0.0.1:\${server.address().port}\`,attempt)`);
 replace('*(fault?1:16)',`*${repeats}`);
 const original="await t.focus();await p.keyboard.press('Tab');await p.keyboard.press('Shift+Tab');assert(await t.evaluate(e=>document.activeElement===e),'Tab/ShiftTab');";
 if(focus==='direct')replace(original,"await t.focus();assert(await t.evaluate(e=>document.activeElement===e),'direct focus');");
 if(focus==='tab')replace(original,"row.tabRoute=[];row.tabStart=await p.evaluate(()=>({tag:document.activeElement?.tagName,id:document.activeElement?.id,role:document.activeElement?.getAttribute('role'),ms:performance.now(),scrollY}));for(let tab=0;tab<60;tab++){await p.keyboard.press('Shift+Tab');const state=await p.locator('#Select input[type=checkbox]').evaluate(e=>({anchor:document.activeElement===e,tag:document.activeElement?.tagName,id:document.activeElement?.id,role:document.activeElement?.getAttribute('role'),ms:performance.now(),scrollY}));row.tabRoute.push(state);if(state.anchor)break;}assert(row.tabRoute.at(-1)?.anchor,'pure keyboard path did not reach explicit Select checkbox anchor');await p.keyboard.press('Tab');assert(await t.evaluate(e=>document.activeElement===e),'pure Tab failed from preceding checkbox');");
 replace("row.csp=await p.evaluate(()=>window.s3CSP||[]);","const finalImage=id+'-fourth-final.png';await p.screenshot({path:path.join(out,finalImage),animations:'disabled'});row.images.push(finalImage);row.csp=[];for(const frame of p.frames())row.csp.push(...await frame.evaluate(()=>window.s3CSP||[]));");
 // Product and earlier runner evidence stay byte-identical. Preserve original ring,
 // screenshots, prelude and action waits. Only matrix/lifecycle/focus route differ.
 return {code,sourceHash:SOURCE_HASH,runnerHash:sha(code),engine,focus,repeats};
}
module.exports={build,SOURCE_HASH};
