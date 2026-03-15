"""
Full data preprocessing pipeline.
Cleans, engineers features, encodes, splits, and scales the loan dataset.
Run: python data/preprocessing.py
"""
import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from loguru import logger
from typing import Tuple

DATA_DIR    = Path("data")
MODELS_DIR  = Path("models/artifacts")


class LoanDataPreprocessor:

    def __init__(self):
        self.scaler          = StandardScaler()
        self.imputer         = SimpleImputer(strategy="median")
        self.feature_columns = []
        self.is_fitted       = False

    # ------------------------------------------------------------------
    def load_data(self, path: str = "data/raw/loan_data.csv") -> pd.DataFrame:
        logger.info(f"Loading data from {path}")
        df = pd.read_csv(path)
        logger.info(f"Loaded {len(df):,} rows × {len(df.columns)} columns")
        assert "loan_status" in df.columns, "Target column missing"
        return df

    # ------------------------------------------------------------------
    def clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        logger.info("Cleaning data...")
        df = df.copy()

        # Drop columns with >40% missing
        missing_pct  = df.isnull().mean()
        cols_to_drop = missing_pct[missing_pct > 0.4].index.tolist()
        if cols_to_drop:
            logger.warning(f"Dropping high-missing columns: {cols_to_drop}")
            df = df.drop(columns=cols_to_drop)

        # " 36 months" → 36
        if "term" in df.columns:
            df["term"] = df["term"].str.extract(r"(\d+)").astype(float)

        # emp_length → numeric
        if "emp_length" in df.columns:
            emp_map = {
                "< 1 year": 0, "1 year": 1, "2 years": 2, "3 years": 3,
                "4 years": 4,  "5 years": 5, "6 years": 6, "7 years": 7,
                "8 years": 8,  "9 years": 9, "10+ years": 10
            }
            df["emp_length"] = df["emp_length"].map(emp_map)

        # Cap income at 99th percentile
        if "annual_inc" in df.columns:
            cap = df["annual_inc"].quantile(0.99)
            df["annual_inc"] = df["annual_inc"].clip(upper=cap)

        logger.info(f"After cleaning: {len(df):,} rows × {len(df.columns)} columns")
        return df

    # ------------------------------------------------------------------
    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        logger.info("Engineering features...")
        df = df.copy()

        if "loan_amnt" in df.columns and "annual_inc" in df.columns:
            df["loan_to_income"] = df["loan_amnt"] / (df["annual_inc"] + 1)

        if "installment" in df.columns and "annual_inc" in df.columns:
            df["installment_to_income"] = df["installment"] / (df["annual_inc"] / 12 + 1)

        if "revol_util" in df.columns:
            df["revol_util"] = df["revol_util"].clip(0, 100)

        if "fico_range_low" in df.columns:
            df["fico_score"] = df["fico_range_low"] + 9

        if "grade" in df.columns:
            grade_map = {"A": 1, "B": 2, "C": 3, "D": 4, "E": 5, "F": 6, "G": 7}
            df["grade_numeric"] = df["grade"].map(grade_map)

        derog_cols = [c for c in ["pub_rec", "delinq_2yrs", "pub_rec_bankruptcies"]
                      if c in df.columns]
        if derog_cols:
            df["derogatory_marks"] = df[derog_cols].sum(axis=1)

        logger.info(f"Features after engineering: {len(df.columns)} columns")
        return df

    # ------------------------------------------------------------------
    def encode_categoricals(self, df: pd.DataFrame, fit: bool = True) -> pd.DataFrame:
        logger.info("Encoding categorical features...")
        df = df.copy()

        ohe_cols = [c for c in [
            "home_ownership", "purpose", "verification_status", "addr_state"
        ] if c in df.columns]

        if ohe_cols:
            df = pd.get_dummies(df, columns=ohe_cols, drop_first=True, dtype=int)

        # Drop raw grade string (we already have grade_numeric)
        if "grade" in df.columns:
            df = df.drop(columns=["grade"])

        return df

    # ------------------------------------------------------------------
    def split_data(self, df: pd.DataFrame):
        target = "loan_status"
        X = df.drop(columns=[target])
        y = df[target]

        X_train, X_temp, y_train, y_temp = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        X_val, X_test, y_val, y_test = train_test_split(
            X_temp, y_temp, test_size=0.5, random_state=42, stratify=y_temp
        )

        logger.info(
            f"Split — Train: {len(X_train):,} | Val: {len(X_val):,} | Test: {len(X_test):,}"
        )
        return (
            pd.concat([X_train, y_train], axis=1),
            pd.concat([X_val,   y_val],   axis=1),
            pd.concat([X_test,  y_test],  axis=1),
        )

    # ------------------------------------------------------------------
    def scale_features(self, X: pd.DataFrame, fit: bool = True) -> pd.DataFrame:
        numeric_cols = X.select_dtypes(include=[np.number]).columns.tolist()

        if fit:
            X[numeric_cols]      = self.scaler.fit_transform(X[numeric_cols])
            self.feature_columns = X.columns.tolist()
        else:
            X = X.reindex(columns=self.feature_columns, fill_value=0)
            X[numeric_cols] = self.scaler.transform(X[numeric_cols])

        return X

    # ------------------------------------------------------------------
    def fit_transform(self, raw_path: str = "data/raw/loan_data.csv"):
        """Full pipeline — call this to process everything end to end."""
        df = self.load_data(raw_path)
        df = self.clean_data(df)
        df = self.engineer_features(df)
        df = self.encode_categoricals(df, fit=True)

        train_df, val_df, test_df = self.split_data(df)

        target  = "loan_status"
        X_train = train_df.drop(columns=[target])
        y_train = train_df[target]
        X_val   = val_df.drop(columns=[target])
        y_val   = val_df[target]
        X_test  = test_df.drop(columns=[target])
        y_test  = test_df[target]

        X_train = self.scale_features(X_train, fit=True)
        X_val   = self.scale_features(X_val,   fit=False)
        X_test  = self.scale_features(X_test,  fit=False)

        # Save processed splits
        PROCESSED = DATA_DIR / "processed"
        PROCESSED.mkdir(exist_ok=True)

        for name, X, y in [
            ("train", X_train, y_train),
            ("val",   X_val,   y_val),
            ("test",  X_test,  y_test),
        ]:
            pd.concat([X, y], axis=1).to_csv(PROCESSED / f"{name}.csv", index=False)
            logger.success(f"Saved data/processed/{name}.csv")

        # Save preprocessor for the API to use later
        MODELS_DIR.mkdir(parents=True, exist_ok=True)
        joblib.dump(self, MODELS_DIR / "preprocessor.joblib")
        logger.success("Saved models/artifacts/preprocessor.joblib")

        self.is_fitted = True
        return X_train, X_val, X_test, y_train, y_val, y_test

    # ------------------------------------------------------------------
    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transform new inference data using the fitted preprocessor."""
        assert self.is_fitted, "Call fit_transform() first"
        df = self.clean_data(df)
        df = self.engineer_features(df)
        df = self.encode_categoricals(df, fit=False)
        X  = df.drop(columns=["loan_status"], errors="ignore")
        # Align to training columns before scaling
        if self.feature_columns:
            for col in self.feature_columns:
                if col not in X.columns:
                    X[col] = 0
            X = X[self.feature_columns]
        X  = self.scale_features(X, fit=False)
        return X


if __name__ == "__main__":
    preprocessor = LoanDataPreprocessor()
    preprocessor.fit_transform()
    logger.info("Preprocessing complete.")