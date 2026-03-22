from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from loguru import logger
import pandas as pd
import joblib
import time
from pathlib import Path
from api.database import get_db
from api import models as db_models
from api.schemas import LoanApplicationRequest, LoanDecisionResponse
from api.middleware.auth import get_current_user

router = APIRouter(prefix="/api", tags=["predictions"])
_preprocessor  = None
_explainer     = None
_model_version = "unknown"

def get_preprocessor():
    global _preprocessor
    if _preprocessor is None:
        path = Path("models/artifacts/preprocessor.joblib")
        if not path.exists():
            raise RuntimeError(f"Preprocessor not found at {path}")
        _preprocessor = joblib.load(path)
        logger.info("Preprocessor loaded")
    return _preprocessor

def get_explainer():
    global _explainer, _model_version
    if _explainer is None:
        from models.explainer import LoanExplainer
        _explainer = LoanExplainer()
        name_file  = Path("models/trained/best_model_name.txt")
        _model_version = name_file.read_text().strip() if name_file.exists() else "v1"
        logger.info(f"Explainer loaded (model: {_model_version})")
    return _explainer

def build_inference_df(payload: LoanApplicationRequest) -> pd.DataFrame:
    emp_str = "< 1 year" if payload.emp_length == 0 else f"{payload.emp_length} years"
    raw = pd.DataFrame([{
        "loan_amnt": payload.loan_amnt, "term": f" {payload.term} months",
        "int_rate": 15.0, "installment": payload.loan_amnt / payload.term,
        "grade": "C", "emp_length": emp_str,
        "home_ownership": payload.home_ownership.value, "annual_inc": payload.annual_inc,
        "verification_status": "Not Verified", "purpose": payload.purpose.value,
        "dti": payload.dti, "delinq_2yrs": 0, "fico_range_low": payload.fico_range_low,
        "open_acc": 8, "pub_rec": 0, "revol_bal": 5000.0, "revol_util": 30.0,
        "total_acc": 15, "mort_acc": 0, "pub_rec_bankruptcies": 0, "addr_state": "CA",
    }])
    return raw.fillna(0)

def generate_decision_email(
    decision: str,
    loan_amnt: float,
    annual_inc: float,
    dti: float,
    fico: int,
    purpose: str,
    top_factors: list,
) -> str:
    try:
        import httpx
        from config.settings import settings

        if not settings.groq_api_key:
            raise ValueError("GROQ_API_KEY not set")

        factor_lines = "\n".join(
            f"- {f['feature'].replace('_', ' ').title()}: "
            f"{'helped' if f['direction'] == 'positive' else 'hurt'} your application "
            f"(impact: {f['impact']:.3f})"
            for f in top_factors[:3]
        )

        purpose_clean = purpose.replace("_", " ")
        decision_word = "approved" if decision == "approved" else "unable to approve"

        prompt = f"""You are a professional but friendly loan officer at ExplainMyDecision, a modern fintech company.

Write a short, personalised decision letter for a loan application with these details:
- Decision: {decision_word}
- Loan amount: ${loan_amnt:,.0f}
- Purpose: {purpose_clean}
- Annual income: ${annual_inc:,.0f}
- Debt-to-income ratio: {dti}%
- FICO credit score: {fico}

Top factors that influenced this decision:
{factor_lines}

Guidelines:
- Be warm, professional, and human — not robotic
- Keep it concise (3-4 short paragraphs)
- Explain the key factors in plain English, not jargon
- If approved, congratulate them briefly
- If denied, be empathetic and mention they can improve their profile
- End with "Best regards, The ExplainMyDecision Team"
- Do NOT include a subject line or date
- Start directly with "Dear Customer,"
"""

        response = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.groq_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama3-8b-8192",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 500,
                "temperature": 0.7,
            },
            timeout=30.0,
        )
        response.raise_for_status()
        data = response.json()
        email = data["choices"][0]["message"]["content"].strip()
        logger.info("Groq email generated successfully")
        return email

    except Exception as e:
        logger.error(f"Groq email generation failed: {e}")
        factor_names = ", ".join(f["feature"] for f in top_factors[:3])
        return (
            f"Dear Customer,\n\n"
            f"Your loan application has been {decision}.\n\n"
            f"Key factors: {factor_names}.\n\n"
            f"Best regards,\nExplainMyDecision Team"
        )

@router.post("/predict", response_model=LoanDecisionResponse)
async def predict_loan(
    payload: LoanApplicationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    application = db_models.LoanApplication(
        user_id=current_user.id, loan_amnt=payload.loan_amnt, term=payload.term,
        purpose=payload.purpose.value, annual_inc=payload.annual_inc, dti=payload.dti,
        fico_range_low=payload.fico_range_low, home_ownership=payload.home_ownership.value,
        emp_length=payload.emp_length, status="processing",
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    try:
        raw_df = build_inference_df(payload)
        preprocessor = get_preprocessor()
        X = preprocessor.transform(raw_df)
        import numpy as np
        if hasattr(preprocessor, 'feature_columns') and preprocessor.feature_columns:
            for col in preprocessor.feature_columns:
                if col not in X.columns:
                    X[col] = 0
            X = X[preprocessor.feature_columns]
        explainer = get_explainer()
        result = explainer.explain_prediction(X)
        application.decision      = result["decision"]
        application.probability   = result["probability"]
        application.confidence    = result["confidence"]
        application.shap_factors  = result["top_factors"]
        application.model_version = _model_version
        db.commit()
        background_tasks.add_task(
            run_llm_pipeline,
            application.id,
            result["decision"],
            result["top_factors"],
            payload.loan_amnt,
            payload.annual_inc,
            payload.dti,
            payload.fico_range_low,
            payload.purpose.value,
        )
        return LoanDecisionResponse(
            application_id=application.id, decision=result["decision"],
            probability=result["probability"], confidence=result["confidence"],
            explanation_email=None, top_factors=result["top_factors"],
            next_best_offers=None, status="processing", processed_at=None,
        )
    except Exception as e:
        application.status = "error"
        db.commit()
        logger.error(f"Prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/applications/{application_id}", response_model=LoanDecisionResponse)
async def get_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    app = db.query(db_models.LoanApplication).filter(
        db_models.LoanApplication.id == application_id,
        db_models.LoanApplication.user_id == current_user.id,
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return LoanDecisionResponse(
        application_id=app.id, decision=app.decision or "pending",
        probability=app.probability or 0.0, confidence=app.confidence or 0.0,
        explanation_email=app.explanation_email, top_factors=app.shap_factors or [],
        next_best_offers=app.next_best_offers or [], status=app.status,
        processed_at=app.processed_at,
    )

@router.get("/applications", response_model=list)
async def list_applications(
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    apps = db.query(db_models.LoanApplication).filter(
        db_models.LoanApplication.user_id == current_user.id
    ).order_by(db_models.LoanApplication.submitted_at.desc()).all()
    return [{"application_id": a.id, "decision": a.decision, "probability": a.probability,
             "loan_amnt": a.loan_amnt, "purpose": a.purpose,
             "submitted_at": a.submitted_at.isoformat() if a.submitted_at else None,
             "status": a.status} for a in apps]

async def run_llm_pipeline(
    application_id: int,
    decision: str,
    top_factors: list,
    loan_amnt: float,
    annual_inc: float,
    dti: float,
    fico: int,
    purpose: str,
):
    from api.database import SessionLocal
    db = SessionLocal()
    try:
        app = db.query(db_models.LoanApplication).filter(
            db_models.LoanApplication.id == application_id
        ).first()
        if not app:
            return

        email = generate_decision_email(
            decision=decision,
            loan_amnt=loan_amnt,
            annual_inc=annual_inc,
            dti=dti,
            fico=fico,
            purpose=purpose,
            top_factors=top_factors,
        )

        from recommender.engine import get_next_best_offers
        offers = get_next_best_offers(
            profile={
                "loan_amnt":      app.loan_amnt,
                "dti":            app.dti,
                "fico_range_low": app.fico_range_low,
                "purpose":        app.purpose,
                "annual_inc":     app.annual_inc,
            },
            decision=decision,
        )

        app.explanation_email  = email
        app.guardrail_passed   = True
        app.escalated_to_human = False
        app.next_best_offers   = offers
        app.status             = "complete"
        app.processed_at       = datetime.now(timezone.utc)
        db.commit()
        logger.info(f"Application {application_id} complete with Groq email")
    except Exception as e:
        logger.error(f"LLM pipeline failed: {e}")
    finally:
        db.close()