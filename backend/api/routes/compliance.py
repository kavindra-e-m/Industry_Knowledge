from fastapi import APIRouter`r`nrouter = APIRouter()`r`n@router.get("/")`r`ndef compliance_report():`r`n    return {"status":"ok","report":{}}
