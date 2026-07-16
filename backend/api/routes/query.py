"""
Natural language Q&A endpoint. Talks to app.rag.retriever +
app.rag.llm_chain to answer questions with cited sources.
Owner: Member 1
"""
from typing import List, Optional
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class QueryRequest(BaseModel):
    question: str
    equipment_id: Optional[str] = None


class QueryResponse(BaseModel):
    answer: str
    sources: List[str]


@router.post("/", response_model=QueryResponse)
def ask_question(request: QueryRequest):
    # TODO: call app.rag.retriever.retrieve() then app.rag.llm_chain.generate()
    return QueryResponse(answer="TODO: wire up RAG pipeline", sources=[])
