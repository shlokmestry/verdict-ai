import { Link } from 'react-router-dom'

const features = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 10L7 14L17 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Instant decision',
    desc: 'ML model trained on thousands of loan records gives you an answer in seconds.',
    color: 'text-emerald-600 bg-emerald-50',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="2"/>
        <path d="M10 7v3l2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Full transparency',
    desc: 'SHAP explainability shows exactly which factors drove your approval or denial.',
    color: 'text-blue-600 bg-blue-50',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2L12.5 7.5H18L13.5 11L15.5 17L10 13.5L4.5 17L6.5 11L2 7.5H7.5L10 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Bias-checked',
    desc: 'Every AI-generated response passes through a guardrail agent before you see it.',
    color: 'text-violet-600 bg-violet-50',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 14l4-4 3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="16" cy="6" r="2" fill="currentColor"/>
      </svg>
    ),
    title: 'Smart alternatives',
    desc: 'Denied? Our recommender finds the right financial product for your situation.',
    color: 'text-amber-600 bg-amber-50',
  },
]

const steps = [
  { n: '01', title: 'Fill the form',   desc: 'Income, credit score, loan amount — takes 60 seconds.' },
  { n: '02', title: 'ML model runs',   desc: 'Gradient boosting model scores your application instantly.' },
  { n: '03', title: 'Get your answer', desc: 'Full decision + SHAP factors + plain-English letter.' },
]

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-6">

      {/* ── Hero ── */}
      <section className="py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-8 tracking-wide uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 inline-block" />
          AI-powered · Explainable · Fair
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 mb-6 leading-[1.1] tracking-tight">
          Loan decisions you can<br />
          <span className="text-brand-600">actually understand</span>
        </h1>

        <p className="text-lg text-slate-500 mb-10 max-w-xl mx-auto leading-relaxed">
          Instant AI-powered decisions with plain-English explanations of every factor that matters.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link to="/apply"
            className="bg-brand-600 text-white px-7 py-3.5 rounded-xl text-base font-semibold hover:bg-brand-700 transition-colors shadow-md shadow-brand-100">
            Apply now — it's free
          </Link>
          <Link to="/history"
            className="bg-white border border-slate-200 text-slate-700 px-7 py-3.5 rounded-xl text-base font-medium hover:bg-slate-50 transition-colors">
            View history
          </Link>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="mb-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-900">How it works</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {steps.map((s, i) => (
            <div key={s.n} className="relative bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              {i < steps.length - 1 && (
                <div className="hidden sm:block absolute top-8 -right-2 z-10 text-slate-300 text-lg">→</div>
              )}
              <div className="text-3xl font-black text-slate-100 mb-3 leading-none">{s.n}</div>
              <h3 className="font-semibold text-slate-900 mb-1">{s.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="mb-24">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-900">Why explainmydecision</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((f) => (
            <div key={f.title}
              className="bg-white rounded-2xl border border-slate-100 p-7 shadow-sm hover:shadow-md transition-shadow flex gap-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${f.color}`}>
                {f.icon}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1.5">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}