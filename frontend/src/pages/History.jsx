import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Clock, ArrowRight } from 'lucide-react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8007'

const STATUS = {
  approved: { Icon: CheckCircle2, bg: 'bg-emerald-50',  text: 'text-success',     badge: 'bg-emerald-50 text-emerald-700',  label: 'Approved' },
  denied:   { Icon: XCircle,      bg: 'bg-red-50',      text: 'text-destructive', badge: 'bg-red-50 text-red-700',          label: 'Denied'   },
  pending:  { Icon: Clock,        bg: 'bg-amber-50',    text: 'text-warning',     badge: 'bg-amber-50 text-amber-700',      label: 'Pending'  },
  error:    { Icon: Clock,        bg: 'bg-gray-50',     text: 'text-gray-400',    badge: 'bg-gray-100 text-gray-500',       label: 'Error'    },
}

function cfg(decision, status) {
  return STATUS[decision] || STATUS[status] || STATUS.error
}

export default function History() {
  const [apps, setApps]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API}/api/applications`, {
      headers: { Authorization: 'Bearer dev-token' },
    })
 .then(res => setApps(res.data.filter(app => app.status !== 'error')))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-20 bg-gray-50 rounded-xl animate-pulse" />
      ))}
    </div>
  )

  if (apps.length === 0) return (
    <div className="max-w-4xl mx-auto px-6 py-24 text-center">
      <div className="text-5xl mb-4">📋</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">No applications yet</h2>
      <p className="text-gray-500 mb-8">Submit your first loan application to get started.</p>
      <Link to="/apply"
        className="inline-flex px-6 py-3 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors">
        Apply now
      </Link>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Application History</h1>
          <p className="text-gray-400 mt-1">
            <span className="font-mono tabular-nums">{apps.length}</span> application{apps.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link to="/apply"
          className="px-5 py-2.5 rounded-lg bg-gray-900 text-white font-medium text-sm hover:bg-gray-800 transition-colors">
          + New application
        </Link>
      </div>

      <div className="space-y-3">
        {apps.map((app, i) => {
          const c = cfg(app.decision, app.status)
          return (
            <motion.div key={app.application_id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
              <Link to={`/result/${app.application_id}`}
                className="group flex items-center gap-4 p-5 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                <div className={`w-10 h-10 rounded-full ${c.bg} flex items-center justify-center flex-shrink-0`}>
                  <c.Icon size={18} className={c.text} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 font-mono tabular-nums text-sm">
                      ${app.loan_amnt?.toLocaleString()}
                    </span>
                    <span className="text-gray-300">·</span>
                    <span className="text-sm text-gray-500 truncate">
                      {app.purpose?.replace(/_/g, ' ').replace(/\b\w/g, x => x.toUpperCase())}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 font-mono">
                    <span>
                      {app.submitted_at
                        ? new Date(app.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </span>
                    <span>·</span>
                    <span>#{app.application_id}</span>
                  </div>
                </div>
                {app.confidence > 0 && (
                  <div className="hidden sm:block px-3 py-1 bg-gray-50 rounded-full text-xs font-mono font-medium tabular-nums text-gray-500">
                    {(app.confidence * 100).toFixed(1)}%
                  </div>
                )}
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${c.badge}`}>
                  {c.label}
                </div>
                <ArrowRight size={16} className="text-gray-200 group-hover:text-gray-400 transition-colors flex-shrink-0" />
              </Link>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}