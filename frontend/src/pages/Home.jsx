import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Eye, ShieldCheck, Lightbulb, ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8007'

const steps = [
  { n: '01', title: 'Fill the form',   desc: 'Provide your financial profile in under 2 minutes.' },
  { n: '02', title: 'ML model runs',   desc: 'Our bias-checked model analyzes 40+ factors instantly.' },
  { n: '03', title: 'Get your answer', desc: 'Instant decision with a full impact report.' },
]

const features = [
  { Icon: Zap,         title: 'Instant decision',   desc: 'Get approved or denied in seconds, not days. Our ML pipeline runs in real-time.',            color: 'text-brand-500'  },
  { Icon: Eye,         title: 'Full transparency',  desc: 'SHAP-powered factor analysis shows exactly why the model made its decision.',                 color: 'text-success'    },
  { Icon: ShieldCheck, title: 'Bias-checked',       desc: 'Every model is audited for demographic parity and equal opportunity metrics.',                color: 'text-warning'    },
  { Icon: Lightbulb,   title: 'Smart alternatives', desc: 'If denied, receive personalised next-best-offer recommendations.',                            color: 'text-destructive' },
]

const ease = [0.16, 1, 0.3, 1]

function AnimatedCount({ target }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!target) return
    const duration = 1000
    const start = Date.now()
    const raf = () => {
      const t = Math.min((Date.now() - start) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      setCount(Math.round(ease * target))
      if (t < 1) requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
  }, [target])

  return <span>{count.toLocaleString()}</span>
}

function LiveCounter() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    axios.get(`${API}/api/applications`, {
      headers: { Authorization: 'Bearer dev-token' },
    })
      .then(res => {
        const apps = res.data.filter(a => a.status !== 'error')
        const total    = apps.length
        const approved = apps.filter(a => a.decision === 'approved').length
        const denied   = apps.filter(a => a.decision === 'denied').length
        const rate     = total > 0 ? Math.round((approved / total) * 100) : 0
        setStats({ total, approved, denied, rate })
      })
      .catch(() => {})
  }, [])

  if (!stats || stats.total === 0) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ duration: 0.5, ease }}
      className="mb-32"
    >
      <div className="border border-gray-100 rounded-2xl p-8 bg-gray-50">
        <p className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-6 text-center">
          live stats
        </p>
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-3xl font-bold text-gray-900 tabular-nums">
              <AnimatedCount target={stats.total} />
            </p>
            <p className="text-xs text-gray-400 mt-1">decisions made</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-emerald-600 tabular-nums">
              <AnimatedCount target={stats.rate} />%
            </p>
            <p className="text-xs text-gray-400 mt-1">approval rate</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900 tabular-nums">
              <AnimatedCount target={stats.approved} />
            </p>
            <p className="text-xs text-gray-400 mt-1">approved</p>
          </div>
        </div>
      </div>
    </motion.section>
  )
}

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-20">

      {/* Hero */}
      <section className="text-center mb-32">
        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6 leading-[1.1]">
          Loan decisions you can <br />
          <span className="text-gray-400 italic">actually</span> understand.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease }}
          className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          Verdict uses interpretable ML to provide instant credit approvals with full factor transparency. No black boxes.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease }}
          className="flex gap-4 justify-center">
          <Link to="/apply"
            className="px-6 py-3 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors active:scale-[0.98]">
            Apply now
          </Link>
          <Link to="/history"
            className="px-6 py-3 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors active:scale-[0.98]">
            View history
          </Link>
        </motion.div>
      </section>

      {/* Live counter */}
      <LiveCounter />

      {/* Steps */}
      <section className="grid md:grid-cols-3 gap-12 mb-32">
        {steps.map((s, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5, ease }}
            className="relative">
            <div className="font-mono text-sm text-brand-500 mb-4">{s.n}</div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">{s.title}</h3>
            <p className="text-gray-500">{s.desc}</p>
            {i < 2 && (
              <ArrowRight className="hidden md:block absolute -right-6 top-10 text-gray-200" size={20} />
            )}
          </motion.div>
        ))}
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-2 gap-6 mb-20">
        {features.map(({ Icon, title, desc, color }, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.05, duration: 0.5, ease }}
            className="p-8 border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <Icon className={`${color} mb-4`} size={28} />
            <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
          </motion.div>
        ))}
      </section>

    </div>
  )
}