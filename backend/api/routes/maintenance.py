from fastapi import APIRouter`r`nrouter = APIRouter()`r`n@router.get("/")`r`ndef maintenance_alerts():`r`n    return {"status":"ok","alerts":[]}
