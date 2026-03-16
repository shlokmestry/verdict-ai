import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8007'

const purposeOptions = [
  { value: 'debt_consolidation', label: 'Debt Consolidation' },
  { value: 'credit_card',        label: 'Credit Card'        },
  { value: 'home_improvement',   label: 'Home Improvement'   },
  { value: 'major_purchase',     label: 'Major Purchase'     },
  { value: 'medical',            label: 'Medical'            },
  { value: 'small_business',     label: 'Small Business'     },
  { value: 'other',              label: 'Other'              },
]

const ownershipOptions = [
  { value: 'RENT',     label: 'Renting'      },
  { value: 'OWN',      label: 'Own outright' },
  { value: 'MORTGAGE', label: 'Mortgage'     },
  { value: 'OTHER',    label: 'Other'        },
]

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
        {hint && <span className="text-slate-400 font-normal ml-1.5 text-xs">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = "w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:bg-white transition-colors"

export default function Apply() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [form, setForm] = useState({
    loan_amnt:      10000,
    term:           36,
    purpose:        'debt_consolidation',
    annual_inc:     60000,
    dti:            15.0,
    fico_range_low: 680,
    home_ownership: 'RENT',
    emp_length:     3,
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    const isText = name === 'purpose' || name === 'home_ownership' || name === 'term'
    setForm(prev => ({ ...prev, [name]: isText ? value : Number(value) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const payload = { ...form, term: Number(form.term) }
      const res = await axios.post(`${API}/api/predict`, payload, {
        headers: { Authorization: 'Bearer dev-token' },
      })
      navigate(`/result/${res.data.application_id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Is the API running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Loan Application</h1>
        <p className="text-slate-500">Fill in your details and get an instant AI-powered decision.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50">

        {/* Loan Details */}
        <div className="p-7 space-y-5">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Loan Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Loan Amount" hint="$1,000 – $40,000">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input type="number" name="loan_amnt" value={form.loan_amnt}
                  onChange={handleChange} min={1000} max={40000} required
                  className={inputCls + " pl-7"} />
              </div>
            </Field>
            <Field label="Term">
              <select name="term" value={form.term} onChange={handleChange} className={inputCls}>
                <option value={36}>36 months</option>
                <option value={60}>60 months</option>
              </select>
            </Field>
          </div>
          <Field label="Purpose">
            <select name="purpose" value={form.purpose} onChange={handleChange} className={inputCls}>
              {purposeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
        </div>

        {/* Financial Profile */}
        <div className="p-7 space-y-5">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Financial Profile</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Annual Income" hint="before tax">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input type="number" name="annual_inc" value={form.annual_inc}
                  onChange={handleChange} min={0} required className={inputCls + " pl-7"} />
              </div>
            </Field>
            <Field label="Debt-to-Income" hint="% of monthly income">
              <div className="relative">
                <input type="number" name="dti" value={form.dti}
                  onChange={handleChange} min={0} max={50} step={0.1} required className={inputCls + " pr-7"} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
              </div>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="FICO Credit Score" hint="580 – 850">
              <input type="number" name="fico_range_low" value={form.fico_range_low}
                onChange={handleChange} min={580} max={850} required className={inputCls} />
            </Field>
            <Field label="Employment Length" hint="years">
              <input type="number" name="emp_length" value={form.emp_length}
                onChange={handleChange} min={0} max={10} required className={inputCls} />
            </Field>
          </div>
          <Field label="Home Ownership">
            <select name="home_ownership" value={form.home_ownership} onChange={handleChange} className={inputCls}>
              {ownershipOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
        </div>

        {/* Submit */}
        <div className="p-7 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 flex items-start gap-2">
              <span className="mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}
          <button type="submit" disabled={loading}
            className="w-full bg-brand-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2">
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analysing your application…
              </>
            ) : (
              'Submit Application →'
            )}
          </button>
          <p className="text-center text-xs text-slate-400">
            Your data is only used to demonstrate the AI model. Nothing is stored permanently.
          </p>
        </div>

      </form>
    </div>
  )
}