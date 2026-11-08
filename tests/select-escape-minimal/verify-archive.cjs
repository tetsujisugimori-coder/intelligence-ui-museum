'use strict';
// The expected digest must come from authenticated GitHub artifact metadata,
// never from an editable file in the ZIP being checked.
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const [file,expected]=process.argv.slice(2);
assert.ok(file&&/^(sha256:)?[a-f0-9]{64}$/.test(expected||''),'ZIP path and externally obtained SHA256 required');
const actual=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
assert.equal(actual,expected.replace(/^sha256:/,''),'external archive digest mismatch');
console.log('External ZIP SHA256 verified: '+actual);
