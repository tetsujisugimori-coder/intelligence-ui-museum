'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// An isolated copy of the model receives one intentional semantic fault.
// The same literal oracle must accept the unchanged model and reject the mutant.
function load(name, replace) {
  const file = require.resolve('./wave14-' + name + '.js');
  let source = fs.readFileSync(file, 'utf8');
  if (replace) {
    const [from, to] = replace;
    assert.equal(source.split(from).length, 2, 'fault target must match exactly once');
    source = source.replace(from, to);
  }
  const module = {exports: {}};
  vm.runInNewContext(source, {module, structuredClone}, {filename: file, timeout: 1000});
  return module.exports;
}
function compare(name, replacement, oracle) {
  oracle(load(name));
  const damaged = load(name, replacement);
  assert.throws(()=>oracle(damaged), {code:'ERR_ASSERTION'});
}
test('163 rejects a truthiness fault that loses valid zero and false', ()=>{
  compare('mapping',
    ["if (!isData(value)) return invalid('INVALID_VALUE'", "if (!value || !isData(value)) return invalid('INVALID_VALUE'"],
    p=>{
      const result = p.reduce(p.initial(), {type:'preview'}).result;
      assert.equal(result.status, 'valid');
      assert.equal(result.output.visitors, 0);
      assert.equal(result.output.available, false);
    });
});
test('164 rejects a fault that recalculates an already latched Any verdict', ()=>{
  compare('join',
    ['state.decision ?? decide(branches,history,state.rule,state.quorum)', 'decide(branches,history,state.rule,state.quorum)'],
    p=>{
      let s = p.reduce(p.initial(), {type:'input',key:'rule',value:'any'});
      s = p.reduce(s, {type:'start'});
      s = p.reduce(s, {type:'step'});
      assert.equal(s.decision?.branch, 'B');
      s = p.reduce(s, {type:'step'});
      s = p.reduce(s, {type:'step'});
      assert.equal(s.decision?.branch, 'B');
      assert.equal(s.decision?.at, 1);
      assert.equal(s.history.length, 3);
    });
});
test('165 rejects a fault that substitutes shared data for an invisible explicit scope', ()=>{
  compare('scope',
    ["return finish('out-of-scope',{reason:'inaccessible-scope'});","return finish('found',{source:'workflow',value:state.variables.workflow[name],reason:'nearest'});"],
    p=>{
      const s = p.reduce(p.initial(), {type:'input',key:'lookup',value:'branch-b'});
      const result = p.reduce(s, {type:'resolve'}).result;
      assert.equal(result.status, 'out-of-scope');
      assert.equal(result.value, undefined);
    });
});
