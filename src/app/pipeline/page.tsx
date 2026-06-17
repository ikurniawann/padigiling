'use client'
import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Phone, Calendar, ArrowRightLeft } from 'lucide-react'

type Lead = {
  id: string; lead_no: string; name: string; phone: string | null
  pipeline_stage_id: string | null
  inquiry_text: string | null; need_date: string | null
  follow_up_at: string | null
  sales_channels?: { name: string } | null
  pipeline_stages?: { name: string; code: string } | null
}
type Stage = { id: string; name: string; code: string; sort_order: number }
type Column = Stage & { leads: Lead[] }

export default function Pipeline() {
  const router = useRouter()
  const [columns, setColumns] = useState<Column[]>([])
  const [stages, setStages] = useState<Stage[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function load() {
    setLoading(true)
    try {
      const [stRes, ldRes] = await Promise.all([
        fetch('/api/master-data/pipeline_stages'),
        fetch('/api/leads?limit=200'),
      ])
      const st = await stRes.json()
      const ld = await ldRes.json()
      if (st.error) throw new Error(st.error.message)
      if (ld.error) throw new Error(ld.error.message)

      const stageList: Stage[] = (st.data || []).sort((a: Stage, b: Stage) => a.sort_order - b.sort_order)
      const leads: Lead[] = ld.data || []

      const cols: Column[] = stageList.map(s => ({
        ...s,
        leads: leads.filter(l => l.pipeline_stage_id === s.id),
      }))

      const unassigned = leads.filter(l => !l.pipeline_stage_id)
      if (unassigned.length > 0) {
        cols.unshift({
          id: '', name: 'Unassigned', code: 'unassigned', sort_order: -1,
          leads: unassigned,
        })
      }

      setStages(stageList)
      setColumns(cols)
    } catch (e: any) { setMsg(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function moveLead(leadId: string, stageId: string) {
    try {
      const r = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipeline_stage_id: stageId || null }),
      })
      const j = await r.json()
      if (j.error) throw new Error(j.error.message)
      load(); setMsg('Lead dipindahkan')
    } catch (e: any) { setMsg(e.message) }
  }

  function convertToOrder(lead: Lead) {
    const params = new URLSearchParams()
    params.set('lead_id', lead.id)
    if (lead.name) params.set('name', lead.name)
    if (lead.phone) params.set('phone', lead.phone)
    if (lead.inquiry_text) params.set('inquiry', lead.inquiry_text)
    if (lead.need_date) params.set('need_date', lead.need_date)
    router.push(`/create-order?${params.toString()}`)
  }

  const totalLeads = columns.reduce((sum, c) => sum + c.leads.length, 0)

  return (
    <AppShell>
      <PageHeader
        title="Pipeline"
        subtitle={`${totalLeads} leads aktif — funnel dari new sampai completed.`}
      />
      {loading && <span className="pill mb-3">Loading...</span>}
      {msg && <p className="mb-3 text-sm text-stone-600">{msg}</p>}

      <div className="flex gap-4 overflow-auto pb-4" style={{ minHeight: '60vh' }}>
        {columns.map(col => (
          <div key={col.id || 'unassigned'} className="flex-shrink-0 w-72">
            <div className="glass rounded-2xl p-3 mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold">{col.name}</h3>
                <p className="text-xs text-stone-500">{col.leads.length} lead</p>
              </div>
            </div>

            <div className="space-y-3">
              {col.leads.map(lead => (
                <div key={lead.id} className="glass rounded-2xl p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm">{lead.name || 'Tanpa Nama'}</p>
                      <p className="text-xs text-stone-500">{lead.lead_no}</p>
                    </div>
                    <span className="pill text-xs">{lead.sales_channels?.name || '-'}</span>
                  </div>

                  {lead.phone && (
                    <div className="flex items-center gap-1 text-xs text-stone-500 mb-2">
                      <Phone className="w-3 h-3" /> {lead.phone}
                    </div>
                  )}

                  {lead.inquiry_text && (
                    <p className="text-xs text-stone-600 mb-2 line-clamp-3 bg-white/50 rounded-lg p-2">
                      {lead.inquiry_text}
                    </p>
                  )}

                  {lead.need_date && (
                    <div className="flex items-center gap-1 text-xs text-brand mb-2">
                      <Calendar className="w-3 h-3" />
                      Butuh: {new Date(lead.need_date).toLocaleDateString('id-ID')}
                    </div>
                  )}

                  <select
                    className="input text-xs py-1.5"
                    value={lead.pipeline_stage_id || ''}
                    onChange={e => moveLead(lead.id, e.target.value)}
                  >
                    <option value="">-- Pindah Stage --</option>
                    {stages.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.id === lead.pipeline_stage_id ? `✓ ${s.name}` : s.name}
                      </option>
                    ))}
                  </select>

                  {/* Convert to Order button */}
                  <button
                    onClick={() => convertToOrder(lead)}
                    className="mt-2 w-full btn btn-primary text-xs flex items-center justify-center gap-1.5"
                  >
                    <ArrowRightLeft className="w-3 h-3" /> Convert ke Order
                  </button>
                </div>
              ))}
              {col.leads.length === 0 && (
                <p className="text-xs text-stone-400 text-center py-8">Belum ada lead</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  )
}
