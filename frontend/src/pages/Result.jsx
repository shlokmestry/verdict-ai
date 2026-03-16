import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle } from 'lucide-react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8007'

function FactorBar({ feature, impact, direction }) {
  const pct = Math.min(Math.round(impact * 500), 100)
  const pos = direction === 'positive'
  const label = feature.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${pos ? 'bg-success' : 'bg-destructive'}`} />
      <span className="text-xs text-gray-600 w-44 flex-shrink-0 truncate font-medium font-mono">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className={`h-1.5 rounded-full ${pos ? 'bg-success' : 'bg-destructive'}`}
        />
      </div>
      <span className={`text-xs font-semibold w-14 text-right tabular-nums font-mono ${pos ? 'text-success' : 'text-destructive'}`}>
        {pos ? '+' : '−'}{impact.toFixed(3)}
      </span>
    </div>
  )
}

export default function Result() {
  const { id }                = useParams()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [polls, setPolls]     = useState(0)

  useEffect(() => {
    axios.get(`${API}/api/applications/${id}`, {
      headers: { Authorization: 'Bearer dev-token' },
    })
      .then(res => {
        setData(res.data)
        if (res.data.status === 'complete' || res.data.status === 'error') setLoading(false)
        else setPolls(p => p + 1)
      })
      .catch(() => setLoading(false))
  }, [id, polls])

  useEffect(() => {
    if (loading && polls > 0 && polls < 10) {
      const t = setTimeout(() => setPolls(p => p + 1), 2000)
      return () => clearTimeout(t)
    }
    if (polls >= 10) setLoading(false)
  }, [polls, loading])

  if (!data && loading) return (
    <div className="max-w-2xl mx-auto px-6 py-28 text-center">
      <div className="w-10 h-10 border-4 border-gray-100 border-t-gray-900 rounded-full animate-spin mx-auto mb-5" />
      <p className="text-gray-500 font-medium">Analysing your application…</p>
      <p className="text-gray-400 text-sm mt-1">This usually takes a few seconds</p>
    </div>
  )

  if (!data) return (
    <div className="max-w-2xl mx-auto px-6 py-28 text-center">
      <p className="text-gray-500 mb-4">Application not found.</p>
      <Link to="/apply" className="text-brand-600 font-medium text-sm hover:underline">Apply again →</Link>
    </div>
  )

  const approved = data.decision === 'approved'

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 space-y-5">

      {/* Decision banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`rounded-xl p-8 text-center border ${approved ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
        {approved
          ? <CheckCircle2 className="text-success mx-auto mb-4" size={48} />
          : <XCircle className="text-destructive mx-auto mb-4" size={48} />
        }
        <h1 className={`text-3xl font-bold mb-3 ${approved ? 'text-emerald-700' : 'text-red-700'}`}>
          {approved ? 'Approved' : 'Application Denied'}
        </h1>
        <div className="flex items-center justify-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium font-mono
            ${approved ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            {(data.confidence * 100).toFixed(0)}% confidence
          </span>
          <span className="text-gray-400 text-sm font-mono">
            p = {(data.probability * 100).toFixed(1)}%
          </span>
        </div>
      </motion.div>

      {data.status === 'processing' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 text-sm text-blue-700 flex items-center gap-2">
          <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          Generating your detailed explanation…
        </div>
      )}

      {/* SHAP factors */}
      {data.top_factors?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">What drove this decision</h2>
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded font-mono">SHAP values</span>
          </div>
          {data.top_factors.map((f, i) => <FactorBar key={i} {...f} />)}
          <p className="text-xs text-gray-400 mt-4 flex items-center gap-4">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-success inline-block" />helped</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-destructive inline-block" />hurt</span>
          </p>
        </motion.div>
      )}

      {/* Decision letter */}
      {data.explanation_email && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Decision Letter</h2>
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-100">
            <pre className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed font-sans">
              {data.explanation_email}
            </pre>
          </div>
        </motion.div>
      )}

      {/* Next best offers */}
      {data.next_best_offers?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Recommended next steps</h2>
          <p className="text-sm text-gray-400 mb-5">Based on your financial profile:</p>
          <div className="space-y-3">
            {data.next_best_offers.map((offer, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="w-7 h-7 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0 text-white font-mono font-bold text-xs">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-0.5">{offer.product}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{offer.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <Link to="/apply"
          className="flex-1 text-center bg-gray-900 text-white py-3 rounded-lg font-medium text-sm hover:bg-gray-800 transition-colors">
          New application
        </Link>
        <Link to="/history"
          className="flex-1 text-center border border-gray-200 text-gray-700 py-3 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors">
          View history
        </Link>
      </div>

    </div>
  )
}