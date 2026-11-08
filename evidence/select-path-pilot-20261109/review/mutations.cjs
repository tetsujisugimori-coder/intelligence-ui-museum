'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path');
const repo=process.argv[2],out=process.argv[3];
const c=require(path.join(repo,'tests/select-path-pilot/contract.cjs'));
const text=fs.readFileSync(path.join(repo,'tests/select-path-pilot/contract.test.cjs'),'utf8');
const fixtureFile=path.join(__dirname,'f07-original-fixture.json');
let base;if(fs.existsSync(fixtureFile))base=JSON.parse(fs.readFileSync(fixtureFile));else{const scope={slots:c.slots};vm.createContext(scope);vm.runInContext(text.slice(text.indexOf('function good'),text.indexOf("test('predeclared")),scope);base=JSON.parse(JSON.stringify(scope.good()));fs.writeFileSync(fixtureFile,JSON.stringify(base,null,2));}
const mutations={missingPaint:r=>delete r.paint,missingPaintImages:r=>{r.paint={pass:true};r.images=[]},noOpenGeometry:r=>{for(const e of r.events){delete e.option;delete e.popup}},wrongPreludeNames:r=>r.checks.forEach(c=>c.name='environment'),noAcquisition:r=>r.operations=[{name:'key',argument:'Space'}],noTrustedPointer:r=>r.events=r.events.filter(e=>!e.kind.startsWith('pointer')),emptyAcquisition:r=>r.operations.push({name:'acquire',argument:'legacy',success:true}),captureError:r=>r.captureError='Injected missing terminal capture'};
const result={baseline:c.classify(base),cases:[]};for(const[name,fn]of Object.entries(mutations)){const row=structuredClone(base);fn(row);result.cases.push({name,row,result:c.classify(row)});}fs.writeFileSync(out,JSON.stringify(result,null,2));console.log(JSON.stringify(result.cases.map(x=>({name:x.name,...x.result})),null,2));
