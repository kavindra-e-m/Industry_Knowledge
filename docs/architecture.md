# Architecture — data flow end to end

1. **Ingest** — a document (PDF manual, scanned form, P&ID drawing, Excel
   sheet, email export) enters via `backend/app/api/routes/ingest.py`.
2. **Understand** — `ml/ocr` extracts text from PDFs/scans; `ml/pid_parser`
   uses computer vision to read engineering drawings and extract equipment
   symbols + connections.
3. **Extract entities** — NER pulls out equipment tags, dates, people,
   regulatory references. Entity resolution links different mentions of the
   same asset ("Pump P-201" = "the feed pump on line 3").
4. **Build the graph** — `backend/app/graph` writes nodes (Equipment,
   Document, Person, Incident, Regulation) and relationships
   (MAINTAINED_BY, DESCRIBED_IN, CAUSED_BY, ...) into Neo4j.
5. **Index for retrieval** — document chunks are embedded and stored in
   ChromaDB (`backend/app/rag/embeddings.py`), linked back to graph nodes.
6. **Answer questions** — a query hits `backend/app/api/routes/query.py`,
   which retrieves relevant chunks + graph context
   (`backend/app/rag/retriever.py`) and asks the LLM to answer with
   citations (`backend/app/rag/llm_chain.py`).
7. **Specialist agents sit on top of the same graph:**
   - `ml/predictive_maintenance` — flags equipment health trends.
   - `ml/rca_engine` — root-cause analysis on failures.
   - `ml/lessons_learned` — pattern-mines incident history.
   - Compliance checks cross-reference regulation nodes in the graph.
8. **Surface it** — `frontend/web-dashboard` (managers/safety officers) and
   `frontend/mobile-chat` (field technicians) both call the backend API.

Data source -> Ingestion -> Entity extraction -> Knowledge graph + Vector
index -> RAG / agents -> Web dashboard + Mobile chat.
