"""
Lessons Learned API routes.
Owner: Member 1 — Backend & RAG Lead
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from backend.api.middleware.auth import get_current_user, User
from backend.agents.agent5_lessons.lessons_agent import LessonsAgent

router = APIRouter()
_agent: LessonsAgent | None = None


def get_agent() -> LessonsAgent:
    global _agent
    if _agent is None:
        _agent = LessonsAgent()
    return _agent


class WarningRequest(BaseModel):
    equipment_tag: str
    failure_mode: str = ""


# ---------------------------------------------------------------------------
@router.post("/warnings", summary="Get lessons learned warnings for equipment")
async def get_warnings(
    request: WarningRequest,
    current_user: User | None = Depends(get_current_user),
):
    """Check for recurring failure patterns and surface lessons learned."""
    agent = get_agent()
    return agent.get_warnings(request.equipment_tag, request.failure_mode)


@router.get("/patterns", summary="Plant-wide failure patterns")
async def get_system_patterns():
    """Get plant-wide recurring failure pattern summary."""
    agent = get_agent()
    return agent.get_systemwide_patterns()


@router.get("/incidents", summary="List all incidents in knowledge base")
async def list_incidents():
    """Return all loaded incident records."""
    import json
    from pathlib import Path
    path = Path("data/seeds/incidents.json")
    if not path.exists():
        return []
    with open(path) as f:
        return json.load(f)
