'use strict';
const plan=require('./plan.json');
function slots(phase){
 const spec=plan[phase];if(!spec)throw Error('phase');const out=[];
 for(let iteration=1;iteration<=spec.repeats;iteration++)for(const [ci,condition]of spec.conditions.entries())for(const experiment of ['measurement','caller']){
  let arms=[...(experiment==='measurement'?plan.measurementArms:plan.callerArms)];
  if(iteration%2===0)arms.reverse();arms=[...arms.slice(ci),...arms.slice(0,ci)];
  for(const arm of arms)out.push({id:`${phase}-${condition}-${experiment}-${arm}-${iteration}`,condition,experiment,arm,iteration,probe:experiment==='caller'&&arm==='on',tracing:experiment==='measurement'&&arm==='A4'});
 }return out;
}
function classify(r){
 if(r.status!=='COMPLETE'||r.cleanup!==true||r.error||r.captureError||r.pageErrors?.length||!r.final||!r.paint||r.probe&&(!r.events?.length||r.overflow))return {diagnostic:'INCOMPLETE',outline:'UNKNOWN',cause:'UNKNOWN'};
 return {diagnostic:'COMPLETE',outline:!r.final.focused||!r.final.hasFocus?'FOCUS_LOST':r.paint.pass?'VISIBLE':r.paint.changed===0?'ABSENT':'INSUFFICIENT',cause:'UNKNOWN'};
}
const target=s=>({html:s.htmlNoEmptyStyle,rect:s.trigger.rect,scroll:s.scroll,value:s.value,viewport:s.viewport,font:s.font,theme:s.theme});
const delay=r=>r?.finalStart-r?.steps?.at(-1)?.end;
const inBudget=r=>Number.isFinite(delay(r))&&delay(r)>=0&&delay(r)<=plan.matchDelayMs;
function comparisons(rows,phase){
 const out=[];for(const r of rows){if(r.experiment==='measurement'&&r.arm==='W0'||r.experiment==='caller'&&r.arm==='off')continue;
  const control=rows.find(x=>x.condition===r.condition&&x.iteration===r.iteration&&x.experiment===r.experiment&&x.arm===(r.experiment==='measurement'?'W0':'off'));
  const equivalent=!!r.beforeFocus&&!!control?.beforeFocus&&JSON.stringify(target(r.beforeFocus))===JSON.stringify(target(control.beforeFocus));
  out.push({id:r.id,control:control?.id||null,phase,equivalence:equivalent?'OBSERVED_MATCH':'UNCONFIRMED',timingComparable:r.experiment==='caller'||r.arm==='A0'?false:inBudget(r)&&inBudget(control),realizedDelayMs:[Number.isFinite(delay(control))?delay(control):null,Number.isFinite(delay(r))?delay(r):null],focusVisible:[control?.final?.focusVisible??null,r.final?.focusVisible??null],outline:[classify(control||{}).outline,classify(r).outline],causalStatus:'UNKNOWN'});
 }return out;
}
module.exports={slots,classify,comparisons,target};
