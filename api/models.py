from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON
from sqlalchemy.sql import func
from api.database import Base

class User(Base):
    __tablename__ = "users"
    id            = Column(Integer, primary_key=True, index=True)
    clerk_user_id = Column(String, unique=True, index=True, nullable=False)
    email         = Column(String, unique=True, index=True, nullable=False)
    full_name     = Column(String, nullable=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    is_active     = Column(Boolean, default=True)

class LoanApplication(Base):
    __tablename__ = "loan_applications"
    id             = Column(Integer, primary_key=True, index=True)
    user_id        = Column(Integer, nullable=False, index=True)
    loan_amnt      = Column(Float, nullable=False)
    term           = Column(Integer, nullable=False)
    purpose        = Column(String, nullable=False)
    annual_inc     = Column(Float, nullable=False)
    dti            = Column(Float, nullable=False)
    fico_range_low = Column(Integer, nullable=False)
    home_ownership = Column(String, nullable=False)
    emp_length     = Column(Integer, nullable=False)
    decision       = Column(String, nullable=True)
    probability    = Column(Float, nullable=True)
    confidence     = Column(Float, nullable=True)
    model_version  = Column(String, nullable=True)
    explanation_email   = Column(Text, nullable=True)
    guardrail_passed    = Column(Boolean, nullable=True)
    escalated_to_human  = Column(Boolean, default=False)
    next_best_offers = Column(JSON, nullable=True)
    shap_factors     = Column(JSON, nullable=True)
    submitted_at  = Column(DateTime(timezone=True), server_default=func.now())
    processed_at  = Column(DateTime(timezone=True), nullable=True)
    status        = Column(String, default="pending")
