from fastapi import APIRouter`r`nrouter = APIRouter()`r`n@router.post("/analyse")`r`ndef analyse_pid():`r`n    return {"status":"queued"}
