const path=require('node:path'),assert=require('node:assert/strict');
for(const [name,mod,root] of [['posix',path.posix,'/tmp/example-root'],['win32',path.win32,'C:\\temp\\example-root']]) {
 const inside=mod.resolve(root,'.'+'/sub/file.html'), sibling=mod.resolve(root,'.'+'/../example-root-other/secret'), outside=mod.resolve(root,'.'+'/../secret');const permitted=p=>p===root||p.startsWith(root+mod.sep);
 assert(permitted(inside));assert(!permitted(sibling));assert(!permitted(outside));console.log(name,JSON.stringify({inside,sibling,outside,pass:true}));
}
