"""
Maintenance API routes — failure prediction, anomaly detection, RCA.
Owner: Member 1 — Backend & RAG Lead
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from loguru import logger

from backend.api.middleware.auth import get_current_user, User
from backend.agents.agent3_maintenance.maintenance_agent import MaintenanceAgent

router = APIRouter()
_agent: MaintenanceAgent | None = None


def get_agent() -> MaintenanceAgent:
    global _agent
    if _agent is None:
        _agent = MaintenanceAgent()
    return _agent


class PredictRequest(BaseModel):
    equipment_tag: str
    air_temperature_k: float = 298.1
    process_temperature_k: float = 308.6
    rotational_speed_rpm: float = 1500.0
    torque_nm: float = 40.0
    tool_wear_min: float = 0.0
    days_since_maintenance: int = 30
    overdue_days: int = 0
    emergency_count_6m: int = 0
    corrective_ratio: float = 0.0
    reported_failure_mode: str = ""


class AnomalyRequest(BaseModel):
    equipment_tag: str
    sensor_readings: dict = Field(default_factory=dict)


class RCARequest(BaseModel):
    equipment_tag: str
    failure_mode: str


# ---------------------------------------------------------------------------
@router.post("/predict", summary="Predict equipment failure probability")
async def predict_failure(
    request: PredictRequest,
    current_user: User | None = Depends(get_current_user),
):
    """
    Run failure prediction for equipment using Random Forest model.
    Returns risk level, probability, predicted days to failure, and action.
    """
    features = request.model_dump()
    tag = features.pop("equipment_tag")
    agent = get_agent()
    return agent.predict_failure(tag, features)


@router.post("/anomaly", summary="Detect sensor anomalies")
async def detect_anomaly(request: AnomalyRequest):
    """
    Run Isolation Forest anomaly detection on sensor readings.
    Provide sensor names and values from your process historian.
    """
    agent = get_agent()
    return agent.detect_anomaly(request.equipment_tag, request.sensor_readings)


@router.post("/rca", summary="Root cause analysis")
async def run_rca(request: RCARequest):
    """
    Analyse root cause for a given equipment + failure mode.
    Uses historical work orders and incidents.
    """
    from ml.rca.rca_engine import RCAEngine
    rca = RCAEngine()
    return rca.analyse(request.equipment_tag, request.failure_mode)


@router.get("/history/{equipment_tag}", summary="Get equipment failure history")
async def get_failure_history(equipment_tag: str):
    """Get full maintenance and incident history for an equipment tag."""
    from ml.rca.rca_engine import RCAEngine
    rca = RCAEngine()
    return rca.get_equipment_failure_history(equipment_tag)


@router.get("/overdue", summary="Get overdue preventive maintenance")
async def get_overdue_pm():
    """List all equipment with overdue preventive maintenance."""
    from backend.database.postgres_client import PostgresClient
    pg = PostgresClient()
    try:
        return pg.get_overdue_preventive_maintenance()
    except Exception:
        # Return from CSV if DB not yet set up
        import csv
        from pathlib import Path
        from datetime import date
        path = Path("data/seeds/equipment_master.csv")
        if not path.exists():
            return []
        overdue = []
        with open(path) as f:
            for row in csv.DictReader(f):
                pm_due = row.get("next_pm_due", "")
                if pm_due:
                    try:
                        due_date = date.fromisoformat(pm_due)
                        if due_date < date.today():
                            overdue.append({
                                "tag_id": row["equipment_id"],
                                "name": row["name"],
                                "equipment_type": row["equipment_type"],
                                "next_pm_due": pm_due,
                                "criticality": row.get("criticality", ""),
                                "location": row.get("location", ""),
                            })
                    except ValueError:
                        pass
        return overdue
