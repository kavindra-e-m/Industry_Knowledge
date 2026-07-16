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
cd frontend
npm install
cd ..

echo "Downloading SKAB dataset..."
python -m kagglehub.dataset_download "yuriykatser/skoltech-anomaly-benchmark-skab"

echo "Done. Start the backend, then run the real-time SKAB streamer with:"
echo "  python devops/scripts/stream_skab.py --backend-url http://localhost:8080/api/stream/event --delay 1.0"
