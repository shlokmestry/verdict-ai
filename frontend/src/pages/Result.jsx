import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8007'

function FactorBar({ feature, impact, direction }) {
  const pct   = Math.min(Math.round(impact * 500), 100)
  const pos   = direction === 'positive'
  const label = feature.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${pos ? 'bg-emerald-400' : 'bg-red-400'}`} />
      <span className="text-xs text-slate-600 w-44 flex-shrink-0 truncate font-medium">{label}</span>
      <div className="flex-1 bg-slate-100 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all duration-700 ${pos ? 'bg-emerald-400' : 'bg-red-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-semibold w-14 text-right tabular-nums ${pos ? 'text-emerald-600' : 'text-red-500'}`}>
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
        if (res.data.status === 'complete' || res.data.status === 'error') {
          setLoading(false)
        } else {
          setPolls(p => p + 1)
        }
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
      <div className="w-12 h-12 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin mx-auto mb-5" />
      <p className="text-slate-500 font-medium">Analysing your application…</p>
      <p className="text-slate-400 text-sm mt-1">This usually takes a few seconds</p>
    </div>
  )

  if (!data) return (
    <div className="max-w-2xl mx-auto px-6 py-28 text-center">
      <p className="text-slate-500 mb-4">Application not found.</p>
      <Link to="/apply" className="text-brand-600 font-medium text-sm hover:underline">Apply again →</Link>
    </div>
  )

  const approved = data.decision === 'approved'

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 space-y-5">

      {/* Decision banner */}
      <div className={`rounded-2xl p-8 text-center border-2
        ${approved ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-black
          ${approved ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'}`}>
          {approved ? '✓' : '✗'}
        </div>
        <h1 className={`text-3xl font-bold mb-2 ${approved ? 'text-emerald-700' : 'text-red-700'}`}>
          {approved ? 'Approved' : 'Application Denied'}
        </h1>
        <div className="flex items-center justify-center gap-4 text-sm">
          <span className={`px-3 py-1 rounded-full font-medium
            ${approved ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            {(data.confidence * 100).toFixed(0)}% confidence
          </span>
          <span className="text-slate-400">
            Probability: {(data.probability * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Still processing */}
      {data.status === 'processing' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 text-sm text-blue-700 flex items-center gap-2">
          <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          Generating your detailed explanation…
        </div>
      )}

      {/* SHAP factors */}
      {data.top_factors?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">What drove this decision</h2>
            <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-md">SHAP values</span>
          </div>
          {data.top_factors.map((f, i) => <FactorBar key={i} {...f} />)}
          <p className="text-xs text-slate-400 mt-4 flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> helped your application
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> hurt your application
            </span>
          </p>
        </div>
      )}

      {/* Explanation email */}
      {data.explanation_email && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Your Decision Letter</h2>
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
            <pre className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed font-sans">
              {data.explanation_email}
            </pre>
          </div>
        </div>
      )}

      {/* Next best offers */}
      {data.next_best_offers?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-1">Recommended next steps</h2>
          <p className="text-sm text-slate-400 mb-5">Based on your financial profile, we suggest:</p>
          <div className="space-y-3">
            {data.next_best_offers.map((offer, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                <div className="w-8 h-8 bg-brand-50 rounded-full flex items-center justify-center flex-shrink-0 text-brand-600 font-bold text-sm">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm mb-0.5">{offer.product}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{offer.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <Link to="/apply"
          className="flex-1 text-center bg-brand-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-brand-700 transition-colors shadow-sm">
          New application
        </Link>
        <Link to="/history"
          className="flex-1 text-center bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-medium text-sm hover:bg-slate-50 transition-colors">
          View history
        </Link>
      </div>

    </div>
  )
}