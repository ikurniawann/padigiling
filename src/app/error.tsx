'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Page error:', error)
  }, [error])

  return (
    <div className="grid min-h-screen place-items-center p-6">
      <div className="glass w-full max-w-md rounded-3xl p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>

        <h2 className="mb-2 text-xl font-extrabold text-stone-800">
          Terjadi Kesalahan
        </h2>

        <p className="mb-2 text-sm text-stone-600">
          Maaf, halaman ini mengalami error. Coba muat ulang atau kembali ke dashboard.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 rounded-xl bg-white/60 p-4 text-left">
            <p className="mb-1 text-xs font-semibold text-red-600">
              {error.name}: {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-stone-500">Digest: {error.digest}</p>
            )}
          </div>
        )}

        <div className="flex justify-center gap-3">
          <button onClick={reset} className="btn inline-flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Muat Ulang
          </button>
          <a href="/dashboard" className="btn btn-primary inline-flex items-center gap-2">
            <Home className="h-4 w-4" />
            Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
