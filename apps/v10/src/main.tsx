import './main.css';
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from '@openai/apps-sdk-ui/components/Button';
import { Badge } from '@openai/apps-sdk-ui/components/Badge';
import { Select } from '@openai/apps-sdk-ui/components/Select';
import { Switch } from '@openai/apps-sdk-ui/components/Switch';
import { Tooltip } from '@openai/apps-sdk-ui/components/Tooltip';
import { Alert } from '@openai/apps-sdk-ui/components/Alert';
const names=['Button','Badge','Select','Switch','Tooltip','Alert'] as const;
type Name=typeof names[number];
const mapping:Record<Name,{id:number|null;name:string;notes:string;keys:string}>={
 Button:{id:82,name:'SDK Button styles',notes:'公式はReactのpropsで色・disabled・loadingを指定。v09はDOMイベントと独自CSS。回数表示とloading切替は教材側の追加コード。',keys:'Tabで移動、Enter / Spaceで実行。disabledは操作不可。'},
 Badge:{id:null,name:'比較対象なし',notes:'v09の展示名・出自を照合した範囲で直接対応するBadge展示なし。色切替は教材側の追加。Badge自体は表示部品でクリック操作はない。',keys:'教材のセレクトで色を変更。表示内容を文字でも確認。'},
 Select:{id:16,name:'Select',notes:'公式はRadixを利用する複合部品。v09はブラウザ標準のselect。選択肢と現在値の表示は教材側で管理。',keys:'Tabで移動、Spaceまたは矢印で開く。矢印で移動、Enterで確定、Escapeで閉じる。Enter単独では開かない公式仕様。'},
 Switch:{id:85,name:'SDK Switch',notes:'公式はRadix Switchとlabelを利用。v09は独自ボタンのaria-checkedを更新。ON/OFFの保存はReact側の状態管理。',keys:'Tabで移動、Spaceで切替。disabled時は操作不可。'},
 Tooltip:{id:47,name:'Tooltip',notes:'公式はRadixのトリガー・ポータル・説明関連付けを利用。v09は独自CSS/DOM。下の状態表示は教材側のfocusイベント観察。',keys:'マウスホバーまたはTabでフォーカス。Escapeで閉じる。タッチでの表示は実機未検証。'},
 Alert:{id:86,name:'SDK Alert',notes:'公式Alertは表示部品。色選択と閉じる/再表示は教材側の追加。動的通知のrole=statusも教材側のラッパー。v09はhiddenの切替。',keys:'教材の選択欄で通知色を変更。TabとEnterで閉じる/再表示。'}
};
// Stable public TriggerView: the hidden prefix names the field without consuming width.
function DisplayModeTrigger({label}:{label:string}){
 return <><span className="sr-only">表示モード：</span>{label}</>;
}
function Demo({name}:{name:Name}){
 const [count,setCount]=useState(0),[loading,setLoading]=useState(false),[disabled,setDisabled]=useState(false),[checked,setChecked]=useState(false),[value,setValue]=useState('a'),[color,setColor]=useState<'success'|'warning'|'danger'>('success'),[visible,setVisible]=useState(true),[observed,setObserved]=useState('未操作');
 return <><div className="stage">
 {name==='Button'&&<><div className="controls"><label><input type="checkbox" checked={disabled} onChange={e=>setDisabled(e.target.checked)}/>disabled</label><label><input type="checkbox" checked={loading} onChange={e=>setLoading(e.target.checked)}/>loading</label></div><Button color="primary" gutterSize="xs" disabled={disabled} loading={loading} onClick={()=>setCount(c=>c+1)}>公式ボタンを実行</Button><output className="state" aria-live="polite">実行回数：{count} / disabled：{String(disabled)} / loading：{String(loading)}</output></>}
 {name==='Badge'&&<><label>Badgeの色 <select className="native-control" value={color} onChange={e=>setColor(e.target.value as typeof color)}><option value="success">success</option><option value="warning">warning</option><option value="danger">danger</option></select></label><div className="samples"><Badge color={color}>状態：{color}</Badge><Badge color={color} variant="outline">outline</Badge><Badge color={color} variant="solid" pill>solid / pill</Badge></div><output className="state" aria-live="polite">選択色：{color}</output></>}
 {name==='Select'&&<><div className="controls"><label><input type="checkbox" checked={disabled} onChange={e=>setDisabled(e.target.checked)}/>Select disabled</label></div><label htmlFor="official-select">表示モード</label><Select TriggerView={DisplayModeTrigger} id="official-select" value={value} disabled={disabled} onChange={o=>setValue(o.value)} options={[{value:'a',label:'一覧'},{value:'b',label:'カード'},{value:'c',label:'選択不可',disabled:true}]}/><output className="state" aria-live="polite">選択値：{value}（教材の状態表示）</output></>}
 {name==='Switch'&&<><div className="controls"><label><input type="checkbox" checked={disabled} onChange={e=>setDisabled(e.target.checked)}/>Switch disabled</label></div><Switch label="公式通知スイッチ" checked={checked} disabled={disabled} onCheckedChange={setChecked}/><output className="state" aria-live="polite">通知：{checked?'ON':'OFF'}</output></>}
 {name==='Tooltip'&&<><Tooltip content="公式Tooltipの説明" openDelay={150}><button className="native-control" onFocus={()=>setObserved('フォーカスあり')} onBlur={()=>setObserved('フォーカスなし')}>説明を見る</button></Tooltip><output className="state">トリガー観察：{observed}（開閉判定ではない）</output></>}
 {name==='Alert'&&<><label>Alertの色 <select className="native-control" value={color} onChange={e=>setColor(e.target.value as typeof color)}><option value="success">success</option><option value="warning">warning</option><option value="danger">danger</option></select></label><div className="controls"><button className="native-control" onClick={()=>setVisible(v=>!v)}>{visible?'通知を閉じる':'通知を再表示'}</button></div><div role="status" aria-live="polite">{visible&&<Alert className="alert-demo" color={color} title={`通知：${color}`} description="教材用の状態通知。外部への送信は行いません。"/>}</div><output className="state">通知表示：{visible?'表示中':'非表示'}</output></>}
 </div><p>{mapping[name].keys}</p></>;
}
const qaParams=new URLSearchParams(location.search);const initialDark=qaParams.get('theme')==='dark';document.documentElement.dataset.theme=initialDark?'dark':'light';if(qaParams.get('text')==='200')document.documentElement.style.fontSize='200%';
function App(){const [dark,setDark]=useState(initialDark);function theme(){const next=!dark;setDark(next);document.documentElement.dataset.theme=next?'dark':'light';}
 return <main><header><div className="eyebrow">INTELLIGENCE UI MUSEUM / v10 EXPERIMENT · STAGE 0—2</div><h1>公式の部品を、触って比べる。</h1><p>OpenAI公開ライブラリの実物と、v09の独自再現を比較する非公開用の実験教材。OpenAI公式製品ではありません。</p><p className="muted">@openai/apps-sdk-ui 0.2.2 · React 19 · Tailwind 4 / ChatGPTホスト接続・AI通信なし</p><div className="controls"><button className="native-control" aria-pressed={dark} onClick={theme}>{dark?'ライト':'ダーク'}テーマに切替</button><a href="./v09-original.html" target="_blank" rel="noreferrer">保全したv09全117展示</a></div><nav aria-label="公式部品へ移動">{names.map(n=><a className="navlink" href={'#'+n} key={n}>{n}</a>)}</nav></header>
 {names.map(name=><section className="exhibit" id={name} key={name} aria-labelledby={name+'-title'}><h2 id={name+'-title'}>{name}</h2><p className="intro">{mapping[name].notes}</p><div className="compare"><div className="pane"><span className="label official">公式npmパッケージを直接利用</span><h3>OpenAI Apps SDK UI</h3><Demo name={name}/><details><summary>出自・実装と確認ポイント</summary><p><code>{`import { ${name} } from '@openai/apps-sdk-ui/components/${name}';`}</code></p><p>公開exportと実ファイルを照合済み。公式コードの変更なし。状態管理・説明・比較枠は独自実装。スクリーンリーダー実機での読み上げは未検証。</p><a href={`https://github.com/openai/apps-sdk-ui/blob/0f00143c7a639906f1621fe58e1b6be7b5bea46d/src/components/${name}/${name==='Badge'?'index.tsx':name+'.tsx'}`}>固定commitの公式ソース</a> / <a href={`https://openai.github.io/apps-sdk-ui/?path=/docs/components-${name.toLowerCase()}--docs`}>公式ドキュメント</a></details></div><div className="pane"><span className="label">v09 · 独自再現 / パッケージ未使用</span><h3>{mapping[name].id?String(mapping[name].id).padStart(3,'0')+' · ':''}{mapping[name].name}</h3>{mapping[name].id?<><iframe key={String(dark)} title={`${name}のv09独自再現`} sandbox="allow-scripts" src={`./v09-viewer.html?exhibit=${mapping[name].id}&theme=${dark?'dark':'light'}`}/><p>保全HTMLから対象展示を表示。外側のCSSと状態をiframeで分離。テーマ変更で比較側を再読込し、状態を初期化します。</p></>:<p>対応する既存展示を特定できなかったため、新しい疑似版は作成していません。</p>}</div></div></section>)}
 <footer><p>Stage 3の統合・公開は未実施。React部品の単独実行とChatGPTホスト上のApps SDK連携は別の検証です。</p><a href="https://github.com/openai/apps-sdk-ui">公式リポジトリ</a> / <a href="./THIRD_PARTY_NOTICES.txt">第三者ライセンス</a></footer></main>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><App/></StrictMode>);
