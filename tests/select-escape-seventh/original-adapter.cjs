'use strict';
// Reuse immutable original prelude and pixel measurement, not an acceptance shortcut.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const file=path.join(__dirname,'../select-webkit-timeline/original-browser.cjs');
const source=fs.readFileSync(file,'utf8');
const sha=crypto.createHash('sha256').update(source).digest('hex');
if(sha!=='a2dab597ff18fb5708a5b12d0b1628b59a50d29774aa18c7dd59b114edb30bf1')throw Error('Original runner hash changed');
const helpers=source.slice(source.indexOf('function visible(e)'),source.indexOf('const server=http'));
const prelude=source.slice(source.indexOf("    await check('environment'"),source.indexOf("    await check('Select'"));
module.exports=env=>new Function(...Object.keys(env),`${helpers}\nreturn {ring,prelude:async function(p,id,row,check){const theme='light',text=100,width=375;${prelude}}};`)(...Object.values(env));
