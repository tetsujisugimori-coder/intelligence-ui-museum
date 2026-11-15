'use strict';
// Independent, synthetic observation fixture. No product or contract.expected() oracle.
const test=require('node:test'),a=require('node:assert/strict');
const {validateSteps}=require('./wave7-contract.cjs');
const copy=x=>structuredClone(x);
function fixture(){
 const d={selected:null,direct:[],indirect:[],count:0,paths:{},cycles:[['B','C','B']]};
 const s={raw:{people:'4',days:'5',cost:'2000'},valid:true,comparison:{a:{total:40000,personDays:20,daily:8000},b:{total:40000,personDays:20,daily:8000},delta:0,percent:'0.0%'},error:null};
 const h={events:[],cursor:0,nextId:1,eventCount:0,current:{count:0,flag:false}};
 const values={142:copy(d),143:copy(s),144:copy(h)},steps=[];
 function add(name,focus){steps.push({name,values:copy(values),rendered:render(values,focus)});}
 add('initial');
 values[142]={selected:'A',direct:['B'],indirect:['C','D','E'],count:4,paths:{B:['A','B'],C:['A','B','C'],D:['A','B','C','D'],E:['A','B','C','D','E']},cycles:[['B','C','B']]};add('select-A',[142,'node-A']);
 values[142]={selected:'B',direct:['C'],indirect:['D','E'],count:3,paths:{C:['B','C'],D:['B','C','D'],E:['B','C','D','E']},cycles:[['B','C','B']]};add('select-B',[142,'node-B']);
 values[142]={...copy(d),selected:'F'};add('isolated',[142,'node-F']);values[142]=copy(d);add('clear',[142,'clear']);add('dependency-reset',[142,'node-A']);
 // Independently tabulated arithmetic, including negative differences and zero.
 for(const [name,p,days,c,total,pd,daily,delta,percent] of [
 ['people','2','5','2000',20000,10,4000,-20000,'-50.0%'],
 ['days','2','3','2000',12000,6,4000,-28000,'-70.0%'],
 ['cost','2','3','1500',9000,6,3000,-31000,'-77.5%']]){
 values[143]={raw:{people:p,days,cost:c},valid:true,comparison:{a:copy(s.comparison.a),b:{total,personDays:pd,daily},delta,percent},error:null};add(name,[143,name]);}
 for(const [name,raw,error,key] of [
 ['invalid',{people:'NaN',days:'3',cost:'1500'},'people：十進整数を入力してください','people'],
 ['range',{people:'21',days:'3',cost:'1500'},'people：範囲 0〜20','people'],
 ['zero-divisor',{people:'2',days:'0',cost:'1500'},'days：範囲 1〜30','days']]){
 values[143]={raw,valid:false,comparison:null,error};add(name,[143,key]);}
 values[143]={raw:{people:'0',days:'1',cost:'0'},valid:true,comparison:{a:copy(s.comparison.a),b:{total:0,personDays:0,daily:0},delta:-40000,percent:'-100.0%'},error:null};add('zero',[143,'cost']);values[143]=copy(s);add('scenario-reset',[143,'people']);
 const e1={id:1,parentId:0,kind:'increment'},e2={id:2,parentId:1,kind:'toggle'},e3={id:3,parentId:2,kind:'increment'},e4={id:4,parentId:1,kind:'decrement'};
 for(const [name,events,cursor,nextId,count,flag,key]of [
 ['increment',[e1],1,2,1,false,'increment'],['toggle',[e1,e2],2,3,1,true,'toggle'],['increment2',[e1,e2,e3],3,4,2,true,'increment'],
 ['prev',[e1,e2,e3],2,4,1,true,'prev'],['first',[e1,e2,e3],0,4,0,false,'next'],['next',[e1,e2,e3],1,4,1,false,'next'],['last',[e1,e2,e3],3,4,2,true,'prev'],['seek',[e1,e2,e3],1,4,1,false,'cursor'],
 ['branch',[e1,e4],2,5,0,false,'decrement'],['branch-prev',[e1,e4],1,5,1,false,'prev'],['branch-next',[e1,e4],2,5,0,false,'prev']]){
 values[144]={events,cursor,nextId,eventCount:events.length,current:{count,flag}};add(name,[144,key]);}
 values[144]=copy(h);add('replay-reset',[144,'increment']);return {steps};
}
// DOM fixtures encode the observable contract, independently of rendering code.
function render(v,focus){const g=v[142],s=v[143],h=v[144],common={text:'教材の現在状態を文字列で表示する独立合成原票',activeKey:null};
 const r={142:{...common,paths:Object.entries(g.paths).map(([id,p])=>[id,id+'：'+p.join(' → ')]),count:'影響 '+g.count+'件',direct:'直接：'+(g.direct.join(', ')||'なし'),indirect:'間接：'+(g.indirect.join(', ')||'なし'),cycles:'循環 B → C → B',selected:g.selected?[g.selected]:[]},143:{...common,inputs:copy(s.raw),table:[],graph:[],invalid:s.error,percent:null},144:{...common,position:`現在位置 ${h.cursor} / ${h.eventCount} イベント`,current:`値 ${h.current.count} ／ フラグ ${h.current.flag?'ON':'OFF'}`,events:[]}};
 if(s.valid){r[143].table=['total','personDays','daily'].map(k=>{const x=s.comparison.a[k],y=s.comparison.b[k],d=y-x;return [k,''+x,''+y,(d<0?'':'+')+d];});r[143].graph=['a','b'].map(k=>[k,''+s.comparison[k].total,k.toUpperCase()+'：'+s.comparison[k].total+'円',({40000:'100%',20000:'50%',12000:'30%',9000:'22.5%',0:'0%'})[s.comparison[k].total]]);r[143].percent='総費用の変化率 '+s.comparison.percent;}
 const eventText={1:['0/OFF','1/OFF'],2:['1/OFF','1/ON'],3:['1/ON','2/ON'],4:['1/OFF','0/OFF']};
 r[144].events=h.events.map((e,i)=>[''+e.id,''+e.parentId,e.kind,`${i+1}. ID${e.id}（親${e.parentId}） ${e.kind}：${eventText[e.id][0]} → ${eventText[e.id][1]}${h.cursor===i+1?'（現在）':''}`]);
 if(focus)r[focus[0]].activeKey=focus[1];return r;
}
const normal=fixture();
test('independent synthetic normal: all 26 fixed steps accepted',()=>{a.equal(normal.steps.length,26);validateSteps(normal);});
for(let i=0;i<normal.steps.length;i++){
 const name=normal.steps[i].name;
 for(const id of [142,143,144])test(`${name}: state ${id} corruption rejected semantically`,()=>{const r=copy(normal);r.steps[i].values[id].forged=true;a.throws(()=>validateSteps(r),new RegExp(`fixed state ${name}/${id}`));});
 for(const [id,field,reason]of [[142,'paths','path display'],[142,'count','impact count display'],[142,'direct','direct display'],[142,'indirect','indirect display'],[142,'cycles','cycle display'],[142,'selected','selection display'],[143,'inputs','input display'],[144,'position','replay position'],[144,'current','replay display'],[144,'events','event display']])test(`${name}: DOM ${id}/${field} mismatch rejected`,()=>{const r=copy(normal);r.steps[i].rendered[id][field]=field==='cycles'?'wrong cycle':'CORRUPT';a.throws(()=>validateSteps(r),new RegExp(reason));});
 const valid=normal.steps[i].values[143].valid;
 if(valid)test(`${name}: graph width alone rejected`,()=>{const r=copy(normal);r.steps[i].rendered[143].graph[0][3]='99%';a.throws(()=>validateSteps(r),/graph display/);});
 for(const field of ['table','graph'])test(`${name}: ${valid?'valid':'invalid'} ${field} corruption rejected`,()=>{const r=copy(normal);r.steps[i].rendered[143][field]=[['foreign','999']];a.throws(()=>validateSteps(r),new RegExp(valid?field+' display':'invalid stale '+field));});
 test(`${name}: ${valid?'percent':'input error'} mismatch rejected`,()=>{const r=copy(normal);r.steps[i].rendered[143][valid?'percent':'invalid']='wrong';a.throws(()=>validateSteps(r),new RegExp(valid?'percent display':'input error'));});
 if(i)test(`${name}: focus loss rejected`,()=>{const r=copy(normal);for(const id of [142,143,144])r.steps[i].rendered[id].activeKey=null;a.throws(()=>validateSteps(r),/focus/);});
}
test('step omission rejected',()=>{const r=copy(normal);r.steps.splice(1,1);a.throws(()=>validateSteps(r),/step sequence/);});
test('step reordering rejected',()=>{const r=copy(normal);[r.steps[1],r.steps[2]]=[r.steps[2],r.steps[1]];a.throws(()=>validateSteps(r),/step sequence/);});
test('undefined rendered text rejected',()=>{const r=copy(normal);r.steps[0].rendered[142].text='undefined is not an initialized exhibit';a.throws(()=>validateSteps(r),/rendered content/);});
