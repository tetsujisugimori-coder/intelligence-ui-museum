"use strict";
const fourth=require('./fourth-source.cjs'),crypto=require('node:crypto');
function build({engine='webkit',focus='legacy',repeats=20,lifecycle='reuse',settling='original'}={}){
 if(!['reuse','fresh'].includes(lifecycle)||!['original','raf2'].includes(settling))throw Error('Invalid fifth condition');
 const original=fourth.build({engine,focus,repeats});let code=original.code;
 const replace=(a,b)=>{if(code.split(a).length!==2)throw Error('Nonunique fifth anchor');code=code.replace(a,b);};
 if(lifecycle==='fresh'){
 const from=`const b=await pw[engine].launch({headless:true,...(engine==='chromium'&&process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});try{for(let attempt=1;attempt<=${repeats};attempt++)await condition(b,engine,375,'light',100,\`http://127.0.0.1:\${server.address().port}\`,attempt);}finally{await b.close();}`;
 const to=`for(let attempt=1;attempt<=${repeats};attempt++){const b=await pw[engine].launch({headless:true,...(engine==='chromium'&&process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});try{await condition(b,engine,375,'light',100,\`http://127.0.0.1:\${server.address().port}\`,attempt);}finally{await b.close();}}`;
 replace(from,to);
 }
 if(settling==='raf2')replace("await p.getByRole('option',{name:'カード',exact:true}).click();","await p.getByRole('option',{name:'カード',exact:true}).waitFor();await frames(p);await p.getByRole('option',{name:'カード',exact:true}).click();");
 return {...original,code,runnerHash:crypto.createHash('sha256').update(code).digest('hex'),lifecycle,settling};
}
module.exports={build};
