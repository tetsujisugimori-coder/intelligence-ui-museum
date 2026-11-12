import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {defineConfig} from '../../.work/v10/node_modules/vite/dist/node/index.js';
import tailwindcss from '../../.work/v10/node_modules/@tailwindcss/vite/dist/index.mjs';
const condition=process.env.SEVENTH_CONDITION, instrumentation=process.env.SEVENTH_INSTRUMENTATION||'plain';
if(!['A','B','C','D'].includes(condition)||!['plain','tapped'].includes(instrumentation))throw Error('invalid build condition');
const out=path.resolve(process.env.SEVENTH_BUILD_ROOT||'../../.work/seventh-build',instrumentation,condition),hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const targets=[
 {suffix:'/@openai/apps-sdk-ui/dist/es/components/Select/Select.js',name:'select',from:'onEscapeKeyDown: preventDefaultHandler',to:'onEscapeKeyDown: () => {}',active:['C','D'],taps:[['const handleOpenChange = (maybeNextState) => {','const handleOpenChange = (maybeNextState) => { const round7Close = globalThis.seventh?.callsite("select-open-request", { maybeNextState });'],['setTimeout(() => {\n                // This should never happen','globalThis.seventh?.callsite("select-focus-timer-scheduled", { closeId:round7Close }); setTimeout(() => { globalThis.seventh?.callsite("select-focus-timer-fired", { closeId:round7Close, hasContent:!!selectContentRef.current });\n                // This should never happen'],['useEscCloseStack(open, () => {','useEscCloseStack(open, () => { globalThis.seventh?.callsite("select-hook-close");'],['onOpenChange: (nextState) => {','onOpenChange: (nextState) => { globalThis.seventh?.callsite("select-radix-open-change", { nextState });']]},
 {suffix:'/@openai/apps-sdk-ui/dist/es/hooks/useEscCloseStack.js',name:'hook',from:'            evt.preventDefault();',to:'            /* round7 downstream cancellation omitted */',active:['B','D'],taps:[['firstHandler.callback.current?.();','globalThis.seventh?.callsite("hook-callback"); firstHandler.callback.current?.();']]},
 {suffix:'/@radix-ui/react-dismissable-layer/dist/index.mjs',name:'radix',taps:[['      onEscapeKeyDown?.(event);','      globalThis.seventh?.callsite("radix-handler-before", { defaultPrevented:event.defaultPrevented }); onEscapeKeyDown?.(event); globalThis.seventh?.callsite("radix-handler-after", { defaultPrevented:event.defaultPrevented });'],['        onDismiss();','        globalThis.seventh?.callsite("radix-onDismiss-before"); onDismiss(); globalThis.seventh?.callsite("radix-onDismiss-after");']]}
];
let seen=new Set();
export default defineConfig({base:'./',plugins:[tailwindcss(),{name:'round7-isolated-factorial',enforce:'pre',transform(code,id){
 const t=targets.find(t=>id.replaceAll('\\','/').endsWith(t.suffix));if(!t)return;
 if(seen.has(t.name))throw Error('duplicate module');seen.add(t.name);let changed=code;
 if(t.from){if(code.split(t.from).length!==2)throw Error('target changed');if(t.active.includes(condition))changed=changed.replace(t.from,t.to);}
 if(instrumentation==='tapped')for(const [from,to]of t.taps){if(changed.split(from).length!==2)throw Error('tap changed '+t.name);changed=changed.replace(from,to);}
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,t.name+'-module.js.txt'),changed);fs.writeFileSync(path.join(out,t.name+'-intervention.json'),JSON.stringify({condition,instrumentation,sourceSha256:hash(code),transformedSha256:hash(changed),target:t},null,2));
 return {code:changed,map:null};
},closeBundle(){if(seen.size!==3)throw Error('missing modules');}}],build:{outDir:path.join(out,'dist'),emptyOutDir:false,sourcemap:true}});
