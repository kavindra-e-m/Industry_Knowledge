#!/usr/bin/env bash
# One-shot setup for a fresh machine. Owner: Member 4
set -e

echo "Starting shared infra (Postgres, Neo4j, ChromaDB)..."
docker compose up -d postgres neo4j chromadb

echo "Installing backend deps..."
(cd backend && pip install -r requirements.txt --break-system-packages)

echo "Installing ML deps..."
(cd ml && pip install -r requirements.txt --break-system-packages)

echo "Installing frontend deps..."
(cd frontend/web-dashboard && npm install)

echo "Generating synthetic demo data..."
python data-infra/synthetic-data/generate_documents.py

echo "Done. Run 'uvicorn app.main:app --reload' in backend/, and 'npm run dev' in frontend/web-dashboard/."
