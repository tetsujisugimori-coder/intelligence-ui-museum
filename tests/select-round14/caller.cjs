'use strict';
const fs=require('node:fs'),path=require('node:path'),{SourceMap}=require('node:module');
function resolveCalls(calls,dist){
 return (calls||[]).map(call=>{
  const frames=[];
  for(const match of (call.stack||'').matchAll(/http:\/\/127\.0\.0\.1:\d+\/(assets\/[^\s():]+\.js):(\d+):(\d+)/g)){
   const [,asset,line,column]=match,mapFile=path.join(dist,asset+'.map');
   if(!fs.existsSync(mapFile))continue;
   const sm=new SourceMap(JSON.parse(fs.readFileSync(mapFile))),entry=sm.findEntry(Number(line)-1,Number(column)-1);
   frames.push({asset,line:Number(line),column:Number(column),source:entry.originalSource||null,sourceLine:Number.isInteger(entry.originalLine)?entry.originalLine+1:null,sourceColumn:Number.isInteger(entry.originalColumn)?entry.originalColumn+1:null,name:entry.name||null});
  }
  const owner=frames[0]?.source?.endsWith('/src/select-focus-return.ts')?'MUSEUM':frames[0]?.source?.includes('/node_modules/')?'SDK_DEPENDENCY':frames[0]?.source?.endsWith('/src/main.tsx')?'MUSEUM':'UNKNOWN';
  return {index:call.index,owner,frames};
 });
}
module.exports={resolveCalls};
