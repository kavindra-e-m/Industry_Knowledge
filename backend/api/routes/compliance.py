"""
Compliance API routes.
Owner: Member 1 — Backend & RAG Lead
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from loguru import logger

from backend.api.middleware.auth import get_current_user, User
from backend.agents.agent4_compliance.compliance_agent import ComplianceAgent

router = APIRouter()
_agent: ComplianceAgent | None = None


def get_agent() -> ComplianceAgent:
    global _agent
    if _agent is None:
        _agent = ComplianceAgent()
    return _agent


class ComplianceCheckRequest(BaseModel):
    equipment_tag: str


# ---------------------------------------------------------------------------
@router.post("/check", summary="Check equipment compliance")
async def check_equipment_compliance(
    request: ComplianceCheckRequest,
    current_user: User | None = Depends(get_current_user),
):
    """
    Run a full compliance check for an equipment tag against OISD, Factories Act, PESO.
    Returns gap analysis with clause references and corrective actions.
    """
    agent = get_agent()
    return agent.check_equipment(request.equipment_tag)


@router.get("/plant", summary="Plant-wide compliance summary")
async def check_plant_compliance():
    """Run compliance across all equipment and return plant-wide summary."""
    agent = get_agent()
    return agent.check_plant_compliance()


@router.get("/regulations", summary="List all loaded regulations")
async def list_regulations():
    """Return all regulation clauses loaded in the system."""
    from ml.compliance.compliance_checker import ComplianceChecker
    checker = ComplianceChecker()
    return {
        "total": len(checker.regulations),
        "regulations": checker.regulations,
    }
