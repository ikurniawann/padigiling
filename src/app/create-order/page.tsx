'use client'
import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { pickLine, pickBlock, getWaTemplate } from '@/lib/wa-parser'

type Option={name:string;code:string}
type Form={customer_name:string;customer_phone:string;recipient_name:string;recipient_phone:string;order_text:string;delivery_date_text:string;delivery_time_text:string;address:string;greeting_card_message:string;channel_code:string;order_type:string;status:string;payment_platform:string;courier:string;subtotal:string;shipping_fee_customer:string;shipping_fee_real:string;raw_wa_text:string}
const initial:Form={customer_name:'',customer_phone:'',recipient_name:'',recipient_phone:'',order_text:'',delivery_date_text:'',delivery_time_text:'',address:'',greeting_card_message:'',channel_code:'wa',order_type:'delivery',status:'draft',payment_platform:'paper_id',courier:'gojek',subtotal:'',shipping_fee_customer:'',shipping_fee_real:'',raw_wa_text:''}

function CreateOrderContent(){
  const router=useRouter()
  const searchParams=useSearchParams()
  const leadId=searchParams.get('lead_id')
  const[form,setForm]=useState<Form>(initial)
  const[opts,setOpts]=useState<Record<string,Option[]>>({})
  const[msg,setMsg]=useState('')
  const[loading,setLoading]=useState(false)

  async function loadOpts(){
    const map:Record<string,string>={channel_code:'sales_channels',order_type:'order_types',status:'order_statuses',payment_platform:'payment_platforms',courier:'couriers'}
    const entries=await Promise.all(Object.entries(map).map(async([key,module])=>{
      const r=await fetch(`/api/master-data/${module}`)
      const j=await r.json()
      return [key,j.data||[]]
    }))
    setOpts(Object.fromEntries(entries))
  }

  useEffect(()=>{loadOpts()},[])

  // Pre-fill form from Pipeline lead or query params
  useEffect(()=>{
    const name=searchParams.get('name')
    const phone=searchParams.get('phone')
    const inquiry=searchParams.get('inquiry')
    const needDate=searchParams.get('need_date')
    if(name||phone||inquiry||needDate){
      setForm(f=>({
        ...f,
        customer_name:name||f.customer_name,
        customer_phone:phone||f.customer_phone,
        recipient_name:name||f.recipient_name,
        order_text:inquiry||f.order_text,
        delivery_date_text:needDate||f.delivery_date_text,
        status:'draft',
      }))
      if(leadId) setMsg(`Membuat order dari Lead. Data sudah terisi otomatis.`)
    }
  },[searchParams,leadId])

  function set<K extends keyof Form>(k:K,v:Form[K]){setForm(f=>({...f,[k]:v}))}

  async function copyTemplate(){
    await navigator.clipboard?.writeText(getWaTemplate())
    setMsg('Template WhatsApp berhasil dicopy. Kirim ke customer, lalu paste balasannya di textbox.')
  }

  function pasteTemplate(){
    set('raw_wa_text',getWaTemplate())
    setMsg('Template dimasukkan ke textbox.')
  }

  function parse(){
    const raw=form.raw_wa_text
    setForm(f=>({
      ...f,
      customer_name:pickLine(raw,['Nama pemesan','Nama Pemesan']),
      customer_phone:pickLine(raw,['No telp','No telp pemesan','No HP pemesan']),
      recipient_name:pickLine(raw,['Nama Penerima','Nama penerima']),
      recipient_phone:pickLine(raw,['No Telp penerima','No telp penerima','No HP penerima']),
      order_text:pickBlock(raw,['Order'],['Delivery/pick up tgl','Delivery','Pick up','Jam','Alamat','Apakah perlu kartu ucapan']),
      delivery_date_text:pickLine(raw,['Delivery/pick up tgl','Delivery tgl','Pick up tgl','Tanggal']),
      delivery_time_text:pickLine(raw,['Jam']),
      address:pickBlock(raw,['Alamat'],['Apakah perlu kartu ucapan','Mohon ditulis disini']),
      greeting_card_message:pickBlock(raw,['Apakah perlu kartu ucapan','Mohon ditulis disini'],[]),
    }))
    setMsg('Data berhasil digenerate. Silakan review sebelum buat order.')
  }

  async function save(){
    setLoading(true);setMsg('Menyimpan order...')
    try{
      const url=leadId?`/api/orders?lead_id=${leadId}`:'/api/orders'
      const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,subtotal:Number(form.subtotal||0),shipping_fee_customer:Number(form.shipping_fee_customer||0),shipping_fee_real:Number(form.shipping_fee_real||0),parsed_json:form})})
      const j=await res.json()
      if(j.error)throw new Error(j.error.message)
      setMsg(`Order berhasil dibuat: ${j.data.order.order_no}`)
      setTimeout(()=>router.push('/orders'),800)
    }catch(e:any){setMsg(e.message)}
    finally{setLoading(false)}
  }

  const select=(key:keyof Form,label:string)=><div><label className="label">{label}</label><select className="input" value={form[key]} onChange={e=>set(key,e.target.value as any)}>{(opts[key]||[]).map(o=><option key={o.code} value={o.code}>{o.name}</option>)}</select></div>

  return <AppShell>{leadId&&<div className="mb-4 glass rounded-2xl p-3 text-sm text-brand font-semibold">🔄 Membuat order dari Lead — data sudah terisi otomatis.</div>}<PageHeader title="Create Order" subtitle="Paste balasan WhatsApp, generate otomatis, review, lalu buat order." action={<div className="flex gap-2"><button className="btn" onClick={copyTemplate}>Copy Template WA</button><button className="btn btn-primary" onClick={pasteTemplate}>Paste Template</button></div>}/><div className="grid gap-4 xl:grid-cols-[.9fr_1.1fr]"><section className="glass rounded-3xl p-5"><div className="mb-3 flex items-center justify-between"><h3 className="font-extrabold">Paste WhatsApp</h3><span className="pill">Auto Parser</span></div><div className="mb-3 flex flex-wrap gap-2"><button className="btn" onClick={copyTemplate}>Copy Template WA</button><button className="btn" onClick={pasteTemplate}>Paste Template ke Textbox</button></div><textarea className="input min-h-72" value={form.raw_wa_text} onChange={e=>set('raw_wa_text',e.target.value)} placeholder="Paste format pemesanan customer di sini..."/><div className="mt-3 flex gap-2"><button className="btn btn-primary" onClick={parse}>Generate ke Field</button><button className="btn" onClick={()=>setForm(initial)}>Reset</button></div><div className="mt-5 rounded-2xl bg-white/60 p-4 text-sm text-stone-600"><b>Flow:</b><br/>1. Admin paste WA<br/>2. Generate field<br/>3. Review/edit<br/>4. Buat order draft</div></section><section className="glass rounded-3xl p-5"><h3 className="mb-4 font-extrabold">Preview & Field Order</h3><div className="grid gap-3 md:grid-cols-2"><div><label className="label">Nama Pemesan</label><input className="input" value={form.customer_name} onChange={e=>set('customer_name',e.target.value)}/></div><div><label className="label">No Telp Pemesan</label><input className="input" value={form.customer_phone} onChange={e=>set('customer_phone',e.target.value)}/></div><div><label className="label">Nama Penerima</label><input className="input" value={form.recipient_name} onChange={e=>set('recipient_name',e.target.value)}/></div><div><label className="label">No Telp Penerima</label><input className="input" value={form.recipient_phone} onChange={e=>set('recipient_phone',e.target.value)}/></div>{select('channel_code','Channel')}{select('order_type','Delivery / Pick Up')}<div><label className="label">Tanggal dari WA</label><input className="input" value={form.delivery_date_text} onChange={e=>set('delivery_date_text',e.target.value)}/></div><div><label className="label">Jam dari WA</label><input className="input" value={form.delivery_time_text} onChange={e=>set('delivery_time_text',e.target.value)}/></div><div className="md:col-span-2"><label className="label">Order</label><textarea className="input min-h-24" value={form.order_text} onChange={e=>set('order_text',e.target.value)}/></div><div className="md:col-span-2"><label className="label">Alamat</label><textarea className="input min-h-24" value={form.address} onChange={e=>set('address',e.target.value)}/></div>{select('payment_platform','Platform Pembayaran')}{select('status','Status Awal')}{select('courier','Courier')}<div><label className="label">Harga Produk</label><input className="input" value={form.subtotal} onChange={e=>set('subtotal',e.target.value)}/></div><div><label className="label">Ongkir Customer</label><input className="input" value={form.shipping_fee_customer} onChange={e=>set('shipping_fee_customer',e.target.value)}/></div><div><label className="label">Ongkir Real</label><input className="input" value={form.shipping_fee_real} onChange={e=>set('shipping_fee_real',e.target.value)}/></div><div className="md:col-span-2"><label className="label">Kartu Ucapan / Catatan</label><textarea className="input min-h-20" value={form.greeting_card_message} onChange={e=>set('greeting_card_message',e.target.value)}/></div></div><div className="mt-4 flex items-center gap-3"><button className="btn btn-primary" disabled={loading} onClick={save}>Buat Order dari Preview</button>{msg&&<p className="text-sm text-stone-600">{msg}</p>}</div></section></div></AppShell>
}

export default function CreateOrder() {
  return <Suspense fallback={<div className="p-8 text-center text-stone-500">Loading...</div>}><CreateOrderContent /></Suspense>
}
