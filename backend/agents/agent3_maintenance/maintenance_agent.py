"""
Agent 3 — Maintenance Intelligence Agent.
Combines failure prediction, RCA, and LLM report generation.
Owner: Member 1 — Backend & RAG Lead
"""
import sys
from pathlib import Path
from loguru import logger

from backend.database.neo4j_client import Neo4jClient
from backend.rag.pipeline import RAGPipeline
from backend.rag.llm_chain import call_llm
from backend.rag.prompt_templates import MAINTENANCE_SYSTEM, MAINTENANCE_USER

# Import ML modules (adjust path if running from project root)
sys.path.insert(0, str(Path(__file__).parents[4]))

from ml.predictive_maintenance.failure_predictor import FailurePredictor
from ml.predictive_maintenance.anomaly_detector import AnomalyDetector
from ml.rca.rca_engine import RCAEngine


class MaintenanceAgent:
    """
    Agent 3 — Maintenance Intelligence.

    Capabilities:
    - Predict failure probability for any equipment
    - Detect sensor anomalies
    - Run RCA analysis against historical data
    - Generate structured maintenance reports via Gemini
    """

    def __init__(self):
        self.predictor = FailurePredictor()
        self.anomaly = AnomalyDetector()
        self.rca = RCAEngine()
        self.neo4j = Neo4jClient()
        self.rag = RAGPipeline()
        logger.success("MaintenanceAgent ready")

    # ------------------------------------------------------------------
    def predict_failure(self, equipment_tag: str, features: dict) -> dict:
        """Run failure prediction + RCA and return structured result."""
        prediction = self.predictor.predict(features)
        equipment = self._get_equipment_info(equipment_tag)

        failure_mode = features.get("reported_failure_mode", "")
        rca = {}
        if prediction["risk_level"] in ("critical", "high") or failure_mode:
            rca = self.rca.analyse(equipment_tag, failure_mode or prediction["risk_level"] + " risk")

        # Get context from RAG
        query = f"maintenance procedure for {equipment_tag} {equipment.get('equipment_type', '')}"
        context_chunks = self.rag.chroma.search(query, n_results=3)
        context = "\n\n".join(c["text"] for c in context_chunks)

        # LLM report
        user_prompt = MAINTENANCE_USER.format(
            equipment_tag=equipment_tag,
            equipment_type=equipment.get("equipment_type", "Unknown"),
            location=equipment.get("location", "Unknown"),
            criticality=equipment.get("criticality", "Unknown"),
            prediction_results=str(prediction),
            rca_results=str(rca),
            equipment_history=self._format_history(equipment_tag),
            context=context or "No specific maintenance documents found.",
        )
        report = call_llm(MAINTENANCE_SYSTEM, user_prompt)

        return {
            "agent": "maintenance",
            "equipment_tag": equipment_tag,
            "prediction": prediction,
            "rca": rca,
            "report": report,
            "sources": [{"filename": c["metadata"].get("filename", "Unknown"), "relevance_score": c["relevance_score"]} for c in context_chunks],
        }

    def detect_anomaly(self, equipment_tag: str, sensor_readings: dict) -> dict:
        """Run anomaly detection on sensor readings."""
        result = self.anomaly.detect(sensor_readings)
        result["equipment_tag"] = equipment_tag
        result["agent"] = "maintenance"
        return result

    def process(
        self,
        question: str,
        equipment_tag: str | None = None,
        metadata: dict | None = None,
    ) -> dict:
        """Standard agent interface for router."""
        meta = metadata or {}
        features = meta.get("sensor_features", {})
        if not features:
            features = {
                "days_since_maintenance": meta.get("days_since_maintenance", 30),
                "overdue_days": meta.get("overdue_days", 0),
                "emergency_count_6m": meta.get("emergency_count", 0),
                "corrective_ratio": meta.get("corrective_ratio", 0.0),
            }

        if equipment_tag:
            return self.predict_failure(equipment_tag, features)

        # No equipment tag — general RAG answer about maintenance
        rag_result = self.rag.query(question, n_results=5)
        rag_result["agent"] = "maintenance"
        return rag_result

    # ------------------------------------------------------------------
    def _get_equipment_info(self, tag_id: str) -> dict:
        result = self.neo4j.get_equipment_full_history(tag_id)
        return result.get("e") or {}

    def _format_history(self, tag_id: str) -> str:
        history = self.rca.get_equipment_failure_history(tag_id)
        if not history:
            return "No maintenance history available."
        return (
            f"Total WOs: {history['total_work_orders']} | "
            f"Emergency: {history['emergency_count']} | "
            f"Corrective ratio: {history['corrective_ratio']} | "
            f"Incidents: {history['incident_count']}"
        )
