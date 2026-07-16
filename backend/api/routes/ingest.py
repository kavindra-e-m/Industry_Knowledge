"""
Document ingestion endpoint. Accepts PDFs, scanned forms, P&ID
drawings, Excel files and hands them to the ML pipeline (see /ml)
for OCR + entity extraction, then stores results in the vector DB
and knowledge graph.
Owner: Member 1 (API) + Member 2 (ML processing)
"""
from fastapi import APIRouter, UploadFile

router = APIRouter()


@router.post("/document")
async def ingest_document(file: UploadFile):
    # TODO: save file, call ml pipeline, push entities to graph + vector db
    return {"filename": file.filename, "status": "queued"}
