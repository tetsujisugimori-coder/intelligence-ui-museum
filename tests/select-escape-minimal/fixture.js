'use strict';
// MODELED browser behavior only. No Radix/SDK code is loaded or reimplemented verbatim.
(function(){
  const cases=Object.freeze({
    'controlled-cancel':{select:true,selectCancel:true,hook:false,fallback:false},
    'controlled-plain': {select:true,selectCancel:false,hook:false,fallback:false},
    'delegated-fallback':{select:false,selectCancel:false,hook:false,fallback:true},
    'delegated-open': {select:false,selectCancel:false,hook:false,fallback:false},
    'hook-cancel':{select:true,selectCancel:false,hook:true,fallback:false}
  });
  const name=new URLSearchParams(location.search).get('case');
  if(!Object.prototype.hasOwnProperty.call(cases,name))throw Error('Unrecognized model case');
  const cfg=cases[name],trigger=document.querySelector('#trigger'),
    menu=document.querySelector('#menu'),choice=document.querySelector('#choice');
  let open=false,observedOpen=false,closingIntent=false,closeOwner=null,lastEscape=null;
  const events=[],log=(kind,extra={})=>events.push({seq:events.length+1,kind,ms:performance.now(),...extra});
  const close=owner=>{
    log('close-request',{owner});
    if(!open){log('close-ignored',{owner});return;}
    closeOwner=owner;closingIntent=true;open=false;
    menu.hidden=true;trigger.setAttribute('aria-expanded','false');
    if(document.activeElement===choice)choice.blur();
    log('close-commit',{owner});
  };
  trigger.addEventListener('click',()=>{
    if(open)return;
    open=true;menu.hidden=false;trigger.setAttribute('aria-expanded','true');
    log('open');
  });
  document.addEventListener('focusin',e=>{
    if(lastEscape)log('focusin',{target:e.target.id||e.target.tagName});
  },true);
  document.addEventListener('keydown',e=>{
    if(e.key!=='Escape'||!open)return;
    if(lastEscape)throw Error('duplicate Escape');
    lastEscape=e;
    log('keydown-capture',{trusted:e.isTrusted});
    if(cfg.select){
      log('select-handler');
      if(cfg.selectCancel){e.preventDefault();log('prevent-default',{owner:'select'});}
      if(cfg.hook){log('hook-handler');e.preventDefault();log('prevent-default',{owner:'hook'});close('hook');}
      else close('select-controlled');
    }
  },true);
  document.addEventListener('keydown',e=>{
    if(e.key!=='Escape'||lastEscape!==e)return;
    if(!cfg.select&&cfg.fallback){
      log('fallback-handler');
      if(!e.defaultPrevented){e.preventDefault();log('prevent-default',{owner:'fallback-model'});}
      close('fallback-model');
    }
    log('keydown-bubble',{cancelled:e.defaultPrevented});
  },false);
  document.addEventListener('keyup',e=>{
    if(e.key==='Escape'&&lastEscape)log('keyup',{trusted:e.isTrusted});
  },true);
  const observer=new MutationObserver(()=>{
    const next=trigger.getAttribute('aria-expanded')==='true';
    if(next===observedOpen)return;
    log('mutation',{from:observedOpen,to:next});
    if(observedOpen&&!next&&closingIntent&&document.activeElement===document.body){
      trigger.focus({preventScroll:true});
      log('focus-return',{owner:'model-mutation'});
    }
    observedOpen=next;closingIntent=false;
  });
  observer.observe(trigger,{attributes:true,attributeFilter:['aria-expanded']});
  window.minimalFixture={
    ready:true,
    snapshot:()=>({
      case:name,
      open,expanded:trigger.getAttribute('aria-expanded'),value:'a',
      closeOwner,active:document.activeElement?.id||document.activeElement?.tagName,
      triggerFocused:document.activeElement===trigger,
      focusVisible:trigger.matches(':focus-visible'),
      keydownTrusted:lastEscape?.isTrusted??null,
      keydownCancelled:lastEscape?.defaultPrevented??null,
      preventCount:events.filter(x=>x.kind==='prevent-default').length,
      closeRequests:events.filter(x=>x.kind==='close-request').length,
      focusReturns:events.filter(x=>x.kind==='focus-return').length,
      events:events.filter(x=>x.kind!=='open').map(x=>({seq:x.seq,kind:x.kind,owner:x.owner??null,from:x.from??null,to:x.to??null,trusted:x.trusted??null,target:x.target??null,cancelled:x.cancelled??null}))
    })
  };
})();