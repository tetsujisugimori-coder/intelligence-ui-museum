import {defineConfig} from 'vite';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const mode=process.env.VITE_MEASURE||'detail', records=[];let currentFile='';
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const log=(kind,extra='{}')=>mode==='detail'?`window.__pLog?.(${JSON.stringify(kind)},Object.assign({source:${JSON.stringify(currentFile)}},${extra}));`:'';
function change(code,from,to){if(code.split(from).length!==2)throw Error('Expected one intervention anchor: '+from);return code.replace(from,to);}
export default defineConfig({base:'./',plugins:[tailwindcss(),{name:'isolated-sdk-observation',enforce:'pre',transform(code,id){
 const file=id.replaceAll('\\','/').split('?')[0];let out=code;currentFile=file.includes('/node_modules/')?file.split('/node_modules/').slice(1).join('/node_modules/'):path.basename(file);
 if(file.endsWith('/components/Select/Select.js')){
  out=change(out,'onEscapeKeyDown: preventDefaultHandler',`onEscapeKeyDown: (event)=>{${log('select-escape-before','{cancelled:event.defaultPrevented,stack:new Error().stack}')}if(window.__parity.condition!=='paired-plain'){${log('cancel-call','{owner:"select"}')}event.preventDefault();}${log('select-escape-after','{cancelled:event.defaultPrevented}')}}`);
  if(mode==='detail')out=change(out,'const selectContentRef = useRef(null);',`const selectContentRef = useRef(null);useLayoutEffect(()=>{${log('react-layout-after-commit','{open}')}},[open]);`);
  out=change(out,'onOpenChange: (nextState) => {',`onOpenChange: (nextState) => {${log('radix-on-open-change','{nextState,stack:new Error().stack}')}`);
  out=change(out,'setOpen(nextState);',`${log('react-close-request','{nextState,stack:new Error().stack}')}setOpen(nextState);`);
  out=change(out,'handleOpenChange(false);\n    });',`${log('esc-stack-close')}handleOpenChange(false);\n    });`);
 }else if(file.endsWith('/hooks/useEscCloseStack.js')){
  out=change(out,'evt.preventDefault();',`${log('stack-before','{cancelled:evt.defaultPrevented,stack:new Error().stack}')}if(window.__parity.condition==='native'){${log('cancel-call','{owner:"esc-stack"}')}evt.preventDefault();}${log('stack-after','{cancelled:evt.defaultPrevented}')} `);
 }else if(file.endsWith('/react-dismissable-layer/dist/index.mjs')){
  out=change(out,'onEscapeKeyDown?.(event);',`${log('radix-escape','{cancelled:event.defaultPrevented,stack:new Error().stack}')}onEscapeKeyDown?.(event);`);
  out=change(out,'if (!event.defaultPrevented && onDismiss) {',`${log('radix-fallback-gate','{cancelled:event.defaultPrevented,hasDismiss:!!onDismiss,suppressed:window.__parity.condition!=="native"}')}if (!event.defaultPrevented && onDismiss && window.__parity.condition==='native') {`);
  out=change(out,'event.preventDefault();\n        onDismiss();',`${log('radix-fallback')}event.preventDefault();\n        onDismiss();`);
 }else if(file.endsWith('/select-focus-return.ts')){
  out=change(out,"const next = trigger.getAttribute('aria-expanded') === 'true';",`${log('museum-observer')}const next = trigger.getAttribute('aria-expanded') === 'true';`);
  out=change(out,'trigger.focus({ preventScroll: true });',`${log('museum-focus-return')}trigger.focus({ preventScroll: true });`);
 }
 if(out!==code){const name=file.includes('/node_modules/')?file.split('/node_modules/').slice(1).join('/node_modules/'):path.basename(file);records.push({file:name,before:hash(code),after:hash(out),original:code,transformed:out});return {code:out,map:null};}
 },closeBundle(){fs.mkdirSync('provenance',{recursive:true});fs.writeFileSync(`provenance/${mode}.json`,JSON.stringify({mode,records},null,2));}}],build:{outDir:`dist-${mode}`,sourcemap:true}});
