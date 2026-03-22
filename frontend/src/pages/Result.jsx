import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Copy, Check } from 'lucide-react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8007'

const SHAP_LABELS = {
  dti:                    'Debt-to-Income Ratio',
  fico_range_low:         'Credit Score',
  fico_score:             'Credit Score',
  annual_inc:             'Annual Income',
  loan_amnt:              'Loan Amount',
  loan_to_income:         'Loan-to-Income Ratio',
  installment_to_income:  'Installment-to-Income',
  emp_length:             'Employment Length',
  grade_numeric:          'Loan Grade',
  open_acc:               'Open Accounts',
  revol_util:             'Credit Utilisation',
  derogatory_marks:       'Derogatory Marks',
  term:                   'Loan Term',
  pub_rec:                'Public Records',
  delinq_2yrs:            'Delinquencies (2yr)',
}

function friendlyLabel(feature) {
  return SHAP_LABELS[feature] ||
    feature.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function ConfidenceArc({ value }) {
  const [current, setCurrent] = useState(0)
  const size = 140
  const r = 54
  const cx = 70
  const cy = 70
  const circumference = Math.PI * r
  const offset = circumference * (1 - current / 100)

  useEffect(() => {
    const start = Date.now()
    const duration = 1200
    const raf = () => {
      const t = Math.min((Date.now() - start) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      setCurrent(Math.round(ease * value))
      if (t < 1) requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
  }, [value])

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size * 0.6} viewBox={`0 0 ${size} ${size * 0.6}`}>
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="#e5e7eb" strokeWidth="10" strokeLinecap="round" />
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={value >= 70 ? '#10b981' : value >= 50 ? '#f59e0b' : '#ef4444'}
          strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.05s linear' }}
        />
      </svg>
      <p className="text-3xl font-bold text-gray-900 -mt-2 tabular-nums">{current}%</p>
      <p className="text-xs text-gray-400 font-mono">confidence</p>
    </div>
  )
}

function FactorBar({ feature, impact, direction }) {
  const pct = Math.min(Math.round(impact * 500), 100)
  const pos = direction === 'positive'
  const label = friendlyLabel(feature)
  return (
    <div className="flex items-center gap-2 md:gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${pos ? 'bg-emerald-500' : 'bg-red-400'}`} />
      <span className="text-xs text-gray-600 w-32 md:w-44 flex-shrink-0 truncate font-medium">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className={`h-1.5 rounded-full ${pos ? 'bg-emerald-500' : 'bg-red-400'}`}
        />
      </div>
      <span className={`text-xs font-semibold w-12 md:w-14 text-right tabular-nums font-mono ${pos ? 'text-emerald-600' : 'text-red-500'}`}>
        {pos ? '+' : '−'}{impact.toFixed(3)}
      </span>
    </div>
  )
}

function ShareButton() {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors px-3 py-1.5 border border-gray-200 rounded-lg">
      {copied
        ? <><Check size={12} className="text-emerald-500" /> Copied!</>
        : <><Copy size={12} /> Share result</>}
    </button>
  )
}

function fireConfetti() {
  const script = document.createElement('script')
  script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js'
  script.onload = () => {
    window.confetti({ particleCount: 120, spread: 80, origin: { y: 0.55 }, colors: ['#10b981', '#6ee7b7', '#111827', '#d1fae5'] })
    setTimeout(() => {
      window.confetti({ particleCount: 60, spread: 60, origin: { y: 0.5, x: 0.3 }, colors: ['#10b981', '#6ee7b7'] })
      window.confetti({ particleCount: 60, spread: 60, origin: { y: 0.5, x: 0.7 }, colors: ['#111827', '#d1fae5'] })
    }, 300)
  }
  document.head.appendChild(script)
}

export default function Result() {
  const { id }                = useParams()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [polls, setPolls]     = useState(0)
  const confettiFired         = useRef(false)

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

  useEffect(() => {
    if (data?.decision === 'approved' && !confettiFired.current) {
      confettiFired.current = true
      setTimeout(fireConfetti, 400)
    }
  }, [data])

  if (!data && loading) return (
    <div className="max-w-2xl mx-auto px-4 py-28 text-center">
      <div className="w-10 h-10 border-4 border-gray-100 border-t-gray-900 rounded-full animate-spin mx-auto mb-5" />
      <p className="text-gray-500 font-medium">Analysing your application…</p>
      <p className="text-gray-400 text-sm mt-1">This usually takes a few seconds</p>
    </div>
  )

  if (!data) return (
    <div className="max-w-2xl mx-auto px-4 py-28 text-center">
      <p className="text-gray-500 mb-4">Application not found.</p>
      <Link to="/apply" className="text-brand-600 font-medium text-sm hover:underline">Apply again →</Link>
    </div>
  )

  const approved = data.decision === 'approved'

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-5">

      {/* Decision banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`rounded-xl p-6 md:p-8 text-center border ${approved ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
        {approved
          ? <CheckCircle2 className="text-emerald-500 mx-auto mb-4" size={48} />
          : <XCircle className="text-red-400 mx-auto mb-4" size={48} />}
        <h1 className={`text-2xl md:text-3xl font-bold mb-6 ${approved ? 'text-emerald-700' : 'text-red-700'}`}>
          {approved ? 'Approved' : 'Application Denied'}
        </h1>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8">
          <ConfidenceArc value={Math.round(data.confidence * 100)} />
          <div className="text-center sm:text-left">
            <p className="text-xs text-gray-400 mb-1 font-mono">approval probability</p>
            <p className="text-2xl font-bold text-gray-900 tabular-nums font-mono">
              {(data.probability * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-gray-400 mt-3 font-mono">application #{id}</p>
          </div>
        </div>
        <div className="flex justify-center mt-5">
          <ShareButton />
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
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 md:p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">What drove this decision</h2>
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded font-mono">SHAP values</span>
          </div>
          {data.top_factors.map((f, i) => <FactorBar key={i} {...f} />)}
          <p className="text-xs text-gray-400 mt-4 flex items-center gap-4">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />helped</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />hurt</span>
          </p>
        </motion.div>
      )}

      {/* Decision letter */}
      {data.explanation_email && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 md:p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Decision Letter</h2>
          <div className="bg-gray-50 rounded-lg p-4 md:p-5 border border-gray-100">
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
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 md:p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Recommended next steps</h2>
          <p className="text-sm text-gray-400 mb-5">Based on your financial profile:</p>
          <div className="space-y-3">
            {data.next_best_offers.map((offer, i) => (
              <div key={i} className="flex items-start gap-3 md:gap-4 p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
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