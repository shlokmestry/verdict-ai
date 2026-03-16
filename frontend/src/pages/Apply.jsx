import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8007'

const purposes = [
  { value: 'debt_consolidation', label: 'Debt Consolidation' },
  { value: 'credit_card',        label: 'Credit Card'        },
  { value: 'home_improvement',   label: 'Home Improvement'   },
  { value: 'major_purchase',     label: 'Major Purchase'     },
  { value: 'medical',            label: 'Medical'            },
  { value: 'small_business',     label: 'Small Business'     },
  { value: 'other',              label: 'Other'              },
]

const homeOptions = [
  { value: 'RENT',     label: 'Renting'      },
  { value: 'OWN',      label: 'Own outright' },
  { value: 'MORTGAGE', label: 'Mortgage'     },
  { value: 'OTHER',    label: 'Other'        },
]

const inputCls = "w-full px-4 h-11 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition placeholder:text-gray-400"

function Field({ label, hint, children }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-900">{label}</label>
      {children}
      {hint && <span className="text-xs text-gray-400">{hint}</span>}
    </div>
  )
}

function SectionHeader({ label }) {
  return (
    <h2 className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-6 flex items-center gap-2">
      <div className="w-2 h-2 bg-brand-500 rounded-full" />
      {label}
    </h2>
  )
}

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
    const isText = name === 'purpose' || name === 'home_ownership'
    setForm(prev => ({ ...prev, [name]: isText ? value : Number(value) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await axios.post(`${API}/api/predict`, { ...form, term: Number(form.term) }, {
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
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Loan Application</h1>

      <form onSubmit={handleSubmit} className="space-y-12">

        {/* Loan Details */}
        <section>
          <SectionHeader label="Loan Details" />
          <div className="grid gap-6">
            <Field label="Loan Amount">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input type="number" name="loan_amnt" value={form.loan_amnt}
                  onChange={handleChange} min={1000} max={40000} required
                  placeholder="10,000" className={inputCls + " pl-8"} />
              </div>
            </Field>
            <Field label="Term">
              <select name="term" value={form.term} onChange={handleChange} required className={inputCls + " appearance-none"}>
                <option value={36}>36 months</option>
                <option value={60}>60 months</option>
              </select>
            </Field>
            <Field label="Purpose">
              <select name="purpose" value={form.purpose} onChange={handleChange} required className={inputCls + " appearance-none"}>
                {purposes.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </Field>
          </div>
        </section>

        {/* Financial Profile */}
        <section>
          <SectionHeader label="Financial Profile" />
          <div className="grid gap-6">
            <Field label="Annual Income" hint="Before tax">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input type="number" name="annual_inc" value={form.annual_inc}
                  onChange={handleChange} min={0} required
                  placeholder="75,000" className={inputCls + " pl-8"} />
              </div>
            </Field>
            <Field label="Debt-to-Income" hint="% of monthly income">
              <div className="relative">
                <input type="number" name="dti" value={form.dti}
                  onChange={handleChange} min={0} max={100} step={0.1} required
                  placeholder="18.5" className={inputCls + " pr-8"} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
            </Field>
            <Field label="FICO Credit Score" hint="Must be between 580 and 850">
              <input type="number" name="fico_range_low" value={form.fico_range_low}
                onChange={handleChange} min={580} max={850} required
                placeholder="720" className={inputCls} />
            </Field>
            <Field label="Employment Length" hint="Years at current employer (0–10)">
              <input type="number" name="emp_length" value={form.emp_length}
                onChange={handleChange} min={0} max={10} required
                placeholder="5" className={inputCls} />
            </Field>
            <Field label="Home Ownership">
              <select name="home_ownership" value={form.home_ownership} onChange={handleChange} required className={inputCls + " appearance-none"}>
                {homeOptions.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
              </select>
            </Field>
          </div>
        </section>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            ⚠ {error}
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full py-4 text-base rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Submitting…
            </>
          ) : 'Submit Application'}
        </button>

      </form>
    </div>
  )
}