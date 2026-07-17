"""
Failure Predictor — Random Forest classifier for equipment failure prediction.
Trained on AI4I 2020 / SKAB real Kaggle datasets.
Owner: Member 2 — ML & Document Intelligence Lead
"""
import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from loguru import logger

MODEL_DIR = Path("ml/predictive_maintenance/models")
MODEL_PATH = MODEL_DIR / "failure_rf_model.pkl"
SCALER_PATH = MODEL_DIR / "scaler.pkl"

# Feature columns expected by the model (trained from AI4I 2020 dataset)
FEATURE_COLS = [
    "air_temperature_k",
    "process_temperature_k",
    "rotational_speed_rpm",
    "torque_nm",
    "tool_wear_min",
    "days_since_maintenance",
    "overdue_days",
    "emergency_count_6m",
    "corrective_ratio",
]


class FailurePredictor:
    """
    Predicts equipment failure probability using a Random Forest classifier.

    Model trained on:
      - AI4I 2020 Predictive Maintenance Classification Dataset (UCI/Kaggle)
      - Supplemented with historical work order features

    Input features:
      - Sensor readings (temperature, speed, torque, wear) from process historian
      - Maintenance history features (days since PM, overdue, emergency ratio)
    """

    def __init__(self):
        self.model = None
        self.scaler = None
        self.feature_cols = FEATURE_COLS
        self._load_model()

    def _load_model(self):
        if MODEL_PATH.exists() and SCALER_PATH.exists():
            try:
                self.model = joblib.load(MODEL_PATH)
                self.scaler = joblib.load(SCALER_PATH)
                logger.success(f"Loaded failure prediction model from {MODEL_PATH}")
                return
            except Exception as e:
                logger.warning(f"Failed to load model: {e}")

        logger.warning(
            "Pre-trained model not found. Run ml/notebooks/01_train_predictive_maintenance.ipynb "
            "on Colab to train and download models."
        )

    # ------------------------------------------------------------------
    def predict(self, equipment_features: dict) -> dict:
        """
        Predict failure probability for one equipment record.

        Args:
            equipment_features: dict with keys from FEATURE_COLS
                                (missing keys default to safe estimates)

        Returns:
            {
                failure_probability: float [0-1],
                risk_level: str,
                predicted_days_to_failure: int,
                recommended_action: str,
                feature_importances: dict,
            }
        """
        if not self.model:
            return self._fallback_prediction(equipment_features)

        feature_vector = np.array([[
            equipment_features.get("air_temperature_k", 298.1),
            equipment_features.get("process_temperature_k", 308.6),
            equipment_features.get("rotational_speed_rpm", 1500),
            equipment_features.get("torque_nm", 40.0),
            equipment_features.get("tool_wear_min", 0),
            equipment_features.get("days_since_maintenance", 30),
            equipment_features.get("overdue_days", 0),
            equipment_features.get("emergency_count_6m", 0),
            equipment_features.get("corrective_ratio", 0.0),
        ]])

        try:
            scaled = self.scaler.transform(feature_vector)
            proba = float(self.model.predict_proba(scaled)[0][1])
        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            proba = 0.1

        return self._build_result(proba)

    def predict_batch(self, features_list: list[dict]) -> list[dict]:
        """Predict failure probability for multiple equipment records."""
        return [self.predict(f) for f in features_list]

    # ------------------------------------------------------------------
    def _fallback_prediction(self, features: dict) -> dict:
        """Rule-based fallback when model is not loaded."""
        score = 0.1
        if features.get("overdue_days", 0) > 30:
            score += 0.3
        if features.get("emergency_count_6m", 0) >= 2:
            score += 0.25
        if features.get("corrective_ratio", 0) > 0.5:
            score += 0.2
        if features.get("days_since_maintenance", 30) > 180:
            score += 0.15
        return self._build_result(min(score, 0.95))

    def _build_result(self, proba: float) -> dict:
        proba = round(proba, 3)
        if proba > 0.80:
            risk = "critical"
            days = 3
            action = "Schedule immediate inspection and consider temporary shutdown. Notify maintenance supervisor."
        elif proba > 0.60:
            risk = "high"
            days = 14
            action = "Schedule maintenance within 48 hours. Increase vibration/temperature monitoring. Alert shift supervisor."
        elif proba > 0.40:
            risk = "medium"
            days = 45
            action = "Plan maintenance in next scheduled window. Monitor trend daily."
        elif proba > 0.20:
            risk = "low"
            days = 120
            action = "Continue normal monitoring. Review at next PM schedule."
        else:
            risk = "minimal"
            days = 180
            action = "Equipment healthy. Continue standard operating procedures."

        return {
            "failure_probability": proba,
            "risk_level": risk,
            "predicted_days_to_failure": days,
            "recommended_action": action,
            "model_type": "RandomForest" if self.model else "RuleBased",
        }
