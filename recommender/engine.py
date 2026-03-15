"""
Next Best Offer Recommender Engine.
When a loan is denied, suggests the most relevant alternative
financial products based on the applicant's profile.
No ML or API needed — pure rule-based logic with scoring.
"""
from loguru import logger
from typing import List, Dict, Any


PRODUCTS = [
    {
        "product":     "Small Personal Loan",
        "description": "A smaller loan amount that better fits your current financial profile.",
        "reason_template": "A smaller loan of ${amount:,.0f} may be more achievable given your current debt-to-income ratio.",
        "min_fico":    580,
        "max_dti":     45,
        "type":        "loan",
    },
    {
        "product":     "Credit Builder Loan",
        "description": "A secured loan designed to help you build or repair your credit score.",
        "reason_template": "Your FICO score of {fico} could benefit from a credit builder loan, which reports positive payment history to all three bureaus.",
        "min_fico":    500,
        "max_dti":     50,
        "type":        "credit_building",
    },
    {
        "product":     "Secured Credit Card",
        "description": "A credit card backed by a deposit that helps establish a positive credit history.",
        "reason_template": "A secured credit card with responsible use could improve your credit score by 40-60 points within 12 months.",
        "min_fico":    500,
        "max_dti":     50,
        "type":        "credit_building",
    },
    {
        "product":     "Debt Consolidation Counselling",
        "description": "Free financial counselling to help reduce your debt-to-income ratio.",
        "reason_template": "Your DTI of {dti:.1f}% is above our threshold. A certified counsellor can help you create a plan to reduce it.",
        "min_fico":    500,
        "max_dti":     100,
        "type":        "counselling",
        "trigger_dti": 35,
    },
    {
        "product":     "High-Yield Savings Account",
        "description": "Build an emergency fund and demonstrate financial stability.",
        "reason_template": "Building 3-6 months of savings strengthens your financial profile and may improve future loan applications.",
        "min_fico":    500,
        "max_dti":     100,
        "type":        "savings",
    },
    {
        "product":     "Credit Score Improvement Plan",
        "description": "A personalised 90-day plan to improve your credit score.",
        "reason_template": "Your FICO score of {fico} is below our preferred threshold of 670. Our plan can help you reach it in 90 days.",
        "min_fico":    500,
        "max_dti":     100,
        "type":        "credit_building",
        "trigger_fico_below": 670,
    },
]


def score_product(product: Dict, profile: Dict) -> float:
    """
    Score how relevant a product is for this applicant.
    Higher score = more relevant recommendation.
    """
    score = 0.0
    fico  = profile["fico_range_low"]
    dti   = profile["dti"]

    # Basic eligibility
    if fico < product["min_fico"]:
        return 0.0
    if dti > product["max_dti"]:
        return 0.0

    # Boost score based on specific triggers
    if product.get("trigger_dti") and dti >= product["trigger_dti"]:
        score += 3.0

    if product.get("trigger_fico_below") and fico < product["trigger_fico_below"]:
        score += 3.0

    # Credit building products score higher for lower FICO
    if product["type"] == "credit_building" and fico < 650:
        score += 2.0

    # Smaller loan is relevant if original loan was large
    if product["type"] == "loan":
        if profile["loan_amnt"] > 15000:
            score += 2.0
        else:
            score += 1.0

    # Counselling is very relevant for high DTI
    if product["type"] == "counselling" and dti > 35:
        score += 2.0

    # Base score for passing eligibility
    score += 1.0

    return score


def format_reason(product: Dict, profile: Dict) -> str:
    """Fill in the reason template with actual applicant values."""
    try:
        return product["reason_template"].format(
            amount = profile["loan_amnt"] * 0.5,
            fico   = profile["fico_range_low"],
            dti    = profile["dti"],
        )
    except (KeyError, ValueError):
        return product["description"]


def get_next_best_offers(
    profile:    Dict[str, Any],
    decision:   str,
    top_n:      int = 3,
) -> List[Dict[str, str]]:
    """
    Generate next best offer recommendations for a denied application.

    Args:
        profile:  dict with loan_amnt, dti, fico_range_low, purpose, annual_inc
        decision: "approved" or "denied"
        top_n:    number of recommendations to return

    Returns:
        List of {product, description, reason} dicts
    """
    if decision == "approved":
        logger.info("Application approved — no next best offers needed")
        return []

    logger.info(f"Generating next best offers for denied application...")
    logger.info(f"Profile: FICO={profile.get('fico_range_low')}, DTI={profile.get('dti'):.1f}%")

    scored = []
    for product in PRODUCTS:
        score = score_product(product, profile)
        if score > 0:
            scored.append((score, product))

    # Sort by score descending
    scored.sort(key=lambda x: -x[0])

    offers = []
    for score, product in scored[:top_n]:
        offers.append({
            "product":     product["product"],
            "description": product["description"],
            "reason":      format_reason(product, profile),
        })

    logger.success(f"Generated {len(offers)} next best offers")
    return offers
