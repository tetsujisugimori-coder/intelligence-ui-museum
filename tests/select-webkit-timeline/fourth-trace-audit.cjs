'use strict';
const base=require('./third-audit.cjs');
function traceAudit(t,level){
 const reasons=base.traceAudit(t,level);
 if(level==='full'){
  const click=t?.events?.find(e=>e.type==='pointerup'&&e.optionTarget?.role==='option');
  if(!click||click.trusted!==true||![click.ms,click.clientX,click.clientY].every(Number.isFinite)||click.optionTarget.identity!==click.hitOptionAtInput?.identity)reasons.push('DELIVERED_OPTION_POINTERUP_MISSING_OR_INVALID');
  if(click&&(!click.option?.inViewport||!click.option?.clickable))reasons.push('DELIVERED_OPTION_POINTERUP_GEOMETRY_INVALID');
 }
 return reasons;
}
module.exports={traceAudit};
