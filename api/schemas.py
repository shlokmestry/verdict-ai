from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class HomeOwnership(str, Enum):
    rent     = "RENT"
    own      = "OWN"
    mortgage = "MORTGAGE"
    other    = "OTHER"

class LoanPurpose(str, Enum):
    debt_consolidation = "debt_consolidation"
    credit_card        = "credit_card"
    home_improvement   = "home_improvement"
    major_purchase     = "major_purchase"
    medical            = "medical"
    small_business     = "small_business"
    other              = "other"

class LoanApplicationRequest(BaseModel):
    loan_amnt:      float = Field(..., ge=1000, le=40000)
    term:           int   = Field(..., ge=36,   le=60)
    purpose:        LoanPurpose
    annual_inc:     float = Field(..., ge=0)
    dti:            float = Field(..., ge=0,    le=50)
    fico_range_low: int   = Field(..., ge=580,  le=850)
    home_ownership: HomeOwnership
    emp_length:     int   = Field(..., ge=0,    le=10)

    @field_validator("term")
    @classmethod
    def term_must_be_36_or_60(cls, v):
        if v not in (36, 60):
            raise ValueError("Term must be 36 or 60 months")
        return v

class SHAPFactor(BaseModel):
    feature:   str
    value:     float
    impact:    float
    direction: str

class NextBestOffer(BaseModel):
    product:     str
    description: str
    reason:      str

class LoanDecisionResponse(BaseModel):
    application_id:    int
    decision:          str
    probability:       float
    confidence:        float
    explanation_email: Optional[str]
    top_factors:       List[SHAPFactor]
    next_best_offers:  Optional[List[NextBestOffer]]
    status:            str
    processed_at:      Optional[datetime]

class HealthResponse(BaseModel):
    status:        str
    model_loaded:  bool
    model_version: str
    db_connected:  bool
