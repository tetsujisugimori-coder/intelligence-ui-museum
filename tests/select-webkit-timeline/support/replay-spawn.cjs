'use strict';
// Replace only the browser child, keeping the production wrapper and its exit
// path intact. The fixture child is a real separate process with a real exit.
const cp=require('node:child_process'),path=require('node:path'),spawn=cp.spawnSync;
cp.spawnSync=function(exe,args,opts){return spawn.call(this,process.execPath,[path.join(__dirname,'replay-child.cjs')],{...opts,env:{...opts.env,NODE_OPTIONS:''}});};
