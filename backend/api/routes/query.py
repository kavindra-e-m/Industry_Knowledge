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


# ---------------------------------------------------------------------------
import json as json_module
from fastapi.responses import StreamingResponse


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    equipment_tag: str | None = None
    user_role: str = "technician"


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    import google.generativeai as genai
    from backend.config.settings import settings
    from backend.database.chromadb_client import ChromaDBClient
    from backend.database.neo4j_client import Neo4jClient

    chroma = ChromaDBClient()
    neo4j_client = Neo4jClient()

    async def generate():
        try:
            last_message = request.messages[-1].content if request.messages else ""
            try:
                chunks = chroma.search(last_message, n_results=4)
            except Exception:
                chunks = []
            context = (
                "\n\n---\n\n".join(
                    [f"[Source: {c['metadata'].get('filename','Knowledge Base')}]\n{c['text']}" for c in chunks]
                )
                if chunks
                else ""
            )
            equipment_context = ""
            if request.equipment_tag:
                try:
                    history = neo4j_client.get_equipment_full_history(request.equipment_tag)
                    if history:
                        e = history.get("e", {})
                        equipment_context = (
                            f"\nEQUIPMENT CONTEXT:\n"
                            f"Tag: {e.get('tag_id','N/A')}\n"
                            f"Health Score: {e.get('health_score','N/A')}\n"
                            f"Failure Probability: {e.get('failure_probability','N/A')}\n"
                        )
                except Exception:
                    pass
            system_prompt = f"""You are IndustrialBrain — expert AI knowledge copilot for plant operations.

You have access to equipment manuals, maintenance records, safety procedures, incident reports, and Indian regulatory standards (OISD, Factory Act, PESO).

KNOWLEDGE BASE CONTEXT: {context if context else "No specific documents found. Answer from general industrial engineering knowledge."} {equipment_context}

RULES:
- Always cite your sources when referencing documents
- Include safety precautions when discussing maintenance work
- Be specific — use equipment tag IDs, part numbers, procedure steps
- Remember everything said earlier in this conversation
- Build on previous answers — connect follow-ups to earlier context
- Be conversational and practical — field technicians are busy
- If you do not know something, say so clearly
- Format responses with clear sections when helpful"""

            sources = (
                [
                    {
                        "filename": c["metadata"].get("filename", "Knowledge Base"),
                        "relevance": c.get("relevance_score", 0.8),
                        "preview": c["text"][:150] + "...",
                    }
                    for c in chunks
                ]
                if chunks
                else []
            )

            try:
                from backend.rag.llm_chain import get_llm
                from langchain.schema import HumanMessage, SystemMessage, AIMessage

                llm = get_llm()
                messages = [SystemMessage(content=system_prompt)]
                for msg in request.messages[:-1]:
                    if msg.role == "user":
                        messages.append(HumanMessage(content=msg.content))
                    else:
                        messages.append(AIMessage(content=msg.content))
                messages.append(HumanMessage(content=last_message))

                for chunk in llm.stream(messages):
                    if hasattr(chunk, "content") and chunk.content:
                        yield f"data: {json_module.dumps({'token': chunk.content, 'done': False})}\n\n"
                yield f"data: {json_module.dumps({'token': '', 'done': True, 'sources': sources})}\n\n"
                return
            except Exception as llm_err:
                logger.warning(f"LLM API limit or error encountered ({llm_err}). Falling back to Local RAG Synthesis Mode.")

            # ---- Local RAG Fallback Synthesis ----
            fallback_tokens = []
            fallback_tokens.append(f"### Industrial Knowledge Assistant (Local RAG Mode)\n\n")
            if context:
                fallback_tokens.append(f"**Retrieved Knowledge Base Context:**\n{context}\n\n")
            if equipment_context:
                fallback_tokens.append(f"**Equipment Context:**\n{equipment_context}\n\n")
            
            fallback_tokens.append(f"**Recommendations:**\n")
            fallback_tokens.append(f"- Perform standard visual & vibration inspections according to plant SOPs.\n")
            fallback_tokens.append(f"- Verify all safety interlocks and pressure relief settings before executing work orders.\n")
            fallback_tokens.append(f"- Refer to uploaded OISD/Factory Act documentation for compliance guidelines.\n")
            
            full_text = "".join(fallback_tokens)
            words = full_text.split(" ")
            for i, word in enumerate(words):
                space = " " if i < len(words) - 1 else ""
                yield f"data: {json_module.dumps({'token': word + space, 'done': False})}\n\n"
            
            yield f"data: {json_module.dumps({'token': '', 'done': True, 'sources': sources})}\n\n"
        except Exception as e:
            logger.error(f"Streaming error: {e}")
            yield f"data: {json_module.dumps({'error': str(e), 'done': True})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
        },
    )

