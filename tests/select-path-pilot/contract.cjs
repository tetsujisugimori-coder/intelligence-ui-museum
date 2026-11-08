'use strict';
const plan=require('./plan.json');
function slots(){const a=[];for(let i=1;i<=plan.repeats;i++){for(const route of plan.routes)for(const cohort of i%2?plan.cohorts.slice(0,2):plan.cohorts.slice(0,2).reverse())a.push({id:`${cohort}-${route}-${i}`,cohort,route,iteration:i});for(const cohort of plan.cohorts.slice(2))for(const route of ['direct','tab'])a.push({id:`${cohort}-${route}-${i}`,cohort,route,iteration:i});}return a;}
const rect=r=>r&&['x','y','width','height'].every(k=>Number.isFinite(r[k]))&&r.width>0&&r.height>0;
function classify(row){
 const errors=[];if(!slots().some(s=>['id','cohort','route','iteration'].every(k=>row[k]===s[k])))errors.push('identity');
 if(!Array.isArray(row.errors)||row.errors.length)errors.push('pageerror');
 if(!Array.isArray(row.operations)||!row.operations.length)errors.push('operations');
 if(!Array.isArray(row.events)||!row.events.length||row.overflow)errors.push('events');
 if(row.events?.some((e,i)=>!Number.isFinite(e.time)||e.seq!==i+1||(i&&e.time<row.events[i-1].time)))errors.push('event-order');
 if(!row.traceFile||!row.preImage||!row.finalImage)errors.push('evidence');
 if(row.cleanup!==true)errors.push('cleanup');
 if(row.status!=='COMPLETE')errors.push('incomplete');
 const e=row.final;if(!e||typeof e.focusVisible!=='boolean'||typeof e.focused!=='boolean'||typeof e.expanded!=='boolean'||!rect(e.rect))errors.push('final-observation');
 if(e?.expanded||!e?.focused||e?.value!=='a')errors.push('final-state');
 const opens=row.events?.filter(e=>e.expanded==='true'&&rect(e.trigger))||[];if(!opens.length)errors.push('no-open-observation');
 
 const expected=row.cohort==='A-museum-old'?['Space','Space','ArrowUp','Enter','Space','Escape']:['ArrowDown','Escape'];
 // Acquiring Tab keys precede the first open; only keys after start-select are compared.
 if(JSON.stringify(row.selectKeys)!==JSON.stringify(expected))errors.push('operation-sequence');
 const normalize=k=>k===' '?'Space':k;
 for(const kind of ['keydown','keyup']){const actual=(row.events||[]).filter(e=>e.kind===kind).map(e=>normalize(e.key)).slice(-expected.length);if(JSON.stringify(actual)!==JSON.stringify(expected))errors.push('actual-'+kind+'-sequence');}
 if(!(row.events||[]).some(e=>e.kind==='focusin'))errors.push('focus-events');
 if(row.cohort.includes('museum')&&(row.checks?.length!==6||row.checks.some(c=>!c.pass)))errors.push('prelude');
 if(row.final?.viewport?.width!==375||row.final?.viewport?.height!==1000||row.final?.viewport?.dpr!==1||row.final?.viewport?.scale!==1)errors.push('environment');
 if(row.cohort==='A-museum-old'&&row.normalClick?.success!==true)errors.push('ordinary-click-failed');
 const off=row.normalClick?.success===false&&row.normalClick?.error?.includes('Timeout')&&row.clickFailureSnapshot?.option;
 const outside=off&&(off.y+off.height<=0||off.y>=plan.viewport.height||off.x+off.width<=0||off.x>=plan.viewport.width);
 const offscreen=outside?'FAIL':row.status==='COMPLETE'&&row.cohort==='A-museum-old'?'PASS':row.cohort!=='A-museum-old'?'NOT_TESTED':'UNKNOWN';
 const paint=row.paint;
 const outline=!e||typeof e.focusVisible!=='boolean'||!paint||typeof paint.pass!=='boolean'?'UNKNOWN':e.focused&&e.focusVisible&&paint.pass?'PASS':'FAIL';
 return {diagnostic:errors.length?'INCOMPLETE':'COMPLETE',offscreen,outline,errors,rootCause:'UNKNOWN',stage3:'HOLD'};
}
function validateRun(data){const errors=[];const expected=slots();if(data.planId!==plan.id)errors.push('plan');if(data.rows?.length!==expected.length)errors.push('count');const ids=data.rows?.map(r=>r.id)||[];if(new Set(ids).size!==ids.length)errors.push('duplicate');for(const s of expected)if(!ids.includes(s.id))errors.push('missing:'+s.id);for(const r of data.rows||[])errors.push(...classify(r).errors.map(e=>r.id+':'+e));if(data.fatal||data.cleanup!==true)errors.push('run-failure');return errors;}
module.exports={slots,classify,validateRun};
