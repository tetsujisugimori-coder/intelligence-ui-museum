'use strict';
// Synthetic transport regression only, not real-browser evidence.
const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const {verifyTrace}=require('./wave6-audit.cjs');
test('large observation transfers only required identity and retains trace/HAR identity rejection',()=>{
 a.ok(process.env.TMPDIR&&!path.resolve(process.env.TMPDIR).startsWith('/tmp'),'dedicated TMPDIR required');
 const d=fs.mkdtempSync(path.join(process.env.TMPDIR,'wave6-transport-')),id='fault-synthetic';
 const events=[{type:'context-options',browserName:'chromium',options:{viewport:{width:375,height:1000},hasTouch:true,reducedMotion:'no-preference'}},{type:'before',method:'goto',pageId:'p1',params:{url:'http://fixture.invalid/?wave6-condition='+id}},{type:'frame-snapshot'},{type:'after'},{type:'after'}];
 cp.execFileSync('python3',['-c',"import sys,json,zipfile; z=zipfile.ZipFile(sys.argv[1],'w'); z.writestr('test.trace','\\n'.join(json.dumps(x) for x in json.load(sys.stdin))); z.close()",path.join(d,id+'.zip')],{input:JSON.stringify(events)});
 fs.writeFileSync(path.join(d,id+'.har'),JSON.stringify({log:{pages:[{id:'p1'}],entries:[{pageref:'p1'}]}}));
 const row={id,engine:'chromium',width:375,zoom:1,observation:'x'.repeat(300000)};
 a.doesNotThrow(()=>verifyTrace(d,row));
 for(const changed of [{engine:'webkit'},{width:390},{zoom:2}])a.throws(()=>verifyTrace(d,{...row,...changed}),/AssertionError/);
 fs.writeFileSync(path.join(d,id+'.har'),JSON.stringify({log:{pages:[{id:'foreign'}],entries:[{pageref:'foreign'}]}}));
 a.throws(()=>verifyTrace(d,row),/AssertionError/);
});
