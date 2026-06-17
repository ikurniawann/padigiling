'use client'
import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Save, Copy, Check } from 'lucide-react'
import { DEFAULT_WA_TEMPLATE } from '@/lib/wa-parser'

export default function Settings() {
  const [template, setTemplate] = useState(DEFAULT_WA_TEMPLATE)
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const [msg, setMsg] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Load template from localStorage
    const saved = localStorage.getItem('wa_template')
    if (saved) setTemplate(saved)

    // Get current user
    createClient().auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null)
    })
  }, [])

  async function saveTemplate() {
    localStorage.setItem('wa_template', template)
    setMsg('Template WhatsApp disimpan di lokal browser.')
    setTimeout(() => setMsg(''), 2000)
  }

  async function resetTemplate() {
    setTemplate(DEFAULT_WA_TEMPLATE)
    localStorage.removeItem('wa_template')
    setMsg('Template direset ke default.')
    setTimeout(() => setMsg(''), 2000)
  }

  async function copyTemplate() {
    await navigator.clipboard?.writeText(template)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <AppShell>
      <PageHeader
        title="Settings"
        subtitle="Konfigurasi aplikasi dan template WhatsApp."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* WhatsApp Template */}
        <div className="glass rounded-3xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-extrabold">Template WhatsApp</h3>
            <div className="flex gap-2">
              <button className="btn text-xs flex items-center gap-1" onClick={copyTemplate}>
                {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button className="btn text-xs" onClick={resetTemplate}>Reset Default</button>
            </div>
          </div>
          <p className="text-xs text-stone-500 mb-3">
            Template ini digunakan di halaman Create Order. Admin copy template → kirim ke customer → paste balasan → auto-parse.
          </p>
          <textarea
            className="input min-h-80 font-mono text-xs"
            value={template}
            onChange={e => setTemplate(e.target.value)}
          />
          <div className="mt-3 flex items-center gap-3">
            <button className="btn btn-primary flex items-center gap-2" onClick={saveTemplate}>
              <Save className="w-4 h-4" /> Simpan Template
            </button>
            {msg && <p className="text-sm text-stone-600">{msg}</p>}
          </div>
        </div>

        {/* Profile / Account */}
        <div className="glass rounded-3xl p-5 self-start">
          <h3 className="font-extrabold mb-3">Akun</h3>
          {user ? (
            <div className="space-y-3 text-sm">
              <div className="rounded-xl bg-white/60 p-4">
                <p className="label">Email</p>
                <p className="font-semibold">{user.email || '-'}</p>
              </div>
              <div className="rounded-xl bg-white/60 p-4">
                <p className="label">User ID</p>
                <p className="font-mono text-xs text-stone-600 break-all">{(user as any)?.id || '-'}</p>
              </div>
              <p className="text-xs text-stone-500">
                Manajemen user dan role dilakukan melalui Supabase Dashboard → Authentication.
              </p>
            </div>
          ) : (
            <p className="text-sm text-stone-500">Tidak ada user yang login.</p>
          )}

          <hr className="my-5 border-white/60" />

          <h3 className="font-extrabold mb-3">Tentang</h3>
          <div className="space-y-2 text-sm text-stone-600">
            <p><b>Padigiling CRM</b> v0.1.0</p>
            <p>Sistem CRM untuk manajemen order katering Padigiling.</p>
            <p className="text-xs mt-3">
              Stack: Next.js 14 • React 18 • TypeScript • Tailwind CSS • Supabase
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
