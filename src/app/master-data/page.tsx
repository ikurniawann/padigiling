'use client'
import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'
import { useEffect, useMemo, useState } from 'react'

type Row={id:string;name:string;code:string;sort_order:number;is_active:boolean;color?:string}
const modules=[
  ['sales_channels','Sales Channel'],['pipeline_stages','Pipeline Stage'],['order_types','Order Type'],['order_statuses','Order Status'],['payment_statuses','Payment Status'],['payment_platforms','Payment Platform'],['payment_methods','Payment Method'],['couriers','Courier'],['delivery_statuses','Delivery Status'],['product_categories','Product Category'],['occasion_types','Occasion'],['greeting_card_options','Greeting Card'],['lost_reasons','Lost Reason']
]
const empty={id:'',name:'',code:'',sort_order:0,is_active:true,color:''}
export default function MasterData(){
  const [module,setModule]=useState('sales_channels')
  const [rows,setRows]=useState<Row[]>([])
  const [form,setForm]=useState<Row>(empty)
  const [loading,setLoading]=useState(false)
  const [msg,setMsg]=useState('')
  const title=useMemo(()=>modules.find(x=>x[0]===module)?.[1]||'Master Data',[module])
  async function load(){setLoading(true);setMsg('');try{const r=await fetch(`/api/master-data/${module}?include_inactive=true`);const j=await r.json();if(j.error)throw new Error(j.error.message);setRows((j.data||[]).map((x:any)=>({sort_order:0,is_active:true,...x})))}catch(e:any){setMsg(e.message)}finally{setLoading(false)}}
  useEffect(()=>{setForm(empty);load()},[module])
  function edit(row:Row){setForm({...row,color:row.color||''})}
  function reset(){setForm(empty)}
  async function save(){setLoading(true);setMsg('Saving...');try{const isEdit=Boolean(form.id);const r=await fetch(`/api/master-data/${module}${isEdit?`/${form.id}`:''}`,{method:isEdit?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:form.name,code:form.code,sort_order:Number(form.sort_order||0),is_active:form.is_active,color:form.color||undefined})});const j=await r.json();if(j.error)throw new Error(j.error.message);setMsg(isEdit?'Updated':'Created');reset();await load()}catch(e:any){setMsg(e.message)}finally{setLoading(false)}}
  async function remove(row:Row){if(!confirm(`Nonaktifkan ${row.name}?`))return;setLoading(true);try{const r=await fetch(`/api/master-data/${module}/${row.id}`,{method:'DELETE'});const j=await r.json();if(j.error)throw new Error(j.error.message);await load();setMsg('Data dinonaktifkan')}catch(e:any){setMsg(e.message)}finally{setLoading(false)}}
  return <AppShell><PageHeader title="Master Data" subtitle="CRUD semua dropdown CRM dari Supabase." action={<button className="btn btn-primary" onClick={reset}>Tambah Baru</button>}/>
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="glass rounded-3xl p-4"><h3 className="mb-3 text-sm font-extrabold">Modules</h3><div className="grid gap-1">{modules.map(([key,label])=><button key={key} onClick={()=>setModule(key)} className={`rounded-xl px-3 py-2 text-left text-sm font-semibold ${module===key?'bg-brand text-white':'hover:bg-brand-soft'}`}>{label}</button>)}</div></aside>
      <section className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="glass rounded-3xl p-5"><div className="mb-4 flex items-center justify-between"><h3 className="font-extrabold">{title}</h3>{loading&&<span className="pill">Loading...</span>}</div><div className="overflow-auto"><table className="w-full text-sm"><thead><tr className="border-b border-white/70 text-left text-xs uppercase text-stone-500"><th className="py-2">Name</th><th>Code</th><th>Sort</th><th>Status</th><th className="text-right">Action</th></tr></thead><tbody>{rows.map(row=><tr key={row.id} className="border-b border-white/60"><td className="py-3 font-semibold">{row.name}</td><td className="text-stone-600">{row.code}</td><td>{row.sort_order}</td><td><span className="pill">{row.is_active?'Active':'Inactive'}</span></td><td className="text-right"><button className="btn mr-2" onClick={()=>edit(row)}>Edit</button><button className="btn" onClick={()=>remove(row)}>Delete</button></td></tr>)}</tbody></table>{!rows.length&&!loading&&<p className="py-6 text-sm text-stone-500">Belum ada data.</p>}</div></div>
        <div className="glass rounded-3xl p-5"><h3 className="mb-3 font-extrabold">{form.id?'Edit':'Tambah'} {title}</h3><div className="grid gap-3"><div><label className="label">Name</label><input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div><div><label className="label">Code</label><input className="input" value={form.code} onChange={e=>setForm({...form,code:e.target.value})}/></div><div><label className="label">Sort Order</label><input className="input" type="number" value={form.sort_order} onChange={e=>setForm({...form,sort_order:Number(e.target.value)})}/></div><div><label className="label">Color Optional</label><input className="input" value={form.color||''} onChange={e=>setForm({...form,color:e.target.value})} placeholder="green / red / yellow"/></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={e=>setForm({...form,is_active:e.target.checked})}/> Active</label><div className="flex gap-2"><button className="btn btn-primary" onClick={save} disabled={loading}>Save</button><button className="btn" onClick={reset}>Reset</button></div>{msg&&<p className="text-sm text-stone-600">{msg}</p>}</div></div>
      </section>
    </div></AppShell>}
