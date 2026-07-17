"""
Anomaly Detector — Isolation Forest for multivariate sensor anomaly detection.
Trained on SKAB (Skoltech Anomaly Benchmark) dataset.
Owner: Member 2 — ML & Document Intelligence Lead
"""
import joblib
import numpy as np
from pathlib import Path
from loguru import logger

MODEL_DIR = Path("ml/predictive_maintenance/models")
ISO_MODEL_PATH = MODEL_DIR / "iso_forest.pkl"
ISO_SCALER_PATH = MODEL_DIR / "iso_scaler.pkl"

# SKAB sensor columns used for training
SENSOR_COLS = [
    "Accelerometer1RMS",
    "Accelerometer2RMS",
    "Current",
    "Pressure",
    "Temperature",
    "Thermocouple",
    "Voltage",
    "Volume Flow RateRMS",
]


class AnomalyDetector:
    """
    Detects anomalies in sensor time-series using Isolation Forest.

    Trained on the SKAB dataset (Skoltech Anomaly Benchmark) which contains
    real water pump sensor readings with labelled anomaly events.

    For a new reading, returns anomaly score and classification.
    """

    def __init__(self):
        self.model = None
        self.scaler = None
        self.sensor_cols = SENSOR_COLS
        self._load_model()

    def _load_model(self):
        if ISO_MODEL_PATH.exists() and ISO_SCALER_PATH.exists():
            try:
                self.model = joblib.load(ISO_MODEL_PATH)
                self.scaler = joblib.load(ISO_SCALER_PATH)
                logger.success(f"Loaded Isolation Forest model from {ISO_MODEL_PATH}")
                return
            except Exception as e:
                logger.warning(f"Failed to load anomaly model: {e}")

        logger.warning(
            "Isolation Forest model not found. "
            "Run ml/notebooks/01_train_predictive_maintenance.ipynb to train."
        )

    # ------------------------------------------------------------------
    def detect(self, sensor_readings: dict) -> dict:
        """
        Detect if current sensor readings are anomalous.

        Args:
            sensor_readings: dict with sensor name → float value pairs.
                             Unknown keys are ignored; missing keys default to 0.

        Returns:
            {
                is_anomaly: bool,
                anomaly_score: float,   # higher = more anomalous (0–1 scaled)
                severity: str,
                triggered_sensors: list[str],
                recommendation: str,
            }
        """
        if not self.model:
            return self._fallback_detect(sensor_readings)

        vector = np.array([[
            float(sensor_readings.get(col, 0.0))
            for col in self.sensor_cols
        ]])

        try:
            scaled = self.scaler.transform(vector)
            raw_score = float(self.model.score_samples(scaled)[0])
            # Isolation Forest: more negative = more anomalous
            # Map to [0, 1] where 1 = most anomalous
            anomaly_score = round(max(0.0, min(1.0, -raw_score)), 3)
            prediction = int(self.model.predict(scaled)[0])  # -1 = anomaly, 1 = normal
            is_anomaly = prediction == -1
        except Exception as e:
            logger.error(f"Anomaly detection failed: {e}")
            return self._fallback_detect(sensor_readings)

        # Find which sensors deviated most from expected
        triggered = self._find_triggered_sensors(sensor_readings, anomaly_score)

        return {
            "is_anomaly": is_anomaly,
            "anomaly_score": anomaly_score,
            "severity": self._severity(anomaly_score),
            "triggered_sensors": triggered,
            "recommendation": self._recommendation(is_anomaly, anomaly_score),
            "model_type": "IsolationForest",
        }

    def detect_batch(self, readings_list: list[dict]) -> list[dict]:
        """Detect anomalies in a batch of sensor reading snapshots."""
        return [self.detect(r) for r in readings_list]

    # ------------------------------------------------------------------
    def _fallback_detect(self, readings: dict) -> dict:
        """Simple threshold-based anomaly detection as fallback."""
        threshold_violations = []
        thresholds = {
            "Temperature": (0, 200),
            "Pressure": (0, 50),
            "Current": (0, 30),
            "Voltage": (180, 250),
        }
        for sensor, (low, high) in thresholds.items():
            val = readings.get(sensor)
            if val is not None and (val < low or val > high):
                threshold_violations.append(sensor)

        is_anomaly = len(threshold_violations) > 0
        score = min(1.0, len(threshold_violations) * 0.3)

        return {
            "is_anomaly": is_anomaly,
            "anomaly_score": round(score, 3),
            "severity": self._severity(score),
            "triggered_sensors": threshold_violations,
            "recommendation": self._recommendation(is_anomaly, score),
            "model_type": "ThresholdFallback",
        }

    def _find_triggered_sensors(self, readings: dict, score: float) -> list[str]:
        """Identify sensors with unusual values (simple z-score proxy)."""
        if score < 0.3:
            return []
        # Return sensors with extreme values relative to typical ranges
        triggered = []
        typical = {
            "Accelerometer1RMS": (0, 5),
            "Accelerometer2RMS": (0, 5),
            "Current": (0, 25),
            "Pressure": (0, 40),
            "Temperature": (20, 120),
        }
        for sensor, (low, high) in typical.items():
            val = readings.get(sensor)
            if val is not None and (val < low * 0.5 or val > high * 1.5):
                triggered.append(sensor)
        return triggered

    def _severity(self, score: float) -> str:
        if score > 0.7: return "critical"
        if score > 0.5: return "high"
        if score > 0.3: return "medium"
        return "low"

    def _recommendation(self, is_anomaly: bool, score: float) -> str:
        if not is_anomaly:
            return "Sensor readings within normal operating envelope."
        if score > 0.7:
            return "CRITICAL anomaly detected. Alert operator immediately. Consider equipment shutdown."
        if score > 0.5:
            return "Significant anomaly. Inspect equipment within 2 hours. Check physical conditions."
        return "Minor anomaly. Monitor trend. Inspect at next opportunity."
