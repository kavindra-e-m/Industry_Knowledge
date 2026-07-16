from fastapi import APIRouter`r`nrouter = APIRouter()`r`n@router.get("/{id}")`r`ndef get_graph(id: str):`r`n    return {"id": id, "graph": []}
