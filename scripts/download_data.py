"""
Generates a realistic synthetic loan dataset for development.
Run: python scripts/download_data.py
"""
import numpy as np
import pandas as pd
from pathlib import Path
from loguru import logger

DATA_DIR = Path("data/raw")


def create_synthetic_dataset():
    """Create a realistic synthetic loan dataset."""
    np.random.seed(42)
    n = 50_000

    df = pd.DataFrame({
        "loan_amnt": np.random.choice(
            [5000, 10000, 15000, 20000, 25000, 35000], n
        ),
        "term": np.random.choice(
            [" 36 months", " 60 months"], n, p=[0.65, 0.35]
        ),
        "int_rate": np.round(np.random.uniform(5.0, 28.0, n), 2),
        "installment": np.round(np.random.uniform(100, 1500, n), 2),
        "grade": np.random.choice(
            ["A", "B", "C", "D", "E", "F", "G"], n,
            p=[0.18, 0.25, 0.22, 0.17, 0.10, 0.05, 0.03]
        ),
        "emp_length": np.random.choice([
            "< 1 year", "1 year", "2 years", "3 years", "4 years",
            "5 years", "6 years", "7 years", "8 years", "9 years", "10+ years"
        ], n),
        "home_ownership": np.random.choice(
            ["RENT", "OWN", "MORTGAGE", "OTHER"], n, p=[0.4, 0.1, 0.45, 0.05]
        ),
        "annual_inc": np.round(np.random.lognormal(10.8, 0.6, n), 2),
        "verification_status": np.random.choice(
            ["Verified", "Source Verified", "Not Verified"], n, p=[0.3, 0.3, 0.4]
        ),
        "purpose": np.random.choice([
            "debt_consolidation", "credit_card", "home_improvement",
            "other", "major_purchase", "small_business", "medical"
        ], n, p=[0.4, 0.2, 0.1, 0.1, 0.07, 0.07, 0.06]),
        "dti": np.round(np.random.uniform(0, 40, n), 2),
        "delinq_2yrs": np.random.choice([0, 1, 2, 3], n, p=[0.75, 0.15, 0.07, 0.03]),
        "fico_range_low": np.random.choice(range(580, 850, 5), n),
        "open_acc": np.random.randint(1, 35, n),
        "pub_rec": np.random.choice([0, 1, 2], n, p=[0.85, 0.12, 0.03]),
        "revol_bal": np.round(np.random.exponential(15000, n), 2),
        "revol_util": np.round(np.random.uniform(0, 120, n), 2).clip(0, 119.9),
        "total_acc": np.random.randint(2, 60, n),
        "mort_acc": np.random.randint(0, 10, n),
        "pub_rec_bankruptcies": np.random.choice([0, 1, 2], n, p=[0.90, 0.08, 0.02]),
        "addr_state": np.random.choice([
            "CA", "TX", "NY", "FL", "IL", "PA", "OH", "GA", "NC", "MI"
        ], n),
    })

    # Create target: 1 = Fully Paid, 0 = Charged Off
    # Based on realistic financial correlations
    grade_score  = df["grade"].map(
        {"A": 0.92, "B": 0.85, "C": 0.75, "D": 0.65, "E": 0.55, "F": 0.45, "G": 0.35}
    )
    dti_penalty  = (df["dti"] / 40) * 0.3
    fico_bonus   = ((df["fico_range_low"] - 580) / 270) * 0.2
    prob         = (grade_score - dti_penalty + fico_bonus).clip(0.1, 0.97)
    df["loan_status"] = np.random.binomial(1, prob)

    output_path = DATA_DIR / "loan_data.csv"
    df.to_csv(output_path, index=False)

    logger.success(f"Dataset created: {output_path}")
    logger.info(f"Shape: {df.shape}")
    logger.info(f"Approval rate: {df['loan_status'].mean():.1%}")


if __name__ == "__main__":
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    create_synthetic_dataset()