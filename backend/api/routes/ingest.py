"""
Document ingestion API route — full implementation.
Owner: Member 1 — Backend & RAG Lead
"""
import shutil
import tempfile
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from loguru import logger

from backend.api.middleware.auth import get_current_user, User
from backend.agents.agent1_knowledge.knowledge_agent import KnowledgeAgent

router = APIRouter()

# Lazy-load agent (heavy init deferred to first request)
_agent: KnowledgeAgent | None = None


def get_agent() -> KnowledgeAgent:
    global _agent
    if _agent is None:
        _agent = KnowledgeAgent()
    return _agent


class IngestResponse(BaseModel):
    document_id: str
    filename: str
    file_type: str
    document_subtype: str
    chunk_count: int
    equipment_tags: list
    regulation_refs: list
    word_count: int
    summary: str
    status: str


class StreamEventRequest(BaseModel):
    event_type: str
    equipment_tag: str | None = None
    payload: dict = {}


# ---------------------------------------------------------------------------
@router.post("/document", response_model=IngestResponse, summary="Ingest a document")
async def ingest_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User | None = Depends(get_current_user),
):
    """
    Upload and ingest a document into the knowledge base.

    Supported formats: PDF, PNG, JPG, TIFF, XLSX, CSV, DOCX, EML, MSG
    """
    # Validate file type
    allowed_extensions = {
        ".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".tif",
        ".xlsx", ".xls", ".csv", ".docx", ".eml", ".msg",
    }
    suffix = Path(file.filename).suffix.lower()
    if suffix not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {suffix}. Allowed: {', '.join(allowed_extensions)}",
        )

    # Read file content
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Empty file uploaded")

    file_size_mb = len(content) / (1024 * 1024)
    if file_size_mb > 50:
        raise HTTPException(status_code=413, detail=f"File too large ({file_size_mb:.1f}MB). Max 50MB.")

    logger.info(f"Ingesting: {file.filename} ({file_size_mb:.2f}MB) — user: {getattr(current_user, 'username', 'anonymous')}")

    try:
        agent = get_agent()
        result = agent.ingest_bytes(content, file.filename)
        return IngestResponse(**result)
    except Exception as e:
        logger.error(f"Ingestion failed for {file.filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")


@router.post("/directory", summary="Ingest all documents in a directory (admin)")
async def ingest_directory(
    directory_path: str,
    current_user: User | None = Depends(get_current_user),
):
    """Ingest all supported documents from a server-side directory path."""
    path = Path(directory_path)
    if not path.is_dir():
        raise HTTPException(status_code=400, detail=f"Directory not found: {directory_path}")

    from ml.document_processing.ingestion_pipeline import IngestionPipeline
    pipeline = IngestionPipeline()
    results = pipeline.ingest_directory(directory_path)

    agent = get_agent()
    for result in results:
        try:
            meta = {
                "document_id": result["document_id"],
                "filename": result["filename"],
                "file_type": result["file_type"],
                "document_subtype": result.get("metadata", {}).get("document_subtype", "general"),
                "equipment_tags": str(result.get("equipment_tags", [])),
            }
            agent.chroma.add_chunks(result["chunks"], result["document_id"], meta)
            agent.graph.process_ingestion_result(result)
        except Exception as e:
            logger.error(f"Failed to store {result['filename']}: {e}")

    return {
        "total_processed": len(results),
        "files": [{"filename": r["filename"], "chunks": r["chunk_count"], "status": "processed"} for r in results],
    }


@router.post("/stream-event", summary="Ingest a real-time stream event")
async def ingest_stream_event(payload: StreamEventRequest):
    """Accept a real-time sensor event or alert from the SKAB stream."""
    from backend.api.routes.stream import manager
    await manager.broadcast({
        "type": "stream_event",
        "event_type": payload.event_type,
        "equipment_tag": payload.equipment_tag,
        "payload": payload.payload,
    })
    return {"status": "received", "event_type": payload.event_type}


@router.get("/stats", summary="Knowledge base statistics")
async def get_stats():
    """Return document count and knowledge graph statistics."""
    agent = get_agent()
    chroma_stats = agent.chroma.get_collection_stats()
    graph_stats = agent.graph.get_graph_stats()
    return {"chroma": chroma_stats, "graph": graph_stats}
