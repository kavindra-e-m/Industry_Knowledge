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


# ---------------------------------------------------------------------------
_pattern_detector = None


def get_pattern_detector():
    global _pattern_detector
    if _pattern_detector is None:
        from ml.lessons_learned.pattern_detector import PatternDetector
        _pattern_detector = PatternDetector()
    return _pattern_detector


@router.get("/patterns")
@router.get("/lessons/patterns")
async def get_patterns():
    try:
        detector = get_pattern_detector()
        patterns = detector.patterns
        return {
            "success": True,
            "high_frequency_equipment": patterns.get("high_frequency_equipment", []),
            "high_risk_locations": patterns.get("high_risk_locations", []),
            "recurring_failure_types": patterns.get("recurring_failure_types", []),
            "total_incidents_analysed": len(detector.incidents),
        }
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/warnings/{equipment_tag}")
@router.get("/lessons/warnings/{equipment_tag}")
async def get_equipment_warnings(equipment_tag: str):
    try:
        detector = get_pattern_detector()
        warnings = detector.check_for_warnings(equipment_tag)
        pre_work = detector.get_warning_for_new_work_order(equipment_tag, "general")
        return {
            "success": True,
            "equipment_tag": equipment_tag,
            "warnings": warnings,
            "pre_work_lesson": pre_work,
        }
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))

