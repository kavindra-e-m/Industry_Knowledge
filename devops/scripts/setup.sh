#!/usr/bin/env bash
# setup.sh
# One-command full local setup for IndustrialBrain PS08
# Owner: Member 4 — Data & DevOps Lead

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  IndustrialBrain PS08 — Full Stack Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Step 1: Check prerequisites ──────────────────────────────────────────────────
echo ""
echo "[1/7] Checking prerequisites..."

command -v docker >/dev/null 2>&1 || { echo "❌ Docker not found. Install Docker first."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ docker-compose not found. Install docker-compose first."; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "❌ Python 3 not found. Install Python 3.9+ first."; exit 1; }

echo "✅ Prerequisites met: Docker, docker-compose, Python 3"

# ── Step 2: Create Python virtual environment ────────────────────────────────────
echo ""
echo "[2/7] Creating Python virtual environment..."

if [ ! -d ".venv" ]; then
    python3 -m venv .venv
    echo "  → Created .venv/"
fi

source .venv/bin/activate || source .venv/Scripts/activate
pip install --upgrade pip
pip install -r backend/requirements.txt
pip install -r ml/requirements.txt
pip install psycopg2-binary neo4j chromadb

echo "✅ Python environment ready."

# ── Step 3: Start Docker services ────────────────────────────────────────────────
echo ""
echo "[3/7] Starting Docker services..."

docker-compose up -d postgres neo4j chromadb redis

echo "  → Waiting for services to be healthy..."
sleep 10

echo "✅ Docker services started."

# ── Step 4: Initialize databases ─────────────────────────────────────────────────
echo ""
echo "[4/7] Initializing databases..."

echo "  → PostgreSQL schema..."
docker exec -i industrial-brain-postgres psql -U postgres -c "CREATE DATABASE IF NOT EXISTS industrial_knowledge;" || true
docker exec -i industrial-brain-postgres psql -U postgres -d industrial_knowledge < devops/database/init_postgres.sql

echo "  → Neo4j schema..."
docker exec -i industrial-brain-neo4j cypher-shell -u neo4j -p neo4jpassword < devops/database/init_neo4j.cypher

echo "  → ChromaDB collections..."
python devops/database/chroma_setup.py

echo "✅ Databases initialized."

# ── Step 5: Seed databases ───────────────────────────────────────────────────────
echo ""
echo "[5/7] Seeding databases with synthetic data..."

./devops/scripts/seed_db.sh

echo "✅ Databases seeded."

# ── Step 6: Train ML models ──────────────────────────────────────────────────────
echo ""
echo "[6/7] Training ML models..."

./devops/scripts/train_models.sh

echo "✅ ML models trained."

# ── Step 7: Start application services ───────────────────────────────────────────
echo ""
echo "[7/7] Starting backend and frontend..."

docker-compose up -d backend frontend

echo "✅ Application services started."

# ── Summary ───────────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup complete!"
echo ""
echo "Services running:"
echo "  Backend API:      http://localhost:8000"
echo "  Frontend UI:      http://localhost:3000"
echo "  PostgreSQL:       localhost:5432"
echo "  Neo4j Browser:    http://localhost:7474"
echo "  ChromaDB:         http://localhost:8000"
echo ""
echo "Demo login:"
echo "  Username: admin"
echo "  Password: demo123"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
