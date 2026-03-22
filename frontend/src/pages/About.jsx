import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Brain, BarChart2, ShieldCheck, Lightbulb, GitBranch, Database } from 'lucide-react'

const ease = [0.16, 1, 0.3, 1]

const stack = [
  { Icon: Database,    label: 'Data Pipeline',      desc: 'Raw LendingClub loan data cleaned, engineered, and split into train/val/test sets. 40+ features including loan-to-income ratio, derogatory marks, and credit utilisation.' },
  { Icon: Brain,       label: 'ML Models',           desc: 'Five models trained and tracked with MLflow: Logistic Regression, Random Forest, Gradient Boosting, XGBoost, and LightGBM. Best performer selected automatically.' },
  { Icon: BarChart2,   label: 'SHAP Explainability', desc: 'Every decision comes with SHAP values showing exactly which features pushed the model toward approval or denial — and by how much.' },
  { Icon: ShieldCheck, label: 'Bias Auditing',       desc: 'Models evaluated for demographic parity and equal opportunity. Fairness metrics tracked alongside accuracy, precision, recall, and ROC AUC.' },
  { Icon: Lightbulb,   label: 'Recommender Engine',  desc: 'If denied, an intelligent scoring engine recommends the next best financial product — credit builder loans, smaller amounts, or savings products.' },
  { Icon: GitBranch,   label: 'Tech Stack',          desc: 'FastAPI backend on Railway. React + Tailwind frontend on Vercel. SQLite database. MLflow for experiment tracking. Framer Motion for animations.' },
]

const faqs = [
  {
    q: 'Is this a real bank?',
    a: 'No - ExplainMyDecision is a portfolio project demonstrating how interpretable ML can be applied to credit decisions. No real loans are issued.',
  },
  {
    q: 'What data does the model use?',
    a: 'The model was trained on publicly available LendingClub loan data. It uses financial features like DTI, FICO score, income, employment length, and loan purpose no demographic data.',
  },
  {
    q: 'What is a SHAP value?',
    a: 'SHAP (SHapley Additive exPlanations) values measure how much each feature contributed to a specific prediction. A positive SHAP value means the feature pushed toward approval; negative means it pushed toward denial.',
  },
  {
    q: 'Why is confidence sometimes low?',
    a: 'Confidence reflects how certain the model is about its decision. A 55% confidence approval means the application is borderline the features are close to the decision boundary.',
  },
  {
    q: 'Which model is running?',
    a: 'The best performing model is selected automatically after training based on ROC AUC on the validation set. You can see which model is active on the /health endpoint.',
  },
]

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="mb-20">
        <p className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-4">About</p>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-6 leading-tight">
          How it works
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl leading-relaxed">
          ExplainMyDecision is an end-to-end AI loan approval system built to demonstrate
          how machine learning can make credit decisions that are fast, fair, and fully explainable.
        </p>
      </motion.div>

      {/* System flow */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.5, ease }}
        className="mb-20">
        <h2 className="text-xl font-bold text-gray-900 mb-8">The pipeline</h2>
        <div className="relative">
          {['Loan application submitted', 'Data preprocessed & features engineered', 'ML model generates prediction', 'SHAP values calculated', 'Decision + explanation returned', 'Next best offer generated if denied'].map((step, i) => (
            <div key={i} className="flex gap-4 mb-6 last:mb-0">
              <div className="flex flex-col items-center">
                <div className="w-7 h-7 rounded-full bg-gray-900 text-white text-xs font-mono font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </div>
                {i < 5 && <div className="w-px flex-1 bg-gray-100 mt-2" />}
              </div>
              <div className="pb-6 last:pb-0">
                <p className="text-sm font-medium text-gray-900 pt-1">{step}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Stack cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.5, ease }}
        className="mb-20">
        <h2 className="text-xl font-bold text-gray-900 mb-8">Under the hood</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {stack.map(({ Icon, label, desc }, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.05, duration: 0.4, ease }}
              className="p-6 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <Icon size={18} className="text-gray-400" />
                <h3 className="font-semibold text-gray-900 text-sm">{label}</h3>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* FAQ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.5, ease }}
        className="mb-20">
        <h2 className="text-xl font-bold text-gray-900 mb-8">FAQ</h2>
        <div className="space-y-6">
          {faqs.map(({ q, a }, i) => (
            <div key={i} className="border-b border-gray-50 pb-6 last:border-0">
              <p className="font-semibold text-gray-900 mb-2 text-sm">{q}</p>
              <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.5, ease }}
        className="border border-gray-100 rounded-2xl p-10 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">See it in action</h2>
        <p className="text-gray-500 mb-6 text-sm">Submit a loan application and get a decision with full explainability in seconds.</p>
        <div className="flex gap-3 justify-center">
          <Link to="/apply"
            className="px-6 py-3 rounded-lg bg-gray-900 text-white font-medium text-sm hover:bg-gray-800 transition-colors">
            Apply now
          </Link>
          <a href="https://github.com/shlokmestry/explainmydecision"
            target="_blank" rel="noopener noreferrer"
            className="px-6 py-3 rounded-lg border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors">
            View on GitHub ↗
          </a>
        </div>
      </motion.div>

    </div>
  )
}