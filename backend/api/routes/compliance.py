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


# ---------------------------------------------------------------------------
import io
import json
import zipfile
from datetime import datetime
from fastapi.responses import StreamingResponse


@router.post("/audit-package")
@router.post("/compliance/audit-package")
async def generate_audit_package():
    try:
        import csv as csv_module
        with open("data/seeds/equipment_master.csv") as f:
            equipment = list(csv_module.DictReader(f))
        try:
            with open("data/seeds/work_orders.json") as f:
                work_orders = json.load(f)
        except FileNotFoundError:
            work_orders = []
        agent = get_agent()
        report = agent.generate_plant_compliance_report(equipment[:30], work_orders)
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr(f"compliance_report_{datetime.now().strftime('%Y%m%d')}.json", json.dumps(report, indent=2, default=str))
            gap_lines = ["equipment_tag,regulation_source,requirement,severity,overdue_days"]
            for gap in report.get("all_gaps", []):
                gap_lines.append(f"{gap.get('equipment_tag','')},{gap.get('regulation_source','')},"
                                f"{gap.get('requirement','')},{gap.get('severity','')},"
                                f"{gap.get('overdue_days','N/A')}")
            zf.writestr(f"gap_summary_{datetime.now().strftime('%Y%m%d')}.csv", "\n".join(gap_lines))
            zf.writestr("executive_summary.txt", report.get("executive_summary", ""))
        zip_buffer.seek(0)
        filename = f"audit_package_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
        return StreamingResponse(zip_buffer, media_type="application/zip", headers={"Content-Disposition": f"attachment; filename={filename}"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/check/{equipment_tag}")
@router.get("/compliance/check/{equipment_tag}")
async def check_equipment_compliance_tag(equipment_tag: str):
    try:
        import csv as csv_module
        with open("data/seeds/equipment_master.csv") as f:
            all_equipment = list(csv_module.DictReader(f))
        equipment = next((e for e in all_equipment if e["tag_id"] == equipment_tag), None)
        if not equipment:
            raise HTTPException(status_code=404, detail=f"Equipment {equipment_tag} not found")
        try:
            with open("data/seeds/work_orders.json") as f:
                work_orders = json.load(f)
        except FileNotFoundError:
            work_orders = []
        from ml.compliance.compliance_checker import ComplianceChecker
        result = ComplianceChecker().check_equipment(equipment, work_orders)
        return {"success": True, "data": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

