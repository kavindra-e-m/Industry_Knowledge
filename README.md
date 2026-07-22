# PS08 — Industrial Knowledge Intelligence

**One-liner:** Give it every scattered document a plant has ever produced —
manuals, scanned forms, P&ID drawings, spreadsheets, email threads — and it
becomes a queryable, mobile-first "brain" that answers any question in
seconds, predicts failures before they happen, and never retires.

## The problem

- Industrial workers lose ~35% of their working day hunting for information
  spread across 7–12 disconnected systems (SharePoint, SAP, email, printed
  binders, shared drives).
- That fragmentation contributes to 18–22% of unplanned downtime in Indian
  heavy industry — machines fail not because nobody knew the fix, but
  because nobody could find it fast enough.
- 25% of India's experienced industrial engineers retire within the decade,
  taking undocumented "tribal knowledge" with them permanently.

## What we're building

A RAG + Knowledge Graph platform with five working parts:

1. **Universal ingestion** — OCR + document AI turns PDFs, scans, P&ID
   drawings, Excel sheets and emails into structured, linked knowledge.
2. **Conversational Q&A** — a mobile-first chat interface, backed by RAG,
   that answers plain-English questions with cited sources in seconds.
3. **Predictive maintenance / RCA agent** — correlates equipment history to
   flag failures before they happen and auto-generate root-cause reports.
4. **Compliance checker** — cross-references procedures against OISD /
   Factory Act / PESO requirements and flags gaps before an audit does.
5. **Lessons-learned engine** — mines years of incident reports for patterns
   no single human would connect.

See `docs/architecture.md` for the full data flow.

## Team & folder ownership

| Member | Role | Owns |
|---|---|---|
| 1 | Backend & RAG Lead | `backend/` |
| 2 | ML & Document Intelligence Lead | `ml/` |
| 3 | Frontend & Dashboard Lead | `frontend/` |
| 4 | Data & DevOps Lead | `data/ + devops/` |

Everyone reads/writes `docs/` — that's the shared contract layer.

## Getting started

```bash
git clone <your-repo-url>
cd ps08-industrial-knowledge-intelligence

# spin up shared infra (Postgres, Neo4j, ChromaDB)
docker compose up -d postgres neo4j chromadb

# backend (Member 1)
cd backend && pip install -r requirements.txt --break-system-packages
uvicorn backend.main:app --reload --port 8000

# ml (Member 2)
cd ml && pip install -r requirements.txt --break-system-packages

# frontend (Member 3)
cd frontend && npm install && npm run dev

# data / SKAB dataset stream (Member 4)
python devops/scripts/stream_skab.py --backend-url http://localhost:8000/api/stream/event --delay 1.0
```

## Git workflow

- `main` — always demo-ready, protected.
- `dev` — integration branch, everyone merges here first.
- Feature branches per folder: `feature/backend-rag`, `feature/ml-ocr`,
  `feature/frontend-dashboard`, `feature/data-devops`.
- Agree on `docs/api-contracts.md` before writing code — it lets all teams
  build in parallel without blocking.
- Merge to `dev` at least once every few hours; merge `dev` → `main` before
  every judging checkpoint.

