import numpy as np
import pandas as pd
import joblib
import mlflow
import mlflow.sklearn
import mlflow.xgboost
from pathlib import Path
from loguru import logger
from typing import Dict

from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, classification_report
)
import xgboost as xgb
import lightgbm as lgb

PROCESSED_DIR = Path("data/processed")
MODELS_DIR    = Path("models/trained")
ARTIFACTS_DIR = Path("models/artifacts")
EVAL_DIR      = Path("models/evaluation")


def load_splits() -> Dict:
    target = "loan_status"
    splits = {}
    for split in ["train", "val", "test"]:
        df = pd.read_csv(PROCESSED_DIR / f"{split}.csv")
        splits[f"X_{split}"] = df.drop(columns=[target])
        splits[f"y_{split}"] = df[target]
        logger.info(f"{split}: {len(df):,} rows")
    return splits


def get_model_configs() -> Dict:
    return {
        "logistic_regression": {
            "model": LogisticRegression(
                max_iter=1000, random_state=42, class_weight="balanced"
            ),
            "params": {"C": 1.0, "solver": "lbfgs"},
        },
        "random_forest": {
            "model": RandomForestClassifier(
                n_estimators=200,
                max_depth=12,
                min_samples_split=10,
                min_samples_leaf=4,
                class_weight="balanced",
                random_state=42,
                n_jobs=-1,
            ),
            "params": {"n_estimators": 200, "max_depth": 12},
        },
        "gradient_boosting": {
            "model": GradientBoostingClassifier(
                n_estimators=300,
                learning_rate=0.05,
                max_depth=5,
                subsample=0.8,
                random_state=42,
            ),
            "params": {"n_estimators": 300, "learning_rate": 0.05, "max_depth": 5},
        },
        "xgboost": {
            "model": xgb.XGBClassifier(
                n_estimators=400,
                learning_rate=0.04,
                max_depth=6,
                subsample=0.8,
                colsample_bytree=0.8,
                eval_metric="logloss",
                random_state=42,
                n_jobs=-1,
            ),
            "params": {"n_estimators": 400, "learning_rate": 0.04, "max_depth": 6},
        },
        "lightgbm": {
            "model": lgb.LGBMClassifier(
                n_estimators=400,
                learning_rate=0.04,
                max_depth=6,
                num_leaves=63,
                subsample=0.8,
                colsample_bytree=0.8,
                class_weight="balanced",
                random_state=42,
                n_jobs=-1,
                verbose=-1,
            ),
            "params": {"n_estimators": 400, "learning_rate": 0.04, "num_leaves": 63},
        },
    }


def evaluate_model(model, X, y, split_name: str) -> Dict:
    y_pred = model.predict(X)
    y_prob = model.predict_proba(X)[:, 1]
    return {
        f"{split_name}_accuracy":  round(accuracy_score(y, y_pred), 4),
        f"{split_name}_precision": round(precision_score(y, y_pred, zero_division=0), 4),
        f"{split_name}_recall":    round(recall_score(y, y_pred, zero_division=0), 4),
        f"{split_name}_f1":        round(f1_score(y, y_pred, zero_division=0), 4),
        f"{split_name}_roc_auc":   round(roc_auc_score(y, y_prob), 4),
    }


def train_all_models(splits: Dict) -> Dict:
    mlflow.set_tracking_uri("./mlruns")
    mlflow.set_experiment("loan_approval_models")

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    EVAL_DIR.mkdir(parents=True, exist_ok=True)

    results = {}

    for name, config in get_model_configs().items():
        logger.info(f"\n{'='*50}\nTraining: {name}\n{'='*50}")

        with mlflow.start_run(run_name=name):
            model = config["model"]
            mlflow.log_params(config["params"])
            model.fit(splits["X_train"], splits["y_train"])

            all_metrics = {}
            for split in ["train", "val", "test"]:
                metrics = evaluate_model(
                    model, splits[f"X_{split}"], splits[f"y_{split}"], split
                )
                all_metrics.update(metrics)
                logger.info(
                    f"  {split.upper()} — "
                    f"AUC: {metrics[f'{split}_roc_auc']:.4f}  "
                    f"F1:  {metrics[f'{split}_f1']:.4f}  "
                    f"Acc: {metrics[f'{split}_accuracy']:.4f}"
                )

            mlflow.log_metrics(all_metrics)

            report      = classification_report(
                splits["y_test"], model.predict(splits["X_test"])
            )
            report_path = EVAL_DIR / f"{name}_report.txt"
            report_path.write_text(report)
            mlflow.log_artifact(str(report_path))

            model_path = MODELS_DIR / f"{name}.joblib"
            joblib.dump(model, model_path)

            results[name] = {
                "model":       model,
                "metrics":     all_metrics,
                "val_roc_auc": all_metrics["val_roc_auc"],
                "model_path":  str(model_path),
            }

    return results


def select_and_save_best(results: Dict) -> str:
    best_name = max(results, key=lambda k: results[k]["val_roc_auc"])
    best_auc  = results[best_name]["val_roc_auc"]
    logger.success(f"\nBest model: {best_name}  (val ROC AUC = {best_auc:.4f})")

    import shutil
    src  = Path(results[best_name]["model_path"])
    dest = MODELS_DIR / "best_model.joblib"
    shutil.copy(src, dest)
    (MODELS_DIR / "best_model_name.txt").write_text(best_name)
    logger.success(f"Saved best model -> {dest}")
    return best_name


def print_leaderboard(results: Dict):
    print("\n" + "="*65)
    print(f"{'Model':<25} {'Val AUC':>8} {'Val F1':>8} {'Test AUC':>9}")
    print("-"*65)
    for name, r in sorted(results.items(), key=lambda x: -x[1]["val_roc_auc"]):
        m = r["metrics"]
        print(
            f"{name:<25} "
            f"{m['val_roc_auc']:>8.4f} "
            f"{m['val_f1']:>8.4f} "
            f"{m['test_roc_auc']:>9.4f}"
        )
    print("="*65)


if __name__ == "__main__":
    splits    = load_splits()
    results   = train_all_models(splits)
    best_name = select_and_save_best(results)
    print_leaderboard(results)
