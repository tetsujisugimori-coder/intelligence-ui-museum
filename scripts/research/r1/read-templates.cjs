const fs=require('node:fs'), vm=require('node:vm');
// Analyze only trusted, fixed museum source taken from the checked-out Git baseline.
// This runs template construction, not event handlers or a real browser.
const path=(process.argv[2]??'apps/v11')+'/';
const html=fs.readFileSync(path+'index.html','utf8');
const dataset=html.match(/<script id="dataset" type="application\/json">([\s\S]*?)<\/script>/)[1];
const noop=()=>{};
const target={dataset:{},classList:{add:noop,toggle:noop},addEventListener:noop,append:noop,appendChild:noop};
const document={addEventListener:noop,createElement:()=>({...target}),querySelector:s=>s==='#dataset'?{textContent:dataset}:{...target}};
const box={document,addEventListener:noop,matchMedia:()=>({addEventListener:noop,matches:false}),console:{error:noop}};
box.window=box;
vm.createContext(box);
for(const m of html.matchAll(/<script src="([^"]+)"\s*><\/script>/g)){
 if(!/^[a-z0-9-]+\.js$/.test(m[1]))throw Error('unexpected source include');
 vm.runInContext(fs.readFileSync(path+m[1],'utf8'),box,{filename:m[1],timeout:1000});
}
const inline=html.slice(html.lastIndexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/render\(\);syncMotion\(\);q\('#script-status'\)\.hidden=true;\s*$/,'');
vm.runInContext(inline,box,{filename:'index-inline.js',timeout:1000});
const records=vm.runInContext('items.map(x=>({id:x.id,name:x.name,description:(x.id>=127?museumDescription(x.name,descriptions):descriptions[x.name])??null,stage:demo(x)}))',box);
if(records.length!==Number(process.argv[3]??168)||records.some(x=>!x.stage||/resource-missing/.test(x.stage)))throw Error('Missing exhibit');
process.stdout.write(JSON.stringify(records));
