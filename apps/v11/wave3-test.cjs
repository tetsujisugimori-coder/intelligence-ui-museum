'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const m=require('./wave3.js');
const clone=x=>JSON.parse(JSON.stringify(x));
test('grid: exact decimal cents, totals, strict invalid drafts',()=>{
 assert.deepEqual(m.gridTotals(m.gridRows),{subtotals:[{id:'r1',cents:2500},{id:'r2',cents:660},{id:'r3',cents:550}],cents:3710});
 assert.deepEqual(m.validateGridRow({name:' 新品 ',quantity:'3',price:'0.10'}).value,{name:'新品',quantity:3,cents:10});
 for(const price of ['','-1','1.001','1e2',' 1','01.2','100000','Infinity','NaN'])assert.ok(m.validateGridRow({name:'品',quantity:'1',price}).errors.length,price);
 for(const quantity of ['0','-1','1.5','1000','NaN','1e2',' 2'])assert.ok(m.validateGridRow({name:'品',quantity,price:'1'}).errors.length,quantity);
 for(const name of ['',' ','x'.repeat(41)])assert.ok(m.validateGridRow({name,quantity:'1',price:'1'}).errors.length);
 assert.equal(m.validateGridRow({name:'品',quantity:'999',price:'99999.99'}).value.cents,9999999);
 assert.equal(m.gridTotals([{id:'x',quantity:999,cents:9999999}]).cents,9989999001);
});
test('schema: small format validates and rejects malformed/extra/unsupported definitions',()=>{
 assert.deepEqual(m.validateSchema(m.initialSchema()),[]);
 for(const schema of [null,[],{}, {fields:[]},{fields:Array.from({length:7},(_,i)=>({id:'a'+i,label:'A',type:'string'}))},{fields:[],other:true}])assert.ok(m.validateSchema(schema).length);
 for(const mutate of [s=>s.fields[1].id='name',s=>s.fields[0].type='eval',s=>s.fields[0].script='alert(1)',s=>s.fields[1].min=10,s=>s.fields[1].min=Infinity,s=>s.fields[0].options=['x'],s=>s.fields[0].required='true',s=>s.fields[4].options=['x','x'],s=>s.fields[3].showWhen={field:'later',equals:true},s=>s.fields[3].showWhen={field:'enabled',equals:'true'},s=>s.fields[0].min=0,s=>s.fields[0].id='constructor']){
  const s=m.initialSchema();mutate(s);assert.ok(m.validateSchema(s).length);
 }
});
test('schema: hidden fields retained but excluded from validation and output',()=>{
 const schema=m.initialSchema(),values={name:'架空メモ',count:'2',enabled:false,note:'保持値',category:'study'};
 let r=m.formResult(schema,values);assert.deepEqual(r.errors,[]);assert.deepEqual(r.output,{name:'架空メモ',count:2,enabled:false,category:'study'});assert.equal(values.note,'保持値');assert.ok(!r.visible.includes('note'));
 values.enabled=true;r=m.formResult(schema,values);assert.equal(r.output.note,'保持値');assert.ok(r.visible.includes('note'));
 values.note='';assert.ok(m.formResult(schema,values).errors.some(x=>x.includes('補足')));values.enabled=false;assert.deepEqual(m.formResult(schema,values).errors,[]);
 for(const count of ['','0','10','1e1','NaN','Infinity'])assert.ok(m.formResult(schema,{...values,count}).errors.length);
 assert.ok(m.formResult(schema,{...values,category:'unknown'}).errors.length);assert.ok(m.formResult(schema,{...values,name:'x'.repeat(101)}).errors.length);
 assert.deepEqual(m.initialValues(schema),{name:'',count:'',enabled:false,note:'',category:''});
});
test('schema: boolean required, bounded finite decimals and no conditional chains',()=>{
 const schema={fields:[{id:'agree',label:'同意',type:'boolean',required:true},{id:'value',label:'値',type:'number',min:-5,max:5}]};
 assert.ok(m.formResult(schema,{agree:false,value:'1'}).errors.length);
 assert.deepEqual(m.formResult(schema,{agree:true,value:'-0.25'}).output,{agree:true,value:-0.25});
 const s={fields:[{id:'a',label:'A',type:'boolean'},{id:'b',label:'B',type:'boolean',showWhen:{field:'a',equals:true}},{id:'c',label:'C',type:'string',showWhen:{field:'b',equals:true}}]};assert.ok(m.validateSchema(s).length);
});
test('gantt: date arithmetic is inclusive and rejects invalid/outside/noninteger dates',()=>{
 const r=m.ganttLayout(m.ganttTasks);assert.deepEqual(r.bars.map(x=>[x.offset,x.duration,x.end]),[[0,2,'2026-11-02'],[2,3,'2026-11-05'],[4,4,'2026-11-08'],[8,2,'2026-11-10'],[10,3,'2026-11-13']]);assert.deepEqual(r.overlaps,[['t2','t3']]);
 assert.equal(m.endDate('2026-11-14',1),'2026-11-14');
 for(const [start,duration] of [['2026-11-14','2'],['2026-10-31','1'],['2026-11-15','1'],['2026-02-30','1'],['2026-11-01','0'],['2026-11-01','-1'],['2026-11-01','1.5'],['2026-11-01','1e1'],['','1'],['2026-11-1','1']])assert.ok(m.validateTask({start,duration}).errors.length,`${start}/${duration}`);
 assert.deepEqual(m.validateTask({start:'2026-11-01',duration:'14'}).value,{start:'2026-11-01',duration:14});
});
test('gantt independent exhaustive calendar oracle for 14-day range',()=>{
 for(let day=1;day<=14;day++)for(let n=1;n<=14;n++){
  const start=`2026-11-${String(day).padStart(2,'0')}`,v=m.validateTask({start,duration:String(n)});
  assert.equal(v.errors.length===0,day+n-1<=14);
  if(!v.errors.length){const bar=m.ganttLayout([{id:'test',...v.value}]).bars[0];assert.equal(bar.offset,day-1);assert.equal(bar.end,`2026-11-${String(day+n-1).padStart(2,'0')}`);}
 }
});
test('description contract rejects absent or empty descriptions instead of rendering undefined',()=>{
 assert.equal(m.descriptionFor('Name',{Name:'説明'}),'説明');
 for(const map of [{},{Name:undefined},{Name:''},{Name:23},Object.create({Name:'継承'})])assert.throws(()=>m.descriptionFor('Name',map),/説明未登録/);
});
test('markup contains isolated predictable hosts; no source input evaluation',()=>{
 for(const id of [130,131,132])assert.match(m.wave3Demo(id),new RegExp(`data-wave3="${id}"`));assert.equal(m.wave3Demo(999),'');
 const s=m.initialSchema();s.fields[0].label='<img src=x onerror=1>';assert.deepEqual(m.validateSchema(s),[]); // Labels are inert data, escaped during rendering.
});
