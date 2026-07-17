"""
P&ID API routes — impact analysis and drawing upload.
Owner: Member 1 — Backend & RAG Lead
"""
import tempfile
import os
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from pydantic import BaseModel

from backend.api.middleware.auth import get_current_user, User
from backend.agents.agent6_pid.pid_agent import PIDAgent

router = APIRouter()
_agent: PIDAgent | None = None


def get_agent() -> PIDAgent:
    global _agent
    if _agent is None:
        _agent = PIDAgent()
    return _agent


class ImpactRequest(BaseModel):
    equipment_tag: str
    failure_mode: str = ""


# ---------------------------------------------------------------------------
@router.post("/impact", summary="Analyse failure impact from knowledge graph")
async def analyse_impact(
    request: ImpactRequest,
    current_user: User | None = Depends(get_current_user),
):
    """
    Analyse downstream impact of equipment failure using the process flow graph.
    Returns affected equipment, isolation valves, and LLM-generated isolation procedure.
    """
    agent = get_agent()
    return agent.analyse_equipment_impact(request.equipment_tag)


@router.post("/analyse-drawing", summary="Upload a P&ID drawing and detect symbols")
async def analyse_drawing(
    file: UploadFile = File(...),
    failed_equipment: str | None = None,
):
    """
    Upload a P&ID drawing (PNG, JPG, PDF) and detect equipment symbols using YOLOv8-nano.
    Optionally provide a failed equipment tag for impact analysis.
    """
    allowed = {".png", ".jpg", ".jpeg", ".tiff", ".pdf"}
    suffix = Path(file.filename).suffix.lower()
    if suffix not in allowed:
        raise HTTPException(status_code=400, detail=f"Unsupported image type: {suffix}")

    content = await file.read()
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        agent = get_agent()
        if suffix == ".pdf":
            result = agent.classifier.detect_from_pdf_page(tmp_path)
            return {
                "filename": file.filename,
                "symbols_detected": len(result),
                "detections": result,
                "agent": "pid",
            }
        else:
            return agent.analyse_drawing(tmp_path, failed_equipment)
    finally:
        os.unlink(tmp_path)


@router.get("/connections/{equipment_tag}", summary="Get downstream connections")
async def get_connections(equipment_tag: str, max_hops: int = 5):
    """Get all equipment downstream of the given tag in the process flow."""
    from backend.database.neo4j_client import Neo4jClient
    neo4j = Neo4jClient()
    connections = neo4j.get_equipment_connections(equipment_tag, max_hops)
    return {
        "equipment_tag": equipment_tag,
        "downstream_count": len(connections),
        "downstream": connections,
    }
