import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8007'

const STATUS_CONFIG = {
  approved: { badge: 'bg-emerald-50 text-emerald-700', icon: '✓', iconBg: 'bg-emerald-100 text-emerald-600' },
  denied:   { badge: 'bg-red-50 text-red-700',         icon: '✗', iconBg: 'bg-red-100 text-red-500'       },
  pending:  { badge: 'bg-amber-50 text-amber-700',     icon: '…', iconBg: 'bg-amber-100 text-amber-600'   },
  error:    { badge: 'bg-slate-100 text-slate-500',    icon: '!', iconBg: 'bg-slate-100 text-slate-400'   },
}

function cfg(decision, status) {
  return STATUS_CONFIG[decision] || STATUS_CONFIG[status] || STATUS_CONFIG.error
}

export default function History() {
  const [apps, setApps]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API}/api/applications`, {
      headers: { Authorization: 'Bearer dev-token' },
    })
      .then(res => setApps(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="max-w-3xl mx-auto px-6 py-28 text-center">
      <div className="w-10 h-10 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin mx-auto" />
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Application History</h1>
          <p className="text-slate-400 mt-1 text-sm">
            {apps.length === 0 ? 'No applications yet' : `${apps.length} application${apps.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link to="/apply"
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm">
          + New application
        </Link>
      </div>

      {apps.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-slate-100">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            📋
          </div>
          <p className="text-slate-500 font-medium mb-2">No applications yet</p>
          <p className="text-slate-400 text-sm mb-6">Submit your first application to see results here.</p>
          <Link to="/apply"
            className="bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-brand-700 transition-colors">
            Apply now
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {apps.map((app) => {
            const c = cfg(app.decision, app.status)
            return (
              <Link key={app.application_id} to={`/result/${app.application_id}`}
                className="group flex items-center gap-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all p-4 pl-5">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${c.iconBg}`}>
                  {c.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">
                    ${app.loan_amnt?.toLocaleString()} · {app.purpose?.replace(/_/g, ' ').replace(/\b\w/g, x => x.toUpperCase())}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {app.submitted_at
                      ? new Date(app.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'
                    }
                    <span className="mx-1.5">·</span>
                    ID #{app.application_id}
                  </p>
                </div>
                {app.confidence > 0 && (
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <p className="text-xs text-slate-400">confidence</p>
                    <p className="text-sm font-semibold text-slate-700">{(app.confidence * 100).toFixed(0)}%</p>
                  </div>
                )}
                <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${c.badge}`}>
                  {app.decision || app.status}
                </span>
                <span className="text-slate-300 group-hover:text-slate-500 transition-colors text-sm flex-shrink-0">→</span>
              </Link>
            )
          })}
        </div>
      )}

    </div>
  )
}