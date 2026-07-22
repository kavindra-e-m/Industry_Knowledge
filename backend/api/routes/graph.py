from fastapi import APIRouter

router = APIRouter()

@router.get("/{id}")
def get_graph(id: str):
    return {"id": id, "graph": []}

