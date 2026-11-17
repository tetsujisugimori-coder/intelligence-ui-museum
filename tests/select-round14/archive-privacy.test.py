"""Exercise the actual download redirect handler without network or credentials."""
import ast,pathlib,urllib.request
source=pathlib.Path(__file__).with_name('archive-readback.py').read_text()
node=next(n for n in ast.parse(source).body if isinstance(n,ast.ClassDef) and n.name=='NoCredentialRedirect')
scope={'urllib':__import__('urllib')};exec(compile(ast.Module(body=[node],type_ignores=[]),'archive-handler','exec'),scope)
handler=scope['NoCredentialRedirect']()
req=urllib.request.Request('https://api.github.com/repos/example/repo/actions/artifacts/1/zip',headers={'Authorization':'Bearer SYNTHETIC-NOT-A-CREDENTIAL','Accept':'application/vnd.github+json'})
for code in [301,302,303,307,308]:
 redirected=handler.redirect_request(req,None,code,'redirect',{},'https://example.test/signed-download')
 assert not any(k.lower()=='authorization' for k in redirected.headers),'credential forwarded'
 assert req.get_header('Authorization')=='Bearer SYNTHETIC-NOT-A-CREDENTIAL','original altered'
print('PASS: 5 redirect codes strip credentials; source request unchanged')
