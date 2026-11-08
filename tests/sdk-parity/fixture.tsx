import './style.css';
import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Select} from '@openai/apps-sdk-ui/components/Select';
import {attachSelectFocusReturn} from './select-focus-return';
const query=new URLSearchParams(location.search);
const condition=query.get('condition')||'native';
const measure=import.meta.env.VITE_MEASURE||'detail';
const w=window as any;
w.__parity={condition,measure,events:[],seq:0};
if(measure!=='none')w.__pLog=(kind:string,extra:any={})=>w.__parity.events.push({seq:++w.__parity.seq,time:performance.now(),kind,active:document.activeElement?.id||document.activeElement?.tagName,...extra});
if(measure!=='none'){
 for(const kind of ['keydown','keyup'])document.addEventListener(kind,(e:KeyboardEvent)=>{if(e.key==='Escape')w.__pLog(kind,{cancelled:e.defaultPrevented,trusted:e.isTrusted});},true);
 document.addEventListener('keydown',(e:KeyboardEvent)=>{if(e.key==='Escape')w.__pLog('keydown-final',{cancelled:e.defaultPrevented});});
 new MutationObserver(()=>w.__pLog('observer-dom',{popup:!!document.querySelector('[role="dialog"]'),expanded:document.querySelector('[role="button"]')?.getAttribute('aria-expanded')})).observe(document.documentElement,{subtree:true,childList:true});
 document.addEventListener('focusin',(e)=>w.__pLog('focusin',{target:(e.target as HTMLElement).id}),true);
}
function Trigger({label}:{label:string}){const ref=useRef<HTMLSpanElement>(null);useEffect(()=>{const t=ref.current?.closest<HTMLElement>('[role="button"]');if(t){t.dataset.parityTrigger='true';return attachSelectFocusReturn(t);}},[]);return <span ref={ref}>{label}</span>;}
function App(){const [value,setValue]=useState('a');return <main><button id="before">Before</button><section><Select id="sdk-input" value={value} TriggerView={Trigger} options={[{value:'a',label:'一覧'},{value:'b',label:'カード'}]} onChange={o=>setValue(o.value)}/><output id="value">{value}</output></section><button id="after">After</button></main>;}
createRoot(document.getElementById('root')!).render(<App/>);
