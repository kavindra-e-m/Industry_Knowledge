#!/usr/bin/env bash
# run_ingestion.sh
# Trigger full document ingestion pipeline
# Owner: Member 4 — Data & DevOps Lead

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  IndustrialBrain PS08 — Document Ingestion Pipeline"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Step 1: Verify ChromaDB is ready ─────────────────────────────────────────────
echo ""
echo "[1/4] Verifying ChromaDB availability..."
until curl -s http://localhost:8000/api/v1/heartbeat > /dev/null 2>&1; do
    echo "  ChromaDB not ready yet... retrying in 2s"
    sleep 2
done
echo "✅ ChromaDB is ready."

# ── Step 2: Ingest synthetic procedure documents ─────────────────────────────────
echo ""
echo "[2/4] Ingesting synthetic compliance procedures..."
python backend/api/routes/ingest.py \
    --doc-type procedure \
    --source-dir data/sample_documents/procedures \
    --batch-size 10

echo "✅ Procedure documents ingested."

# ── Step 3: Ingest sample manuals (if any exist) ─────────────────────────────────
echo ""
echo "[3/4] Ingesting sample manuals..."
if [ -d "data/sample_documents/manuals" ] && [ "$(ls -A data/sample_documents/manuals)" ]; then
    python backend/api/routes/ingest.py \
        --doc-type manual \
        --source-dir data/sample_documents/manuals \
        --batch-size 5
    echo "✅ Manual documents ingested."
else
    echo "⚠️  No manuals found in data/sample_documents/manuals — skipping."
fi

# ── Step 4: Ingest maintenance logs as structured documents ──────────────────────
echo ""
echo "[4/4] Ingesting maintenance logs as searchable text..."
python -c "
import json
from backend.rag.embeddings import get_embedding_function
from backend.database.chromadb_client import get_chroma_client

with open('data/seeds/maintenance_logs.json') as f:
    logs = json.load(f)

client = get_chroma_client()
collection = client.get_collection('industrial_documents')
embed_fn = get_embedding_function()

ids, docs, metadatas = [], [], []
for log in logs[:200]:  # First 200 logs
    doc_text = f\"\"\"
Maintenance Log: {log['log_id']}
Equipment: {log['equipment_id']}
Date: {log['maintenance_date']}
Type: {log['maintenance_type']}
Failure Mode: {log.get('failure_mode', 'None')}
Technician: {log['technician']}
Observations: {log['observations']}
    \"\"\".strip()
    
    ids.append(log['log_id'])
    docs.append(doc_text)
    metadatas.append({
        'doc_id': log['log_id'],
        'doc_type': 'maintenance_log',
        'equipment_id': log['equipment_id'],
        'date': log['maintenance_date'],
    })

collection.add(ids=ids, documents=docs, metadatas=metadatas)
print(f'[ingestion] Loaded {len(ids)} maintenance log documents into ChromaDB')
"

echo "✅ Maintenance logs ingested."

# ── Summary ───────────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Document ingestion complete."
echo ""
echo "ChromaDB now contains:"
echo "  - Compliance procedure documents"
echo "  - OEM manuals (if available)"
echo "  - Maintenance log summaries"
echo ""
echo "Ready for RAG queries via Agent 2 (Copilot)."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
