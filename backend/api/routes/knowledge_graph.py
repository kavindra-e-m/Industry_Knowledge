"""
Knowledge graph query/visualisation endpoints (Neo4j).
Owner: Member 1
"""
from fastapi import APIRouter

router = APIRouter()


@router.get("/equipment/{equipment_id}")
def get_equipment_history(equipment_id: str):
    # TODO: query Neo4j for full history of this equipment node
    return {"equipment_id": equipment_id, "history": []}
