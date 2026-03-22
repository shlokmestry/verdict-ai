```markdown
# Verdict AI

> Loan decisions you can actually understand.

Verdict is an AI-powered loan approval system that gives you an instant decision and explains every factor behind it in plain English. No black boxes. No confusion.

**Live:** [tryverdict.vercel.app](https://tryverdict.vercel.app)

---

## What it does

1. You fill in a short loan application form
2. A machine learning model trained on 50,000 loan records makes an instant decision
3. SHAP explainability shows exactly which factors drove the approval or denial
4. A Groq-powered LLM writes a plain-English decision letter
5. If denied, a recommendation engine suggests the best next financial product for your situation

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React + Tailwind CSS, deployed on Vercel |
| Backend | FastAPI, deployed on Railway |
| Database | Supabase PostgreSQL |
| ML Model | Logistic Regression + SHAP explainability |
| LLM | Groq (Llama 3.1) for decision letters |
| Recommender | Rule-based next-best-offer engine |
| Auth | Clerk JWT (dev bypass for demo) |

---

## ML Pipeline

- **Dataset:** 50,000 synthetic loan records with realistic financial correlations
- **Models trained:** Logistic Regression, Random Forest, Gradient Boosting, XGBoost, LightGBM
- **Best model:** Logistic Regression (Val AUC: 0.737)
- **Explainability:** SHAP values for per-prediction factor attribution
- **Features:** 41 engineered features including DTI, FICO score, loan-to-income ratio, derogatory marks

---


## Tagline

*The verdict on your loan. Finally explained.*
```

