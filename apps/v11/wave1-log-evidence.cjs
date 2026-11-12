'use strict';
// A byte-preserving secondary transfer of results when artifact download is
// unavailable. This is not the original GitHub ZIP and does not attest its CRC.
const fs=require('node:fs'),crypto=require('node:crypto');
const bytes=fs.readFileSync(process.argv[2]),encoded=bytes.toString('base64');
console.log('WAVE1_JSON_META '+JSON.stringify({bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')}));
for(let offset=0;offset<encoded.length;offset+=8192)console.log('WAVE1_JSON_CHUNK '+(offset/8192)+' '+encoded.slice(offset,offset+8192));
