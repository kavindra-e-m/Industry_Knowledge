from fastapi import APIRouter`r`nrouter = APIRouter()`r`n@router.get("/")`r`ndef lessons_warnings():`r`n    return {"status":"ok","warnings":[]}
