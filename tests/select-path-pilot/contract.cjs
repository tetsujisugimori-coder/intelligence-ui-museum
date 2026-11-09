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
 if(row.captureError||row.cleanupError||row.error)errors.push('capture-or-execution-error');
 if(row.cleanup!==true)errors.push('cleanup');
 if(row.status!=='COMPLETE')errors.push('incomplete');
 const e=row.final;if(!e||typeof e.focusVisible!=='boolean'||typeof e.focused!=='boolean'||typeof e.expanded!=='boolean'||!rect(e.rect))errors.push('final-observation');
 if(e?.expanded||!e?.focused||e?.value!=='a')errors.push('final-state');
 const opens=row.events?.filter(e=>e.expanded==='true'&&rect(e.trigger))||[];if(!opens.length)errors.push('no-open-observation');
 if(!opens.some(e=>rect(e.option)&&rect(e.popup)))errors.push('no-open-geometry');
 const acq=row.operations?.filter(o=>o.name==='acquire')||[];if(acq.length!==1||acq[0]?.argument!==row.route||acq[0]?.success!==true)errors.push('acquisition-operation');
 const aq=row.acquisition;if(!aq||aq.focused!==true||!rect(aq.rect)||!Number.isFinite(aq.time)||!Number.isInteger(aq.seq)||!Number.isInteger(row.acquireEventStart)||aq.seq<=row.acquireEventStart||!(row.events||[]).some(e=>e.seq>row.acquireEventStart&&e.seq<=aq.seq&&e.kind==='focusin'))errors.push('acquisition-observation');
 if(row.operations?.some(o=>o.success!==true||!Number.isFinite(o.started)||!Number.isFinite(o.finished)||o.finished<o.started))errors.push('operation-outcome');
 
 const expected=row.cohort==='A-museum-old'?['Space','Space','ArrowUp','Enter','Space','Escape']:['ArrowDown','Escape'];
 // Acquiring Tab keys precede the first open; only keys after start-select are compared.
 if(JSON.stringify(row.selectKeys)!==JSON.stringify(expected))errors.push('operation-sequence');
 const normalize=k=>k===' '?'Space':k;
 for(const kind of ['keydown','keyup']){const actual=(row.events||[]).filter(e=>e.kind===kind).map(e=>normalize(e.key)).slice(-expected.length);if(JSON.stringify(actual)!==JSON.stringify(expected))errors.push('actual-'+kind+'-sequence');}
 if(!(row.events||[]).some(e=>e.kind==='focusin'))errors.push('focus-events');
 if(row.cohort.includes('museum')&&(JSON.stringify(row.checks?.map(c=>c.name))!==JSON.stringify(['environment','layout','Button','Badge','Alert','Switch'])||row.checks.some(c=>c.pass!==true)))errors.push('prelude');
 if(row.final?.viewport?.width!==375||row.final?.viewport?.height!==1000||row.final?.viewport?.dpr!==1||row.final?.viewport?.scale!==1)errors.push('environment');
 if(row.cohort==='A-museum-old'&&row.normalClick?.success!==true)errors.push('ordinary-click-failed');
 const off=row.normalClick?.success===false&&row.normalClick?.error?.includes('Timeout')&&row.clickFailureSnapshot?.option;
 const outside=off&&(off.y+off.height<=0||off.y>=plan.viewport.height||off.x+off.width<=0||off.x>=plan.viewport.width);
 const offscreen=outside?'FAIL':row.status==='COMPLETE'&&row.cohort==='A-museum-old'&&!errors.length?'PASS':row.cohort!=='A-museum-old'?'NOT_TESTED':'UNKNOWN';
 if(row.cohort==='A-museum-old'){const clicks=row.operations?.filter(o=>o.name==='ordinary-option-click')||[];if(clicks.length!==1||clicks[0]?.success!==true||clicks[0]?.argument!=='カード')errors.push('ordinary-click-operation');for(const kind of ['pointerdown','pointerup'])if(!(row.events||[]).some(e=>e.seq>(row.acquisition?.seq??Infinity)&&e.kind===kind&&e.trusted===true&&e.target?.option==='b'))errors.push('ordinary-click-'+kind);if(row.operations?.filter(o=>o.name==='mouse-move'&&JSON.stringify(o.argument)==='[0,0]'&&o.success===true).length!==1)errors.push('mouse-move');}
 const paint=row.paint;
 if(!paint||typeof paint.pass!=='boolean'||typeof paint.active!=='boolean'||typeof paint.visible!=='boolean'||!rect(paint.rect)||!rect(paint.clip)||!Array.isArray(paint.clipping)||!Number.isInteger(paint.changed)||!Number.isInteger(paint.unstable)||!Array.isArray(paint.indicators)||paint.indicators.length!==1||!paint.indicators.every(i=>rect(i)&&Number.isInteger(i.pixels)&&Number.isFinite(i.minimum)&&Number.isFinite(i.spanX)&&Number.isFinite(i.spanY)&&typeof i.pass==='boolean'))errors.push('paint-observation');
 const imgs=paint?.images; if(!Array.isArray(imgs)||imgs.length!==4||new Set(imgs).size!==4||!['on','off','off2','on2'].every((suffix,i)=>imgs[i]===row.id+'-Select-'+suffix+'.png'&&row.images?.includes(imgs[i])))errors.push('paint-images');
 const outline=errors.length||!e||typeof e.focusVisible!=='boolean'||!paint||typeof paint.pass!=='boolean'?'UNKNOWN':e.focused&&e.focusVisible&&paint.pass?'PASS':'FAIL';
 return {diagnostic:errors.length?'INCOMPLETE':'COMPLETE',offscreen:offscreen==='PASS'&&errors.length?'UNKNOWN':offscreen,outline,errors,rootCause:'UNKNOWN',stage3:'HOLD'};
}
function validateRun(data){const errors=[];const expected=slots();if(JSON.stringify(data.plan)!==JSON.stringify(plan))errors.push('full-plan');if(!['win32','linux'].includes(data.platform)||data.engine!=='webkit')errors.push('run-environment');if(!/^[a-f0-9]{40}$/.test(data.head||'')||!/^[a-f0-9]{40}$/.test(data.tree||''))errors.push('source-identity');for(const k of ['sources','product','builds'])if(!data[k]||!Object.keys(data[k]).length)errors.push('provenance-'+k);if(data.sdkProvenance?.mode!=='detail'||!Array.isArray(data.sdkProvenance?.records)||!data.sdkProvenance.records.length)errors.push('sdk-provenance');if(data.playwright!=='1.56.1')errors.push('playwright');if(data.planId!==plan.id)errors.push('plan');if(data.rows?.length!==expected.length)errors.push('count');const ids=data.rows?.map(r=>r.id)||[];if(new Set(ids).size!==ids.length)errors.push('duplicate');for(const s of expected)if(!ids.includes(s.id))errors.push('missing:'+s.id);for(const r of data.rows||[]){if(r.engine!==data.engine||r.sdkVersion!=='0.2.2'||r.theme!=='light'||r.rootPercent!==100||JSON.stringify(r.viewport)!==JSON.stringify(plan.viewport))errors.push(r.id+':environment-binding');}for(const r of data.rows||[])errors.push(...classify(r).errors.map(e=>r.id+':'+e));if(data.fatal||data.cleanup!==true)errors.push('run-failure');return errors;}
module.exports={slots,classify,validateRun};
