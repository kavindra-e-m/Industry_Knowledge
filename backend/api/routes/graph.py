from fastapi import APIRouter

router = APIRouter()

@router.get("/{id}")
def get_graph(id: str):
    return {"id": id, "graph": []}


@router.get("/connections/{tag_id}")
@router.get("/graph/connections/{tag_id}")
async def get_equipment_connections(tag_id: str):
    try:
        from backend.database.neo4j_client import Neo4jClient
        neo4j = Neo4jClient()
        connections = neo4j.get_equipment_connections(tag_id)
        return {"success": True, "tag_id": tag_id, "connections": connections, "connection_count": len(connections)}
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))


