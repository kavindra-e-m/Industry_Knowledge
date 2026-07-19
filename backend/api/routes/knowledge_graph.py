"""
Knowledge Graph API routes.
Owner: Member 1 — Backend & RAG Lead
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from backend.api.middleware.auth import get_current_user, User
from backend.database.neo4j_client import Neo4jClient

router = APIRouter()


def get_neo4j() -> Neo4jClient:
    return Neo4jClient()


# ---------------------------------------------------------------------------
@router.get("/equipment/{equipment_id}", summary="Get equipment with full history")
async def get_equipment(
    equipment_id: str,
    current_user: User | None = Depends(get_current_user),
):
    """
    Get equipment node with all related documents, incidents, work orders, and regulations.
    """
    neo4j = get_neo4j()
    result = neo4j.get_equipment_full_history(equipment_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"Equipment not found: {equipment_id}")
    return result


@router.get("/equipment", summary="List all equipment in graph")
async def list_equipment():
    """Return all equipment nodes in the knowledge graph."""
    neo4j = get_neo4j()
    rows = neo4j.get_all_equipment()
    equipment = []
    for row in rows:
        e = row.get("e") or row
        if isinstance(e, dict):
            equipment.append(e)
    return {"total": len(equipment), "equipment": equipment}


@router.get("/search/{name_fragment}", summary="Search equipment by name")
async def search_equipment(name_fragment: str):
    """Full-text search on equipment name."""
    neo4j = get_neo4j()
    results = neo4j.search_equipment_by_name(name_fragment)
    equipment = [row.get("e", row) for row in results]
    return {"results": equipment}


@router.get("/stats", summary="Knowledge graph statistics")
async def get_graph_stats():
    """Return node and relationship counts in the knowledge graph."""
    neo4j = get_neo4j()
    return neo4j.get_graph_stats()


@router.post("/seed", summary="Seed equipment master from CSV (admin)")
async def seed_equipment(current_user: User | None = Depends(get_current_user)):
    """Seed the knowledge graph from equipment_master.csv."""
    from backend.knowledge_graph.graph_builder import GraphBuilder
    builder = GraphBuilder()
    count = builder.seed_from_equipment_master()
    builder.seed_default_process_flow()
    return {"seeded": count, "message": f"Seeded {count} equipment nodes and process flow relationships"}


@router.put("/equipment/{equipment_id}/health", summary="Update equipment health score")
async def update_health(
    equipment_id: str,
    health_score: float,
    failure_probability: float,
):
    """Update ML-predicted health score and failure probability for an equipment node."""
    neo4j = get_neo4j()
    neo4j.update_equipment_health(equipment_id, health_score, failure_probability)
    return {"equipment_id": equipment_id, "health_score": health_score, "failure_probability": failure_probability}
