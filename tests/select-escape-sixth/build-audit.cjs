'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
function auditBuild(root){
 const modules=['A','B'].map(c=>fs.readFileSync(path.join(root,c,'sdk-module.js.txt'),'utf8'));
 const from='            evt.preventDefault();',to='            /* round6: only this Escape cancellation omitted */';
 assert.equal(modules[0].split(from).length,2);assert.equal(modules[0].replace(from,to),modules[1]);
 const maps=['A','B'].map(c=>{const dir=path.join(root,c,'dist/assets'),names=fs.readdirSync(dir).filter(f=>f.endsWith('.js.map'));assert.equal(names.length,1);return JSON.parse(fs.readFileSync(path.join(dir,names[0])));});
 assert.deepEqual(maps[0].sources,maps[1].sources);
 const differences=maps[0].sources.filter((s,i)=>maps[0].sourcesContent[i]!==maps[1].sourcesContent[i]);
 // Vite can retain input rather than transformed text in sourcemaps; the separately
 // saved transform bodies are authoritative. No unrelated source may differ.
 assert(differences.every(s=>s.endsWith('/hooks/useEscCloseStack.js')));
 const css=['A','B'].map(c=>{const dir=path.join(root,c,'dist/assets'),f=fs.readdirSync(dir).find(f=>f.endsWith('.css'));return fs.readFileSync(path.join(dir,f),'utf8');});assert.equal(css[0],css[1]);
 return {pass:true,changedCalls:1,sourceCount:maps[0].sources.length,sourcemapDifferences:differences,cssIdentical:true};
}
module.exports={auditBuild};if(require.main===module)console.log(JSON.stringify(auditBuild(process.argv[2]),null,2));
