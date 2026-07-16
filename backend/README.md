# Backend & RAG — Member 1

You own the FastAPI service, the RAG pipeline, and the Neo4j knowledge
graph writer/reader. You are the integration point between ML (Member 2)
and Frontend (Member 3) — ship the endpoints in `docs/api-contracts.md`
first, even as stubs, so the other two aren't blocked.

## Structure
- `app/main.py` — FastAPI app entrypoint
- `app/api/routes/` — HTTP endpoints (ingest, query, knowledge_graph)
- `app/rag/` — embeddings, retriever, LLM chain (LangChain)
- `app/graph/` — Neo4j client + entity linking
- `app/core/config.py` — env-driven config
- `app/models/schemas.py` — shared Pydantic models

## Run locally
```bash
pip install -r requirements.txt --break-system-packages
uvicorn app.main:app --reload
# docs at http://localhost:8000/docs
```
