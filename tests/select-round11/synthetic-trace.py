"""Contract-only fake trace generator; never empirical evidence."""
import io,json,sys,zipfile,runpy
expected=runpy.run_path(sys.argv[3])['expected']
events=[{'type':'context-options','title':sys.argv[1]},{'type':'frame-snapshot'}]
seq=0
def add(method,params,title=None):
    global seq
    seq+=1;ev={'type':'before','callId':str(seq),'method':method,'params':params}
    if title:ev['title']=title
    events.extend([ev,{'type':'after','callId':str(seq)}])
for group in json.loads(sys.argv[2]):
    add('evaluateExpression',{'arg':{'value':{'s':'ROUND11_BEGIN:'+group}}})
    for kind,value in expected(group):
        if kind=='environment':add('evaluateExpression',{'expression':'()=>({focus:document.hasFocus()})'})
        elif kind=='key':add('keyboardPress',{'key':value})
        elif kind=='scroll':add('waitForSelector',{'selector':value},'Scroll into view')
        elif kind=='photo':add('screenshot',{})
        elif kind=='disabled-noop':add('evaluateExpression',{'expression':'e=>e.click()'})
        elif kind=='select':
            selector,val=value.split(':');add('selectOption',{'selector':selector,'options':[{'valueOrLabel':val}]})
        else:add(kind,{'selector':value})
    add('evaluateExpression',{'arg':{'value':{'s':'ROUND11_END:'+group}}})
b=io.BytesIO()
with zipfile.ZipFile(b,'w') as z:
    z.writestr('trace.trace','\n'.join(json.dumps(e) for e in events)+'\n');z.writestr('trace.network','')
sys.stdout.buffer.write(b.getvalue())
