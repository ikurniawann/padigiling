'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function Login() {
  const supabase = createClient()
  const [email, setEmail] = useState('a@padigiling.com')
  const [pw, setPw] = useState('')
  const [msg, setMsg] = useState('')

  async function login() {
    setMsg('Login...')
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw })
    if (error) setMsg(error.message)
    else window.location.href = '/dashboard'
  }

  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="glass w-full max-w-md rounded-3xl p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-36 items-center justify-center overflow-hidden rounded-xl bg-brand px-3">
            <img src="/padigiling.png" alt="Padigiling" className="h-full w-full object-contain" />
          </div>
          <div>
            <h1 className="text-base font-extrabold">Padigiling CRM</h1>
            <p className="text-xs text-stone-500">Login Admin</p>
          </div>
        </div>

        <label className="label">Email</label>
        <input className="input mb-3" value={email} onChange={e => setEmail(e.target.value)} />

        <label className="label">Password</label>
        <input className="input mb-4" type="password" value={pw} onChange={e => setPw(e.target.value)} />

        <button className="btn btn-primary w-full" onClick={login}>Login</button>
        {msg && <p className="mt-3 text-sm text-stone-600">{msg}</p>}
      </div>
    </main>
  )
}
