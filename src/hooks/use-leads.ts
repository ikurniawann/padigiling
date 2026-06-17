import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Types
type Lead = {
  id: string; lead_no: string; name: string; phone: string | null
  pipeline_stage_id: string | null; channel_id: string | null
  inquiry_text: string | null; need_date: string | null
  follow_up_at: string | null
  created_at: string
  sales_channels?: { name: string; code: string } | null
  pipeline_stages?: { name: string; code: string } | null
}
type Option = { id: string; name: string; code: string }

// API functions
async function fetchLeads(search?: string): Promise<Lead[]> {
  const params = new URLSearchParams()
  if (search) params.set('q', search)
  const r = await fetch(`/api/leads?${params}`)
  const j = await r.json()
  if (j.error) throw new Error(j.error.message)
  return j.data || []
}

async function fetchMasterOptions(): Promise<{ channels: Option[]; stages: Option[] }> {
  const [chRes, stRes] = await Promise.all([
    fetch('/api/master-data/sales_channels'),
    fetch('/api/master-data/pipeline_stages'),
  ])
  const [ch, st] = await Promise.all([chRes.json(), stRes.json()])
  return { channels: ch.data || [], stages: st.data || [] }
}

async function createLead(data: Record<string, unknown>) {
  const r = await fetch('/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const j = await r.json()
  if (j.error) throw new Error(j.error.message)
  return j.data
}

async function patchLead(id: string, data: Record<string, unknown>) {
  const r = await fetch(`/api/leads/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const j = await r.json()
  if (j.error) throw new Error(j.error.message)
  return j.data
}

async function deleteLead(id: string) {
  const r = await fetch(`/api/leads/${id}`, { method: 'DELETE' })
  const j = await r.json()
  if (j.error) throw new Error(j.error.message)
  return j.data
}

// Query hooks
export function useLeads(search?: string) {
  return useQuery({
    queryKey: ['leads', { search }],
    queryFn: () => fetchLeads(search),
  })
}

export function useMasterOptions() {
  return useQuery({
    queryKey: ['master-options', 'leads'],
    queryFn: fetchMasterOptions,
    staleTime: 1000 * 60 * 10, // master data jarang berubah
  })
}

// Mutation hooks
export function useCreateLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
  })
}

export function useMoveLeadStage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, stageId }: { id: string; stageId: string }) =>
      patchLead(id, { pipeline_stage_id: stageId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
  })
}

export function useDeleteLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
  })
}

export function useUpdateLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      patchLead(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
  })
}
