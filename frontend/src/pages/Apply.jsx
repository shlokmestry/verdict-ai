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

const tooltips = {
  dti: {
    title: 'Debt-to-Income Ratio (DTI)',
    body: 'Your total monthly debt payments divided by your gross monthly income, expressed as a percentage. For example, if you pay $500/month in debts and earn $2,000/month, your DTI is 25%. Lenders prefer a DTI below 36%.',
  },
  fico: {
    title: 'FICO Credit Score',
    body: 'A number between 300–850 that represents your creditworthiness. It\'s calculated from your payment history, amounts owed, length of credit history, and more. Scores above 670 are considered good. You can find yours on Credit Karma or your bank app.',
  },
}

function Tooltip({ type }) {
  const [open, setOpen] = useState(false)
  const info = tooltips[type]

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-xs font-bold hover:bg-gray-300 transition-colors flex items-center justify-center leading-none"
      >
        ?
      </button>
      {open && (
        <>
          {/* backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          {/* popup */}
          <div className="absolute left-6 top-0 z-20 w-72 bg-white border border-gray-200 rounded-xl shadow-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-gray-900 text-sm">{info.title}</h4>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 ml-2 text-lg leading-none"
              >
                ×
              </button>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{info.body}</p>
          </div>
        </>
      )}
    </div>
  )
}

const inputCls = "w-full px-4 h-11 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition placeholder:text-gray-400"

function Field({ label, hint, tooltip, children }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <label className="text-sm font-medium text-gray-900">{label}</label>
        {tooltip && <Tooltip type={tooltip} />}
      </div>
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
    loan_amnt:      '',
    term:           '',
    purpose:        '',
    annual_inc:     '',
    dti:            '',
    fico_range_low: '',
    home_ownership: '',
    emp_length:     '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const payload = {
        loan_amnt:      Number(form.loan_amnt),
        term:           Number(form.term),
        purpose:        form.purpose,
        annual_inc:     Number(form.annual_inc),
        dti:            Number(form.dti),
        fico_range_low: Number(form.fico_range_low),
        home_ownership: form.home_ownership,
        emp_length:     Number(form.emp_length),
      }
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
      <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Loan Application</h1>
      <p className="text-gray-500 mb-8 text-sm">Fill in your details and get an instant AI-powered decision.</p>

      <form onSubmit={handleSubmit} className="space-y-12">

        {/* Loan Details */}
        <section>
          <SectionHeader label="Loan Details" />
          <div className="grid gap-6">
            <Field label="Loan Amount" hint="Between $1,000 and $40,000">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input type="number" name="loan_amnt" value={form.loan_amnt}
                  onChange={handleChange} min={1000} max={40000} required
                  placeholder="e.g. 10,000" className={inputCls + " pl-8"} />
              </div>
            </Field>

            <Field label="Term">
              <select name="term" value={form.term} onChange={handleChange} required
                className={inputCls + " appearance-none " + (!form.term ? 'text-gray-400' : 'text-gray-900')}>
                <option value="" disabled>Select a term</option>
                <option value={36}>36 months</option>
                <option value={60}>60 months</option>
              </select>
            </Field>

            <Field label="Purpose">
              <select name="purpose" value={form.purpose} onChange={handleChange} required
                className={inputCls + " appearance-none " + (!form.purpose ? 'text-gray-400' : 'text-gray-900')}>
                <option value="" disabled>Select a purpose</option>
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
                  placeholder="e.g. 60,000" className={inputCls + " pl-8"} />
              </div>
            </Field>

            <Field label="Debt-to-Income Ratio" hint="As a percentage of your monthly income" tooltip="dti">
              <div className="relative">
                <input type="number" name="dti" value={form.dti}
                  onChange={handleChange} min={0} max={100} step={0.1} required
                  placeholder="e.g. 15" className={inputCls + " pr-8"} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
            </Field>

            <Field label="FICO Credit Score" hint="Between 580 and 850" tooltip="fico">
              <input type="number" name="fico_range_low" value={form.fico_range_low}
                onChange={handleChange} min={580} max={850} required
                placeholder="e.g. 700" className={inputCls} />
            </Field>

            <Field label="Employment Length" hint="Years at current or most recent employer (0–10)">
              <input type="number" name="emp_length" value={form.emp_length}
                onChange={handleChange} min={0} max={10} required
                placeholder="e.g. 3" className={inputCls} />
            </Field>

            <Field label="Home Ownership">
              <select name="home_ownership" value={form.home_ownership} onChange={handleChange} required
                className={inputCls + " appearance-none " + (!form.home_ownership ? 'text-gray-400' : 'text-gray-900')}>
                <option value="" disabled>Select ownership status</option>
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
              Analysing your application…
            </>
          ) : 'Submit Application'}
        </button>

      </form>
    </div>
  )
}