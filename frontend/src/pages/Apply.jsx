import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8007'

const EUR_TO_USD = 1.08

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
    body: "A number between 300–850 that represents your creditworthiness. It's calculated from your payment history, amounts owed, length of credit history, and more. Scores above 670 are considered good. You can find yours on Credit Karma or your bank app.",
  },
}

const loadingMessages = [
  { msg: "Crunching your numbers…",       sub: "40+ factors, zero judgment."                                        },
  { msg: "Consulting the oracle…",        sub: "It's actually a gradient boosting model, but oracle sounds cooler." },
  { msg: "Calculating your fate…",        sub: "Don't panic. We've seen worse DTIs."                                },
  { msg: "Asking the algorithm nicely…",  sub: "SHAP values incoming."                                              },
  { msg: "Almost there…",                 sub: "Good things come to those who wait."                                },
]

const STEPS = ['Loan Details', 'Financial Profile', 'Submit']

function CurrencyToggle({ currency, onChange }) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      {['USD', 'EUR'].map(c => (
        <button key={c} type="button" onClick={() => onChange(c)}
          className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
            currency === c ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
          }`}>
          {c === 'USD' ? '$ USD' : '€ EUR'}
        </button>
      ))}
    </div>
  )
}

function ProgressBar({ step }) {
  const pct = (step / (STEPS.length - 1)) * 100
  return (
    <div className="mb-10">
      <div className="flex justify-between mb-2">
        {STEPS.map((label, i) => (
          <span key={i} className={`text-xs font-medium transition-colors ${i <= step ? 'text-gray-900' : 'text-gray-300'}`}>
            {label}
          </span>
        ))}
      </div>
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-1 bg-gray-900 rounded-full transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function LoanSummary({ form, currency, symbol, toUSD }) {
  const rawAmount  = Number(form.loan_amnt)
  const usdAmount  = toUSD(rawAmount)
  const term       = Number(form.term)
  const income     = Number(form.annual_inc)
  const hasAmount  = rawAmount >= 1000
  const hasTerm    = term > 0
  const monthlyPayment = hasAmount && hasTerm ? (rawAmount / term).toFixed(0) : null
  const affordability  = monthlyPayment && income > 0
    ? ((Number(monthlyPayment) / (income / 12)) * 100).toFixed(0) : null
  const purposeLabel = purposes.find(p => p.value === form.purpose)?.label
  const empty = !hasAmount && !hasTerm && !form.purpose

  return (
    <div className="sticky top-24 bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
      <p className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-4">Live summary</p>
      {empty ? (
        <p className="text-sm text-gray-300 italic">Fill in the form to see your summary</p>
      ) : (
        <div className="space-y-3">
          {hasAmount && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Loan amount</p>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{symbol}{rawAmount.toLocaleString()}</p>
              {currency === 'EUR' && (
                <p className="text-xs text-gray-300 mt-0.5">≈ ${Math.round(usdAmount).toLocaleString()} USD</p>
              )}
            </div>
          )}
          {hasTerm && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Term</p>
              <p className="text-sm font-medium text-gray-700">{term} months</p>
            </div>
          )}
          {purposeLabel && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Purpose</p>
              <p className="text-sm font-medium text-gray-700">{purposeLabel}</p>
            </div>
          )}
          {monthlyPayment && (
            <div className="pt-3 border-t border-gray-50">
              <p className="text-xs text-gray-400 mb-0.5">Est. monthly payment</p>
              <p className="text-lg font-bold text-gray-900 tabular-nums">
                ~{symbol}{Number(monthlyPayment).toLocaleString()}
                <span className="text-xs font-normal text-gray-400">/mo</span>
              </p>
              <p className="text-xs text-gray-300 mt-0.5">principal only, excl. interest</p>
            </div>
          )}
          {affordability && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Payment-to-income</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      Number(affordability) < 15 ? 'bg-emerald-500' :
                      Number(affordability) < 25 ? 'bg-amber-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${Math.min(Number(affordability), 100)}%` }}
                  />
                </div>
                <span className={`text-xs font-mono font-medium tabular-nums ${
                  Number(affordability) < 15 ? 'text-emerald-600' :
                  Number(affordability) < 25 ? 'text-amber-600' : 'text-red-500'
                }`}>{affordability}%</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function LoadingScreen() {
  const [step, setStep]       = useState(0)
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false)
      setTimeout(() => { setStep(s => s + 1); setVisible(true) }, 300)
    }, 2500)
    return () => clearInterval(t)
  }, [])
  const { msg, sub } = loadingMessages[step % loadingMessages.length]
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center gap-6 px-6">
      <div className="relative w-16 h-16">
        <svg viewBox="0 0 64 64" className="w-16 h-16" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="32" cy="32" r="28" fill="none" stroke="#e5e7eb" strokeWidth="3" />
          <circle cx="32" cy="32" r="28" fill="none" stroke="#111827" strokeWidth="3"
            strokeLinecap="round" strokeDasharray="44 132"
            style={{ animation: 'spin 1.2s linear infinite' }} />
        </svg>
      </div>
      <div className="text-center" style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease' }}>
        <p className="text-lg font-semibold text-gray-900 mb-1">{msg}</p>
        <p className="text-sm text-gray-400 max-w-xs">{sub}</p>
      </div>
      <div className="flex gap-2 items-center">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-900 transition-opacity duration-300"
            style={{ opacity: i === (step % 3) ? 1 : 0.2 }} />
        ))}
      </div>
      <style>{`@keyframes spin { from { stroke-dashoffset: 0 } to { stroke-dashoffset: -176 } }`}</style>
    </div>
  )
}

function Tooltip({ type }) {
  const [open, setOpen] = useState(false)
  const info = tooltips[type]
  return (
    <div className="relative inline-block">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-xs font-bold hover:bg-gray-300 transition-colors flex items-center justify-center leading-none">
        ?
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-6 top-0 z-20 w-64 md:w-72 bg-white border border-gray-200 rounded-xl shadow-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-gray-900 text-sm">{info.title}</h4>
              <button type="button" onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 ml-2 text-lg leading-none">×</button>
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

function getStep(form) {
  const loanDone    = form.loan_amnt && form.term && form.purpose
  const financeDone = form.annual_inc && form.dti && form.fico_range_low && form.emp_length && form.home_ownership
  if (financeDone && loanDone) return 2
  if (loanDone) return 1
  return 0
}

export default function Apply() {
  const navigate                = useNavigate()
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [currency, setCurrency] = useState('USD')
  const [form, setForm] = useState({
    loan_amnt: '', term: '', purpose: '', annual_inc: '',
    dti: '', fico_range_low: '', home_ownership: '', emp_length: '',
  })

  const isEUR  = currency === 'EUR'
  const symbol = isEUR ? '€' : '$'
  const toUSD  = (val) => isEUR ? val * EUR_TO_USD : val
  const maxLoan  = isEUR ? Math.round(40000 / EUR_TO_USD) : 40000
  const minLoan  = isEUR ? Math.round(1000  / EUR_TO_USD) : 1000
  const loanHint = isEUR
    ? `Between €${minLoan.toLocaleString()} and €${maxLoan.toLocaleString()} (≈ $1,000–$40,000)`
    : 'Between $1,000 and $40,000'

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleCurrencyChange = (c) => {
    setCurrency(c)
    setForm(prev => {
      const convert = (val, from, to) => {
        if (!val) return ''
        const n = Number(val)
        if (from === 'USD' && to === 'EUR') return Math.round(n / EUR_TO_USD).toString()
        if (from === 'EUR' && to === 'USD') return Math.round(n * EUR_TO_USD).toString()
        return val
      }
      return {
        ...prev,
        loan_amnt:  convert(prev.loan_amnt,  currency, c),
        annual_inc: convert(prev.annual_inc, currency, c),
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const payload = {
        loan_amnt:      Math.round(toUSD(Number(form.loan_amnt))),
        term:           Number(form.term),
        purpose:        form.purpose,
        annual_inc:     Math.round(toUSD(Number(form.annual_inc))),
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
      setLoading(false)
      setError(err.response?.data?.detail || 'Something went wrong. Is the API running?')
    }
  }

  if (loading) return <LoadingScreen />

  const step = getStep(form)

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Loan Application</h1>
          <p className="text-gray-500 mt-2 text-sm">Fill in your details and get an instant AI-powered decision.</p>
        </div>
        <CurrencyToggle currency={currency} onChange={handleCurrencyChange} />
      </div>

      <div className="mt-8">
        <ProgressBar step={step} />
      </div>

      <div className="flex gap-10">
        {/* Form — full width on mobile */}
        <form onSubmit={handleSubmit} className="flex-1 space-y-12 min-w-0">
          <section>
            <SectionHeader label="Loan Details" />
            <div className="grid gap-6">
              <Field label="Loan Amount" hint={loanHint}>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{symbol}</span>
                  <input type="number" name="loan_amnt" value={form.loan_amnt}
                    onChange={handleChange} min={minLoan} max={maxLoan} required
                    placeholder={`e.g. ${isEUR ? '9,000' : '10,000'}`}
                    className={inputCls + " pl-8"} />
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

          <section>
            <SectionHeader label="Financial Profile" />
            <div className="grid gap-6">
              <Field label="Annual Income" hint="Before tax">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{symbol}</span>
                  <input type="number" name="annual_inc" value={form.annual_inc}
                    onChange={handleChange} min={0} required
                    placeholder={`e.g. ${isEUR ? '55,000' : '60,000'}`}
                    className={inputCls + " pl-8"} />
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
            className="w-full py-4 text-base rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 transition-all active:scale-[0.98] disabled:opacity-50">
            Submit Application
          </button>
        </form>

        {/* Sidebar — only on large screens */}
        <div className="w-56 flex-shrink-0 hidden lg:block">
          <LoanSummary form={form} currency={currency} symbol={symbol} toUSD={toUSD} />
        </div>
      </div>
    </div>
  )
}