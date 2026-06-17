'use client'
import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'
import { useState } from 'react'
import { Search, Plus, Phone, Calendar, X, Pencil } from 'lucide-react'
import { useLeads, useMasterOptions, useCreateLead, useMoveLeadStage, useDeleteLead, useUpdateLead } from '@/hooks/use-leads'

type Lead = {
  id: string; lead_no: string; name: string; phone: string | null
  pipeline_stage_id: string | null; channel_id: string | null
  inquiry_text: string | null; need_date: string | null
  follow_up_at: string | null
  sales_channels?: { name: string; code: string } | null
  pipeline_stages?: { name: string; code: string } | null
}

type EditForm = {
  id: string; name: string; phone: string
  channel_id: string; pipeline_stage_id: string
  inquiry_text: string; need_date: string; follow_up_at: string
}

const emptyForm = { name: '', phone: '', channel_code: 'wa', stage_code: 'new', inquiry_text: '', need_date: '', follow_up_at: '' }

export default function Leads() {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState<EditForm | null>(null)
  const [msg, setMsg] = useState('')

  const { data: leads = [], isLoading } = useLeads(search)
  const { data: options } = useMasterOptions()
  const createLead = useCreateLead()
  const moveStage = useMoveLeadStage()
  const deleteLead = useDeleteLead()
  const updateLead = useUpdateLead()

  const channels = options?.channels || []
  const stages = options?.stages || []

  function startEdit(lead: Lead) {
    setShowForm(false)
    setEditing({
      id: lead.id, name: lead.name || '', phone: lead.phone || '',
      channel_id: lead.channel_id || '', pipeline_stage_id: lead.pipeline_stage_id || '',
      inquiry_text: lead.inquiry_text || '', need_date: lead.need_date || '',
      follow_up_at: lead.follow_up_at || '',
    })
  }

  function updateEdit(field: keyof EditForm, value: string) {
    if (!editing) return
    setEditing({ ...editing, [field]: value })
  }

  async function handleCreate() {
    if (!form.name.trim()) return setMsg('Nama wajib diisi')
    try {
      const result = await createLead.mutateAsync(form)
      setForm(emptyForm); setShowForm(false)
      setMsg('Lead ' + result.lead_no + ' dibuat')
    } catch (e: any) { setMsg(e.message) }
  }

  async function handleUpdate() {
    if (!editing) return
    try {
      await updateLead.mutateAsync({ id: editing.id, data: {
        name: editing.name, phone: editing.phone || null,
        channel_id: editing.channel_id || null,
        pipeline_stage_id: editing.pipeline_stage_id || null,
        inquiry_text: editing.inquiry_text || null,
        need_date: editing.need_date || null,
        follow_up_at: editing.follow_up_at || null,
      }})
      setEditing(null); setMsg('Lead updated')
    } catch (e: any) { setMsg(e.message) }
  }

  async function handleMove(id: string, stageId: string) {
    try { await moveStage.mutateAsync({ id, stageId }); setMsg('Stage updated') }
    catch (e: any) { setMsg(e.message) }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm('Hapus lead ' + name + '?')) return
    try { await deleteLead.mutateAsync(id); setMsg('Lead dihapus') }
    catch (e: any) { setMsg(e.message) }
  }

  const showPanel = showForm || editing

  return (
    <AppShell>
      <PageHeader title="Leads" subtitle={leads.length + ' calon customer'} action={
        <button className="btn btn-primary flex items-center gap-2" onClick={() => { setShowForm(!showForm); setEditing(null) }}>
          <Plus className="w-4 h-4" /> Lead Baru
        </button>
      }/>

      <div className="mb-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input className="input pl-10" placeholder="Cari lead..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="glass rounded-3xl p-5">
          {isLoading && <span className="pill">Loading...</span>}
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/70 text-left text-xs uppercase text-stone-500">
                  <th className="py-2">Lead</th><th>Channel</th><th>Stage</th><th>Follow Up</th><th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead.id} className="border-b border-white/60">
                    <td className="py-3">
                      <div className="font-semibold">{lead.name || '-'}</div>
                      <div className="text-xs text-stone-500">{lead.lead_no}{lead.phone && ' \u2022 ' + lead.phone}</div>
                      {lead.inquiry_text && <div className="text-xs text-stone-400 mt-1 line-clamp-2">{lead.inquiry_text}</div>}
                    </td>
                    <td><span className="pill">{lead.sales_channels?.name || '-'}</span></td>
                    <td>
                      <select className="input text-xs py-1 px-2" value={lead.pipeline_stage_id || ''} onChange={e => handleMove(lead.id, e.target.value)}>
                        <option value="">-- Pilih --</option>
                        {stages.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                      </select>
                    </td>
                    <td className="text-xs">{lead.follow_up_at ? new Date(lead.follow_up_at).toLocaleDateString('id-ID') : '-'}</td>
                    <td className="text-right">
                      <button className="btn text-xs mr-1" onClick={() => startEdit(lead)}><Pencil className="w-3 h-3" /></button>
                      <button className="btn text-xs" onClick={() => handleDelete(lead.id, lead.name)}>Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!leads.length && !isLoading && <p className="py-8 text-center text-sm text-stone-500">Belum ada lead.</p>}
        </div>

        {showPanel && (
          <div className="glass rounded-3xl p-5 self-start">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold">{editing ? 'Edit Lead' : 'Lead Baru'}</h3>
              <button onClick={() => { setShowForm(false); setEditing(null) }}><X className="w-4 h-4" /></button>
            </div>
            <div className="grid gap-3">
              <div><label className="label">Nama *</label><input className="input" value={editing ? editing.name : form.name} onChange={e => editing ? updateEdit('name', e.target.value) : setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="label">No HP</label><input className="input" value={editing ? editing.phone : form.phone} onChange={e => editing ? updateEdit('phone', e.target.value) : setForm({ ...form, phone: e.target.value })} /></div>
              <div><label className="label">Channel</label><select className="input" value={editing ? editing.channel_id : form.channel_code} onChange={e => editing ? updateEdit('channel_id', e.target.value) : setForm({ ...form, channel_code: e.target.value })}>{channels.map(c => <option key={c.id} value={editing ? c.id : c.code}>{c.name}</option>)}</select></div>
              <div><label className="label">Stage</label><select className="input" value={editing ? editing.pipeline_stage_id : form.stage_code} onChange={e => editing ? updateEdit('pipeline_stage_id', e.target.value) : setForm({ ...form, stage_code: e.target.value })}>{stages.map(s => <option key={s.id} value={editing ? s.id : s.code}>{s.name}</option>)}</select></div>
              <div><label className="label">Inquiry</label><textarea className="input min-h-20" value={editing ? editing.inquiry_text : form.inquiry_text} onChange={e => editing ? updateEdit('inquiry_text', e.target.value) : setForm({ ...form, inquiry_text: e.target.value })} /></div>
              <div><label className="label">Butuh Tanggal</label><input className="input" type="date" value={editing ? editing.need_date : form.need_date} onChange={e => editing ? updateEdit('need_date', e.target.value) : setForm({ ...form, need_date: e.target.value })} /></div>
              <div><label className="label">Follow Up</label><input className="input" type="datetime-local" value={editing ? editing.follow_up_at : form.follow_up_at} onChange={e => editing ? updateEdit('follow_up_at', e.target.value) : setForm({ ...form, follow_up_at: e.target.value })} /></div>
              {editing ? (
                <button className="btn btn-primary" onClick={handleUpdate} disabled={updateLead.isPending}>{updateLead.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
              ) : (
                <button className="btn btn-primary" onClick={handleCreate} disabled={createLead.isPending}>{createLead.isPending ? 'Menyimpan...' : 'Simpan Lead'}</button>
              )}
              {msg && <p className="text-sm text-stone-600">{msg}</p>}
            </div>
          </div>
        )}
      </div>
      {msg && !showPanel && <p className="mt-4 text-sm text-stone-600">{msg}</p>}
    </AppShell>
  )
}
