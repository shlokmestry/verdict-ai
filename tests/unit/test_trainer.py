import pytest
import numpy as np
import pandas as pd
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from models.trainer import evaluate_model, get_model_configs
from sklearn.ensemble import RandomForestClassifier


@pytest.fixture
def tiny_dataset():
    np.random.seed(42)
    n = 300
    X = pd.DataFrame(
        np.random.randn(n, 10),
        columns=[f"feature_{i}" for i in range(10)]
    )
    y = pd.Series(np.random.choice([0, 1], n))
    return X, y


class TestTrainer:

    def test_evaluate_model_returns_all_metrics(self, tiny_dataset):
        X, y  = tiny_dataset
        model = RandomForestClassifier(n_estimators=10, random_state=42)
        model.fit(X, y)
        metrics = evaluate_model(model, X, y, "train")
        for key in ["train_accuracy", "train_precision",
                    "train_recall", "train_f1", "train_roc_auc"]:
            assert key in metrics
            assert 0.0 <= metrics[key] <= 1.0

    def test_all_model_configs_instantiate(self):
        configs = get_model_configs()
        assert len(configs) == 5
        for name, config in configs.items():
            assert hasattr(config["model"], "fit")
            assert hasattr(config["model"], "predict_proba")

    def test_roc_auc_above_random(self, tiny_dataset):
        X, y  = tiny_dataset
        model = RandomForestClassifier(n_estimators=50, random_state=42)
        model.fit(X, y)
        metrics = evaluate_model(model, X, y, "train")
        assert metrics["train_roc_auc"] > 0.5
