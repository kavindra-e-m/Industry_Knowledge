"""
PS08 - Industrial Knowledge Intelligence
Backend entrypoint (FastAPI)

Owner: Member 1 - Backend & RAG Lead
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import ingest, query, knowledge_graph, stream

app = FastAPI(
    title="PS08 Industrial Knowledge Intelligence API",
    description="RAG + Knowledge Graph platform for industrial document intelligence",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten before demo
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest.router, prefix="/api/ingest", tags=["ingestion"])
app.include_router(query.router, prefix="/api/query", tags=["query"])
app.include_router(knowledge_graph.router, prefix="/api/graph", tags=["knowledge-graph"])
app.include_router(stream.router, prefix="/api/stream", tags=["stream"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "ps08-backend"}
