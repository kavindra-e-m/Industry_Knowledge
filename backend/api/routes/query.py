"""
Query API route — RAG-powered Q&A with agent routing.
Owner: Member 1 — Backend & RAG Lead
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from loguru import logger

from backend.api.middleware.auth import get_current_user, User
from backend.orchestrator.agent_router import AgentRouter

router = APIRouter()
_router: AgentRouter | None = None


def get_router() -> AgentRouter:
    global _router
    if _router is None:
        _router = AgentRouter()
    return _router


class QueryRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=2000)
    equipment_id: str | None = Field(None, description="Optional equipment tag to scope the query")
    metadata: dict = Field(default_factory=dict)


class QueryResponse(BaseModel):
    answer: str
    sources: list
    routed_to_agent: str
    equipment_tag: str | None = None
    chunks_retrieved: int = 0


class DirectRAGRequest(BaseModel):
    question: str = Field(..., min_length=3)
    equipment_id: str | None = None
    n_results: int = Field(default=5, ge=1, le=20)


# ---------------------------------------------------------------------------
@router.post("/", response_model=QueryResponse, summary="Ask IndustrialBrain a question")
async def query(
    request: QueryRequest,
    current_user: User | None = Depends(get_current_user),
):
    """
    Route a question to the correct specialist agent.

    The router classifies intent and delegates to:
    - copilot: general equipment Q&A (default)
    - maintenance: failure prediction / RCA
    - compliance: regulation / audit queries
    - lessons: historical pattern / recurring failures
    - pid: P&ID impact analysis

    Optionally scope the query to a specific equipment tag.
    """
    logger.info(f"Query: {request.question[:60]} | Equipment: {request.equipment_id}")
    try:
        router_inst = get_router()
        result = router_inst.route(
            question=request.question,
            equipment_tag=request.equipment_id,
            metadata=request.metadata,
        )
        return QueryResponse(
            answer=result.get("answer") or result.get("report", ""),
            sources=result.get("sources", []),
            routed_to_agent=result.get("routed_to_agent", "copilot"),
            equipment_tag=result.get("equipment_tag"),
            chunks_retrieved=result.get("chunks_retrieved", 0),
        )
    except Exception as e:
        logger.error(f"Query failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/direct", summary="Direct RAG query (bypasses agent routing)")
async def direct_rag_query(request: DirectRAGRequest):
    """Direct ChromaDB + Gemini query without agent routing."""
    from backend.rag.pipeline import RAGPipeline
    rag = RAGPipeline()
    result = rag.query(
        question=request.question,
        equipment_tag=request.equipment_id,
        n_results=request.n_results,
    )
    return result


@router.post("/classify-intent", summary="Classify query intent without executing")
async def classify_intent(request: QueryRequest):
    """Preview which agent would handle this query, without actually running it."""
    router_inst = get_router()
    intent = router_inst.classify_intent(request.question)
    return {"question": request.question, "predicted_agent": intent}
