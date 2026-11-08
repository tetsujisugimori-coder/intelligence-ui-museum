'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(process.env.SDK_APP||'.work/sdk-parity');if(fs.existsSync(root))throw Error('fresh workspace required');fs.mkdirSync(path.join(root,'src'),{recursive:true});
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');const originals={};
for(const f of ['package.json','package-lock.json','src/select-focus-return.ts']){const b=fs.readFileSync(path.join('apps/v10',f));fs.writeFileSync(path.join(root,f),b);originals['apps/v10/'+f]=sha(b);}
for(const f of ['fixture.tsx','style.css'])fs.copyFileSync(path.join(__dirname,f),path.join(root,'src',f));fs.copyFileSync(path.join(__dirname,'vite.config.mjs'),path.join(root,'vite.config.mjs'));
fs.writeFileSync(path.join(root,'index.html'),'<!doctype html><html><head><meta charset="utf-8"><title>SDK isolated parity</title></head><body><div id="root"></div><script type="module" src="/src/fixture.tsx"></script></body></html>');
fs.writeFileSync(path.join(root,'preserved-originals.json'),JSON.stringify(originals,null,2));console.log(root);
