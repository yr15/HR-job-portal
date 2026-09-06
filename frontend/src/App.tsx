import axios from 'axios'
import { useEffect, useState } from 'react'
import { apiBaseUrl } from './api/client'

type HealthStatus = 'checking' | 'ok' | 'error'

function App() {
  const [status, setStatus] = useState<HealthStatus>('checking')

  useEffect(() => {
    axios
      .get(`${apiBaseUrl}/health`)
      .then(() => setStatus('ok'))
      .catch(() => setStatus('error'))
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">HireHub</h1>
        <p className="mt-2 text-slate-500">Recruitment portal — under construction</p>
        <p className="mt-4 text-sm">
          Backend status:{' '}
          <span
            className={
              status === 'ok'
                ? 'font-medium text-emerald-600'
                : status === 'error'
                  ? 'font-medium text-red-600'
                  : 'font-medium text-slate-400'
            }
          >
            {status}
          </span>
        </p>
      </div>
    </div>
  )
}

export default App
