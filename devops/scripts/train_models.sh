#!/usr/bin/env bash
# train_models.sh
# Train all ML models on synthetic data
# Owner: Member 4 — Data & DevOps Lead

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  IndustrialBrain PS08 — ML Model Training"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Step 1: Train failure prediction model (Random Forest) ───────────────────────
echo ""
echo "[1/3] Training failure prediction model..."
python ml/predictive_maintenance/model_trainer.py \
    --model-type failure_predictor \
    --input data/seeds/maintenance_logs.json \
    --output ml/predictive_maintenance/models/failure_rf_model.pkl

echo "✅ Failure prediction model trained."

# ── Step 2: Train anomaly detection model (Isolation Forest) ─────────────────────
echo ""
echo "[2/3] Training anomaly detection model..."
python ml/predictive_maintenance/model_trainer.py \
    --model-type anomaly_detector \
    --input data/seeds/maintenance_logs.json \
    --output ml/predictive_maintenance/models/anomaly_if_model.pkl

echo "✅ Anomaly detection model trained."

# ── Step 3: Train spaCy NER model (Equipment tagging) ─────────────────────────────
echo ""
echo "[3/3] Training spaCy NER model for equipment extraction..."
echo "  (Using pre-trained model + rule-based patterns — no custom training needed for demo)"
echo "✅ NER model ready (rule-based)."

# ── Summary ───────────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ML model training complete."
echo ""
echo "Trained models:"
echo "  - ml/predictive_maintenance/models/failure_rf_model.pkl"
echo "  - ml/predictive_maintenance/models/anomaly_if_model.pkl"
echo ""
echo "Models are ready for inference by Agent 3 (Maintenance)."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
