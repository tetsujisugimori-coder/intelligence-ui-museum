"use strict";
const assert=require('node:assert/strict');
const checkNames=['A existing destination selection and no-op control','B sequential multiple transfer and separate sides','C reverse transfer preserves destination selection','D Undo restores membership and clears selections','E real keyboard focus and native checkbox semantics','F all transfer, empty recovery and reset'];
async function exercise(page,record,shot){
 const c=page.locator('[data-id="119"]'),item=(side,name)=>c.locator(`[data-${side}] [data-item="${name}"]`),move=dir=>c.locator(`[data-move="${dir}"]`);
 async function reset(){await c.getByRole('button',{name:'Transfer Listをリセット',exact:true}).click()}
 async function state(label){if(await page.evaluate(()=>typeof window.verifyTextZoom==='function')){const bad=await page.evaluate(()=>window.verifyTextZoom());assert.deepEqual(bad,[],`incorrect font scaling: ${label}`)}const value=await c.evaluate(el=>({items:[...el.querySelectorAll('[data-item]')].map(x=>({name:x.dataset.item,id:x.dataset.itemId||null,side:x.dataset.side,checked:x.checked,checkedAttribute:x.getAttribute('checked'),ariaChecked:x.getAttribute('aria-checked'),nativeType:x.type})),text:el.querySelector('[data-state]').textContent,focus:{tag:document.activeElement.tagName,item:document.activeElement.dataset.item||null,move:document.activeElement.dataset.move||null,undo:document.activeElement.hasAttribute('data-undo'),visible:document.activeElement.matches(':focus-visible'),outline:getComputedStyle(document.activeElement).outlineWidth}}));record.observations.push({label,...value});return value}
 async function selected(side,names){assert.deepEqual(await c.locator(`[data-${side}] [data-item]:checked`).evaluateAll(xs=>xs.map(x=>x.dataset.item)),names)}
 async function check(name,fn){try{await reset();await fn();if(await page.evaluate(()=>typeof window.verifyTextZoom==='function'))assert.deepEqual(await page.evaluate(()=>window.verifyTextZoom()),[],`incorrect font scaling after ${name}`);record.checks.push({name,pass:true})}catch(e){record.checks.push({name,pass:false,error:e.stack});await state('failure: '+name);await shot(name[0]+'-failure')}}
 await check(checkNames[0],async()=>{
  await item('left','設計').check();await move('right').click();await item('right','設計').check();await state('A before');await shot('before');
  await move('right').click();await selected('right',['設計']);await state('A no-op control');
  await item('left','実装').check();await move('right').click();await state('A after');await shot('after');await selected('right',['設計']);assert.equal(await item('right','実装').isChecked(),false);
 });
 await check(checkNames[1],async()=>{
  await item('left','設計').check();await item('left','実装').check();await move('right').click();await item('right','設計').check();await item('left','公開準備').check();await item('left','検証').check();await move('right').click();await selected('right',['設計']);await selected('left',[]);assert.equal(await c.locator('[data-right] [data-item]').count(),4);
  await item('right','設計').uncheck();await item('right','実装').check();await item('right','検証').check();await move('left').click();await item('right','設計').check();await item('left','実装').check();await move('right').click();await selected('right',['設計']);await selected('left',[]);await state('B sequential');
 });
 await check(checkNames[2],async()=>{
  await move('allRight').click();await item('right','設計').check();await move('left').click();await item('left','設計').check();await item('right','公開準備').check();await item('right','実装').check();await move('left').click();await selected('left',['設計']);await selected('right',[]);await state('C reverse');
 });
 await check(checkNames[3],async()=>{
  await item('left','設計').check();await move('right').click();await item('right','設計').check();await item('left','実装').check();await move('right').click();await c.locator('[data-undo]').click();await selected('left',[]);await selected('right',[]);assert.equal(await item('left','実装').count(),1);assert.equal(await item('right','設計').count(),1);
  await c.locator('[data-undo]').click();assert.equal(await c.locator('[data-left] [data-item]').count(),4);assert.equal(await c.locator('[data-right] [data-item]').count(),0);assert.equal(await c.locator('[data-item]:checked').count(),0);assert.equal(await c.locator('[data-undo]').isDisabled(),true);await state('D two Undo');
 });
 await check(checkNames[4],async()=>{
  await item('left','設計').focus();await page.keyboard.press('Space');await selected('left',['設計']);await state('E checkbox Space');
  for(let n=0;n<4;n++)await page.keyboard.press('Tab');assert.equal(await move('right').evaluate(x=>x===document.activeElement),true);await page.keyboard.press('Enter');await item('right','設計').focus();await page.keyboard.press('Space');
  await item('left','実装').focus();await page.keyboard.press('Space');for(let n=0;n<3;n++)await page.keyboard.press('Tab');assert.equal(await move('right').evaluate(x=>x===document.activeElement),true);await page.keyboard.press('Space');await selected('right',['設計']);
  const s=await state('E keyboard after transfer');assert.equal(s.focus.move,'right');assert.equal(s.focus.visible,true);assert(parseFloat(s.focus.outline)>0);assert(s.items.every(x=>x.nativeType==='checkbox'&&(x.ariaChecked===null||x.ariaChecked===String(x.checked))));
  await page.keyboard.press('Shift+Tab');assert.equal(await item('left','公開準備').evaluate(x=>x===document.activeElement),true);await shot('keyboard-focus');
 });
 await check(checkNames[5],async()=>{
  await move('right').click();assert.match(await c.locator('[data-state]').innerText(),/選んでください/);await move('allRight').click();assert.match(await c.locator('[data-left]').innerText(),/項目なし/);assert.equal(await c.locator('[data-right] [data-item]').count(),4);await move('allLeft').click();assert.equal(await c.locator('[data-left] [data-item]').count(),4);await reset();assert.match(await c.locator('[data-state]').innerText(),/左 4件、右 0件、選択 0件/);await state('F reset');
 });
}
module.exports={exercise,checkNames};
