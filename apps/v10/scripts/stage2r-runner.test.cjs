const {test}=require('node:test');const assert=require('node:assert/strict');const {spawnSync}=require('node:child_process');const fs=require('node:fs');const {failures,MATRIX_CHECKS,BASE_CHECKS}=require('./stage2r-result.cjs');
function matrix(){const r={finished:'fixture',failures:[],conditions:[]};for(const engine of ['chromium','webkit'])for(const width of [320,375,390,1280])for(const theme of ['light','dark'])for(const text of [100,200])r.conditions.push({engine,width,theme,text,mode:'root',checks:MATRIX_CHECKS.map(name=>({name,pass:true,...(name==='JavaScript errors'?{detail:[]}: {})}))});for(const width of [320,375,390,1280])for(const theme of ['light','dark'])r.conditions.push({engine:'chromium',width,theme,text:200,mode:'browser-font',checks:MATRIX_CHECKS.map(name=>({name,pass:true,...(name==='JavaScript errors'?{detail:[]}: {})}))});return r;}
test('complete GREEN matrix',()=>assert.deepEqual(failures(matrix(),'matrix'),[]));
for(const [name,change] of Object.entries({assert:r=>r.conditions[0].checks[0].pass=false,engine:r=>r.failures.push({engine:'chromium'}),missing:r=>r.conditions.pop(),duplicate:r=>r.conditions[1]=r.conditions[0],unfinished:r=>delete r.finished,empty:r=>r.conditions[0].checks=[],missingAssert:r=>r.conditions[0].checks.pop(),fakeGreen:r=>r.conditions[0].checks=[{name:'fixture',pass:true}],duplicateAssert:r=>r.conditions[0].checks[1]=r.conditions[0].checks[0],error:r=>r.conditions[0].error='boom',unexpected:r=>r.conditions[0].width=999}))test('reject '+name,()=>{const r=matrix();change(r);assert(failures(r,'matrix').length)});
test('only explicit original visibility RED permitted',()=>{const r=matrix(),b={engine:'chromium',width:320,theme:'light',text:200,mode:'root',prefix:'before/',checks:BASE_CHECKS.map(name=>({name,pass:name!=='Button full visibility',...(name==='JavaScript errors'?{detail:[]}: {})}))};r.conditions.push(b);assert.deepEqual(failures(r,'matrix'),[]);b.checks.push({name:'JavaScript errors',pass:false});assert(failures(r,'matrix').length)});
test('nonreproduced baseline RED fails',()=>{const r=matrix();r.conditions.push({...r.conditions[0],width:320,text:200,prefix:'before/'});assert(failures(r,'matrix').length)});
test('smoke noJS count and incomplete reports fail',()=>{assert(failures({finished:'x',conditions:[{engine:'chromium',noJS:true,cards:0}],failures:[]},'smoke').length)});
// Exercise the real runner entry/finalizer in an isolated subprocess. No sockets/browsers.
// Legacy source is read from git, not changed or kept as an intentional failing product test.
function probe(source){const program=`const vm=require('vm');const path=require('path');const native=require;const server={listen(...args){args.at(-1)()},address(){return {port:1}},close(){}};vm.runInNewContext(${JSON.stringify(source)},{require:n=>n==='http'?{createServer:()=>server}:n==='fs'?{mkdirSync(){},writeFileSync(){}}:n.includes('playwright')?{chromium:{launch:async()=>{throw Error('isolated launch failure')}},webkit:{launch:async()=>{throw Error('isolated launch failure')}}}:n==='./stage2r-result.cjs'?native(path.resolve('scripts/stage2r-result.cjs')):native(n),process,console:{log(){},error(){}},URL});`;return spawnSync(process.execPath,['-e',program],{encoding:'utf8'});}
for(const file of ['stage2r-browser.cjs','stage2r-smoke.cjs'])test(file+' real entry launch failure -> nonzero',()=>{const p=probe(fs.readFileSync('scripts/'+file,'utf8'));assert.equal(p.status,1,p.stderr)});
if(process.argv.includes('--legacy-evidence')){const legacy=spawnSync('git',['show','daa42f25dfadd22a1deb5fcbe8c6f98c75a2397f:scripts/stage2r-browser.cjs'],{encoding:'utf8'});const red=probe(legacy.stdout);const green=probe(fs.readFileSync('scripts/stage2r-browser.cjs','utf8'));console.log(JSON.stringify({scope:'isolated actual entry, injected engine launch failure, no browser',legacyExit:red.status,fixedExit:green.status}));assert.equal(red.status,0);assert.equal(green.status,1);}

// Exercise the real smoke entry with a controlled browser model. These are not product/browser tests.
for(const [name,env,expected] of [
 ['normal',{},0], ['reopen failure',{ALERT_FAULT:'1'},1], ['six-components pageerror',{PAGE_ERROR:'1'},1]
]) test('smoke synthetic '+name+' propagates',()=>{
 const p=spawnSync(process.execPath,['scripts/stage2r-smoke-fault-probe.cjs'],{encoding:'utf8',env:{...process.env,...env}});
 assert.equal(p.status,expected,p.stderr);const report=JSON.parse(p.stdout.trim());assert.equal(report.captures[0].conditions.length,12);
});

test('matrix rejects late or missing pageerror evidence',()=>{const r=matrix(),js=r.conditions[0].checks.find(x=>x.name==='JavaScript errors');js.detail.push('late pageerror');assert(failures(r,'matrix').length);js.detail=[];assert.deepEqual(failures(r,'matrix'),[]);delete js.detail;assert(failures(r,'matrix').length)});

test('matrix rejects skipped conditions even if checks appear green',()=>{for(const change of [x=>x.status='SKIP',x=>x.skipped=true,x=>x.skip=true]){const r=matrix();change(r.conditions[0]);assert(failures(r,'matrix').length)}});
test('smoke noJS rejects skipped conditions and preserves normal',()=>{const raw={finished:'fixture',failures:[],conditions:['chromium','webkit'].flatMap(engine=>[...[320,375,390,1280].map(width=>({engine,width,status:'PASS',errors:[],checks:['117 rendered cards','search, category switching','theme','Modal open/Escape','Primary and Select interactions (3 exhibits including Modal)']})),{engine,sixComponents:true,status:'PASS',errors:[],checks:['Badge','Switch','Tooltip visible on hover and hidden after Escape','Alert color/close/reopen','already-loaded offline Button']},{engine,noJS:true,cards:117,errors:[]}])};assert.deepEqual(failures(raw,'smoke'),[]);for(const change of [x=>x.status='SKIP',x=>x.skipped=true,x=>x.skip=true]){const r=structuredClone(raw);change(r.conditions.find(x=>x.noJS));assert(failures(r,'smoke').length)}});

test('matrix rejects a skipped assertion even if pass is true',()=>{const r=matrix();r.conditions[0].checks[0].skipped=true;assert(failures(r,'matrix').length)});

// Exercise both real HTTP handlers against a real link to a sibling directory.
test('both browser servers reject a link escaping the app root',()=>{
 const vm=require('node:vm'),os=require('node:os'),path=require('node:path'),base=fs.mkdtempSync(path.join(os.tmpdir(),'museum-boundary-'));
 const realTemp=fs.realpathSync(os.tmpdir()),realBase=fs.realpathSync(base),rel=path.relative(realTemp,realBase);
 assert(rel && rel!=='..' && !rel.startsWith('..'+path.sep) && !path.isAbsolute(rel));
 const root=path.join(base,'root'),outside=path.join(base,'outside'),link=path.join(root,'escape');fs.mkdirSync(root);fs.mkdirSync(outside);fs.writeFileSync(path.join(root,'inside.txt'),'inside');fs.writeFileSync(path.join(outside,'marker.txt'),'outside');fs.symlinkSync(outside,link,process.platform==='win32'?'junction':'dir');
 try{for(const file of ['stage2r-smoke.cjs','stage2r-browser.cjs']){
  let handler;const server={listen(...a){a.at(-1)()},address(){return {port:1}},close(){}};const fakeProcess={env:{CODEX_PRIMARY_RUNTIME_NODE_MODULES:'fixture',APP_ROOT:root,EVIDENCE_DIR:base},exitCode:0};
  const shimFs={...fs,mkdirSync(){},writeFileSync(){}};const fakePw={chromium:{launch:async()=>{throw Error('fixture launch')}},webkit:{launch:async()=>{throw Error('fixture launch')}}};
  vm.runInNewContext(fs.readFileSync('scripts/'+file,'utf8'),{require:n=>n==='http'?{createServer:h=>(handler=h,server)}:n==='fs'?shimFs:n.includes('playwright')?fakePw:n==='./stage2r-result.cjs'?{failures:()=>[]}:require(n),process:fakeProcess,console:{log(){},error(){}},URL});
  function request(url){const res={statusCode:200,setHeader(){},end(data){this.body=data?.toString()||''}};handler({url},res);return res}
  const inside=request('/inside.txt');assert.equal(inside.statusCode,200,file);assert.equal(inside.body,'inside',file);
  const escaped=request('/escape/marker.txt');assert.equal(escaped.statusCode,403,file);assert.equal(escaped.body,'',file);
 }}finally{if(process.platform==='win32')fs.rmdirSync(link);else fs.unlinkSync(link);fs.unlinkSync(path.join(root,'inside.txt'));fs.unlinkSync(path.join(outside,'marker.txt'));fs.rmdirSync(root);fs.rmdirSync(outside);fs.rmdirSync(base)}
});
