// Bounded rendering fixtures for the exact production-runner pixel evaluator.
// Official component interactions remain covered by smoke/matrix entry points.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {focusPixels}=require('./stage2r-focus-pixels.cjs');
const modules=process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,pw=require(path.join(modules,'playwright'));
const out=path.resolve(process.env.EVIDENCE_DIR||'evidence/focus-controls');fs.mkdirSync(out,{recursive:true});
const cases=[
 ['after',true,''],
 ['body',true,'#Select .stage [role=button]{outline:3px solid magenta;outline-offset:2px} #Select .stage [role=button]::after{outline:none;box-shadow:none}'],
 ...['display:none','visibility:hidden','opacity:0'].map(css=>['body-with-'+css,true,'#Select .stage [role=button]{outline:3px solid magenta;outline-offset:2px} #Select .stage [role=button]::after{'+css+'}']),
 ['shadow',true,'#Select .stage [role=button]::after{outline:none;box-shadow:0 0 0 3px #0169cc}'],
 ['safe-clip',true,'#Select .stage [role=button]{clip-path:inset(-12px)}'],
 ['pseudo-inset',true,'#Select .stage [role=button]::after{inset:6px}'],
 ['ancestor-overflow-visible-ring',true,'#Select .stage{overflow:hidden}'],
 ['missing',false,'#Select .stage [role=button],#Select .stage [role=button]::after{outline:none;box-shadow:none}'],
 ['visibility',false,'#Select .stage [role=button]::after{visibility:hidden}'],
 ['opacity',false,'#Select .stage [role=button]::after{opacity:0}'],
 ['transparent',false,'#Select .stage [role=button]::after{outline-color:transparent;box-shadow:0 0 0 3px transparent}'],
 ['clipped',false,'#Select .stage [role=button]{clip-path:inset(4px round 999px)!important}'],
 ['ancestor-clip',false,'#Select .stage{clip-path:inset(0 0 100% 0)}'],
 ['ancestor-overflow-loss',false,'#Select .stage{overflow:hidden;padding:0} #Select .stage [role=button]{width:100%;height:100%} #Select .stage [role=button]::after{border-radius:0}'],
 ['unknown',false,'#Select .stage [role=button]{filter:brightness(1)}']
];
const records=[];
(async()=>{try{for(const engine of ['chromium','webkit']){
 const browser=await pw[engine].launch(engine==='webkit'?{executablePath:process.env.WEBKIT_EXECUTABLE,headless:true}:{headless:true,args:['--no-sandbox'],...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
 try{for(const [name,expected,css] of cases){
  const p=await browser.newPage({viewport:{width:390,height:400}});
  try{
   await p.setContent(`<style>body{margin:0;background:white}#Select{padding:60px 30px}.stage{padding:16px;width:280px;height:100px;box-sizing:border-box}#Select .stage [role=button]{position:relative;display:inline-flex;align-items:center;width:200px;height:40px;box-sizing:border-box;background:#eee;border:0;outline:none;color:#111}#Select .stage [role=button]::after{content:"";position:absolute;inset:0;outline:2px solid #0169cc;border-radius:8px;pointer-events:none}${css}</style><section id="Select"><div class="stage"><span role="button" tabindex="0">表示モード 一覧</span></div></section>`);
   const control=p.locator('[role=button]');await control.focus();await p.keyboard.press('Tab');await p.keyboard.press('Shift+Tab');
   const result=await focusPixels(p,control,modules,path.join(out,`${engine}-${name.replace(/:/g,'-')}`));
   const record={engine,browser:browser.version(),name,expected,result,pass:result.pass===expected};records.push(record);
   assert.equal(result.pass,expected,`${engine}/${name}: unexpected rendered verdict`);
   if(name==='unknown')assert.equal(result.status,'UNVERIFIED');
  }finally{await p.close();}
 }}finally{await browser.close();}
}assert.equal(records.length,cases.length*2);}catch(e){console.error(e);process.exitCode=1;}finally{fs.writeFileSync(path.join(out,'focus-controls.json'),JSON.stringify({scope:'rendering fixtures, not product interaction or WCAG conformance',records,status:records.length===cases.length*2&&records.every(r=>r.pass)?'PASS':'FAIL'},null,2));}})();
