import numpy as np
import pandas as pd
import shap
import joblib
import json
from pathlib import Path
from loguru import logger
from typing import Dict, List, Any

MODELS_DIR    = Path("models/trained")
ARTIFACTS_DIR = Path("models/artifacts")


class LoanExplainer:

    def __init__(self, model_path: str = None):
        path           = model_path or str(MODELS_DIR / "best_model.joblib")
        self.model     = joblib.load(path)
        self.explainer = None
        self.is_kernel = False
        self._build_explainer()

    def _build_explainer(self):
        try:
            self.explainer = shap.TreeExplainer(self.model)
            logger.info("SHAP TreeExplainer ready")
        except Exception:
            logger.warning("TreeExplainer not supported, using KernelExplainer")
            X_train    = pd.read_csv("data/processed/train.csv").drop(columns=["loan_status"])
            background = shap.sample(X_train, 100, random_state=42)
            self.explainer = shap.KernelExplainer(
                self.model.predict_proba, background
            )
            self.is_kernel = True

    def _extract_class1_shap(self, shap_values, n_samples: int) -> np.ndarray:
        """
        Normalise SHAP output to shape (n_samples, n_features) for class 1.
        KernelExplainer with predict_proba returns (n_samples, n_features, n_classes).
        TreeExplainer returns list [class0_array, class1_array].
        """
        arr = np.array(shap_values)
        if arr.ndim == 3 and arr.shape[-1] == 2:
            # (n_samples, n_features, n_classes) — KernelExplainer
            return arr[:, :, 1]
        elif arr.ndim == 3 and arr.shape[0] == 2:
            # (n_classes, n_samples, n_features) — some TreeExplainer versions
            return arr[1]
        elif isinstance(shap_values, list):
            # list [class0, class1]
            return np.array(shap_values[1])
        else:
            return arr

    def explain_prediction(self, X: pd.DataFrame, top_n: int = 6) -> Dict[str, Any]:
        assert len(X) == 1, "Pass exactly one row"

        shap_values    = self.explainer.shap_values(X)
        sv_matrix      = self._extract_class1_shap(shap_values, n_samples=1)
        sv_flat        = sv_matrix[0]   # shape: (n_features,)

        feature_names  = X.columns.tolist()
        feature_values = X.iloc[0].tolist()

        factors = []
        for fname, fval, sval in zip(feature_names, feature_values, sv_flat):
            factors.append({
                "feature":    fname,
                "value":      round(float(fval), 4),
                "shap_value": round(float(sval), 4),
                "impact":     round(abs(float(sval)), 4),
                "direction":  "positive" if float(sval) > 0 else "negative",
            })

        factors.sort(key=lambda x: -x["impact"])

        prob     = float(self.model.predict_proba(X)[0][1])
        decision = "approved" if prob >= 0.5 else "denied"

        ev   = self.explainer.expected_value
        base = float(ev[1]) if hasattr(ev, "__len__") else float(ev)

        return {
            "decision":    decision,
            "probability": round(prob, 4),
            "confidence":  round(max(prob, 1 - prob), 4),
            "base_value":  round(base, 4),
            "top_factors": factors[:top_n],
        }

    def global_feature_importance(
        self, X_sample: pd.DataFrame, top_n: int = 15
    ) -> List[Dict]:
        shap_values   = self.explainer.shap_values(X_sample)
        sv_matrix     = self._extract_class1_shap(shap_values, n_samples=len(X_sample))
        mean_abs      = np.abs(sv_matrix).mean(axis=0)
        feature_names = X_sample.columns.tolist()

        importance = sorted([
            {"feature": f, "importance": round(float(v), 4)}
            for f, v in zip(feature_names, mean_abs)
        ], key=lambda x: -x["importance"])

        out_path = ARTIFACTS_DIR / "global_feature_importance.json"
        out_path.write_text(json.dumps(importance[:top_n], indent=2))
        logger.success(f"Global importance saved -> {out_path}")
        return importance[:top_n]


if __name__ == "__main__":
    X_test  = pd.read_csv("data/processed/test.csv").drop(columns=["loan_status"])
    sample  = X_test.iloc[[0]]

    explainer = LoanExplainer()
    result    = explainer.explain_prediction(sample)

    print(f"\nDecision:    {result['decision'].upper()}")
    print(f"Probability: {result['probability']:.1%}")
    print(f"Confidence:  {result['confidence']:.1%}")
    print(f"\nTop factors:")
    for f in result["top_factors"]:
        arrow = "▲" if f["direction"] == "positive" else "▼"
        print(f"  {arrow}  {f['feature']:<35} impact={f['impact']:.4f}")

    X_sample = X_test.sample(50, random_state=42)
    explainer.global_feature_importance(X_sample)
