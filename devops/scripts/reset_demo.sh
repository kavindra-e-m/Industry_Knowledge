#!/usr/bin/env bash
# reset_demo.sh
# Reset all databases to clean demo state (idempotent)
# Owner: Member 4 — Data & DevOps Lead

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  IndustrialBrain PS08 — Demo Reset"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  This will DELETE all data and restore the clean demo scenario."
read -p "Continue? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# ── Step 1: Drop PostgreSQL database ─────────────────────────────────────────────
echo ""
echo "[1/5] Dropping PostgreSQL database..."
docker exec industrial-brain-postgres psql -U postgres -c "DROP DATABASE IF EXISTS industrial_knowledge;" || true
docker exec industrial-brain-postgres psql -U postgres -c "CREATE DATABASE industrial_knowledge;"
echo "  → Recreating schema..."
docker exec -i industrial-brain-postgres psql -U postgres -d industrial_knowledge < devops/database/init_postgres.sql
echo "✅ PostgreSQL reset complete."

# ── Step 2: Clear Neo4j graph ────────────────────────────────────────────────────
echo ""
echo "[2/5] Clearing Neo4j graph..."
docker exec industrial-brain-neo4j cypher-shell -u neo4j -p neo4jpassword "MATCH (n) DETACH DELETE n;" || true
docker exec -i industrial-brain-neo4j cypher-shell -u neo4j -p neo4jpassword < devops/database/init_neo4j.cypher
echo "✅ Neo4j reset complete."

# ── Step 3: Clear ChromaDB collections ───────────────────────────────────────────
echo ""
echo "[3/5] Clearing ChromaDB collections..."
python devops/database/chroma_setup.py
echo "✅ ChromaDB reset complete."

# ── Step 4: Re-seed all databases ────────────────────────────────────────────────
echo ""
echo "[4/5] Re-seeding databases..."
./devops/scripts/seed_db.sh
echo "✅ Databases re-seeded."

# ── Step 5: Re-train ML models ───────────────────────────────────────────────────
echo ""
echo "[5/5] Re-training ML models..."
./devops/scripts/train_models.sh
echo "✅ ML models re-trained."

# ── Summary ───────────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Demo reset complete."
echo ""
echo "All databases restored to clean demo state as per:"
echo "  data/seeds/demo_scenario.json"
echo ""
echo "You can now:"
echo "  1. Start services: docker-compose up"
echo "  2. Access frontend: http://localhost:3000"
echo "  3. Login with: admin / demo123"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
