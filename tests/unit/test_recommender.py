import pytest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from recommender.engine import get_next_best_offers, score_product, PRODUCTS


class TestRecommender:

    def test_approved_returns_empty(self):
        profile = {"loan_amnt": 10000, "dti": 15.0, "fico_range_low": 720, "purpose": "debt_consolidation", "annual_inc": 60000}
        offers  = get_next_best_offers(profile, decision="approved")
        assert offers == []

    def test_denied_returns_offers(self):
        profile = {"loan_amnt": 15000, "dti": 38.0, "fico_range_low": 620, "purpose": "debt_consolidation", "annual_inc": 45000}
        offers  = get_next_best_offers(profile, decision="denied")
        assert len(offers) >= 1
        assert len(offers) <= 3

    def test_offer_has_required_fields(self):
        profile = {"loan_amnt": 15000, "dti": 38.0, "fico_range_low": 620, "purpose": "debt_consolidation", "annual_inc": 45000}
        offers  = get_next_best_offers(profile, decision="denied")
        for offer in offers:
            assert "product"     in offer
            assert "description" in offer
            assert "reason"      in offer

    def test_high_dti_gets_counselling(self):
        profile = {"loan_amnt": 10000, "dti": 42.0, "fico_range_low": 640, "purpose": "other", "annual_inc": 40000}
        offers  = get_next_best_offers(profile, decision="denied", top_n=5)
        products = [o["product"] for o in offers]
        assert any("Counselling" in p or "counselling" in p.lower() for p in products)

    def test_low_fico_gets_credit_building(self):
        profile = {"loan_amnt": 8000, "dti": 20.0, "fico_range_low": 600, "purpose": "credit_card", "annual_inc": 50000}
        offers  = get_next_best_offers(profile, decision="denied", top_n=5)
        products = [o["product"] for o in offers]
        assert any("Credit" in p for p in products)

    def test_ineligible_product_not_shown(self):
        # Very low FICO — should not get products requiring higher score
        profile = {"loan_amnt": 5000, "dti": 10.0, "fico_range_low": 510, "purpose": "other", "annual_inc": 30000}
        for product in PRODUCTS:
            score = score_product(product, profile)
            if profile["fico_range_low"] < product["min_fico"]:
                assert score == 0.0
