#!/usr/bin/env bash
# seed_db.sh
# Seed all databases (PostgreSQL, Neo4j, ChromaDB) with synthetic data
# Owner: Member 4 — Data & DevOps Lead

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  IndustrialBrain PS08 — Database Seeding"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Step 1: Generate all synthetic data ──────────────────────────────────────────
echo ""
echo "[1/6] Generating synthetic data..."

echo "  → Equipment master..."
python data/synthetic/generate_equipment_master.py

echo "  → Maintenance logs..."
python data/synthetic/generate_maintenance_logs.py

echo "  → Work orders..."
python data/synthetic/generate_work_orders.py

echo "  → Incidents..."
python data/synthetic/generate_incidents.py

echo "  → Inspection records..."
python data/synthetic/generate_inspection_records.py

echo "  → Compliance documents..."
python data/synthetic/generate_compliance_docs.py

echo "✅ Synthetic data generation complete."

# ── Step 2: Seed PostgreSQL ───────────────────────────────────────────────────────
echo ""
echo "[2/6] Seeding PostgreSQL..."

# Wait for PostgreSQL to be ready
echo "  → Waiting for PostgreSQL..."
until docker exec industrial-brain-postgres pg_isready -U postgres > /dev/null 2>&1; do
    echo "  PostgreSQL not ready yet... retrying in 2s"
    sleep 2
done

echo "  → PostgreSQL ready. Loading users..."
docker exec -i industrial-brain-postgres psql -U postgres -d industrial_knowledge < data/seeds/users.sql

echo "  → Loading equipment master..."
docker exec -i industrial-brain-postgres psql -U postgres -d industrial_knowledge -c "\COPY equipment FROM STDIN WITH CSV HEADER" < data/seeds/equipment_master.csv

echo "  → Loading maintenance logs..."
python -c "
import json, psycopg2
with open('data/seeds/maintenance_logs.json') as f:
    logs = json.load(f)
conn = psycopg2.connect('postgresql://postgres:postgres@localhost:5432/industrial_knowledge')
cur = conn.cursor()
for log in logs:
    cur.execute('''
        INSERT INTO maintenance_logs (log_id, equipment_id, maintenance_date, maintenance_type, failure_mode,
                                       technician, duration_hours, parts_used, cost_inr, status, observations, next_due_date)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (log_id) DO NOTHING
    ''', (log['log_id'], log['equipment_id'], log['maintenance_date'], log['maintenance_type'], log['failure_mode'],
          log['technician'], log['duration_hours'], log['parts_used'], log['cost_inr'], log['status'], log['observations'], log['next_due_date']))
conn.commit()
conn.close()
print('[postgres] Loaded', len(logs), 'maintenance logs')
"

echo "  → Loading work orders..."
python -c "
import json, psycopg2
with open('data/seeds/work_orders.json') as f:
    wos = json.load(f)
conn = psycopg2.connect('postgresql://postgres:postgres@localhost:5432/industrial_knowledge')
cur = conn.cursor()
for wo in wos:
    cur.execute('''
        INSERT INTO work_orders (wo_id, equipment_id, location, raised_date, due_date, closed_date, wo_type, priority,
                                  discipline, description, contractor, planned_hrs, actual_hrs, planned_cost_inr,
                                  actual_cost_inr, status, failure_found, repeat_failure)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (wo_id) DO NOTHING
    ''', (wo['wo_id'], wo['equipment_id'], wo['location'], wo['raised_date'], wo['due_date'], wo['closed_date'],
          wo['wo_type'], wo['priority'], wo['discipline'], wo['description'], wo['contractor'], wo['planned_hrs'],
          wo['actual_hrs'], wo['planned_cost_inr'], wo['actual_cost_inr'], wo['status'], wo['failure_found'], wo['repeat_failure']))
conn.commit()
conn.close()
print('[postgres] Loaded', len(wos), 'work orders')
"

echo "  → Loading incidents..."
python -c "
import json, psycopg2
with open('data/seeds/incidents.json') as f:
    incidents = json.load(f)
conn = psycopg2.connect('postgresql://postgres:postgres@localhost:5432/industrial_knowledge')
cur = conn.cursor()
for inc in incidents:
    cur.execute('''
        INSERT INTO incidents (incident_id, occurred_at, closed_date, incident_type, severity, equipment_id, department,
                               location_detail, description, immediate_cause, root_cause, corrective_action, investigator,
                               injuries, lost_time_days, property_damage_inr, downtime_hours, repeat_incident,
                               lessons_documented, regulatory_reportable)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (incident_id) DO NOTHING
    ''', (inc['incident_id'], inc['occurred_at'], inc['closed_date'], inc['incident_type'], inc['severity'], inc['equipment_id'],
          inc['department'], inc['location_detail'], inc['description'], inc['immediate_cause'], inc['root_cause'],
          inc['corrective_action'], inc['investigator'], inc['injuries'], inc['lost_time_days'], inc['property_damage_inr'],
          inc['downtime_hours'], inc['repeat_incident'], inc['lessons_documented'], inc['regulatory_reportable']))
conn.commit()
conn.close()
print('[postgres] Loaded', len(incidents), 'incidents')
"

echo "  → Loading inspections..."
python -c "
import json, psycopg2
with open('data/seeds/inspection_records.json') as f:
    inspections = json.load(f)
conn = psycopg2.connect('postgresql://postgres:postgres@localhost:5432/industrial_knowledge')
cur = conn.cursor()
for insp in inspections:
    cur.execute('''
        INSERT INTO inspections (inspection_id, equipment_id, equipment_type, inspection_date, inspection_type, inspecting_agency,
                                 result, findings, action_required, action_description, action_due_date, action_closed,
                                 certificate_type, certificate_number, certificate_valid_until, certificate_expired,
                                 next_inspection_due, inspector_name)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (inspection_id) DO NOTHING
    ''', (insp['inspection_id'], insp['equipment_id'], insp['equipment_type'], insp['inspection_date'], insp['inspection_type'],
          insp['inspecting_agency'], insp['result'], insp['findings'], insp['action_required'], insp['action_description'],
          insp['action_due_date'], insp['action_closed'], insp['certificate_type'], insp['certificate_number'],
          insp['certificate_valid_until'], insp['certificate_expired'], insp['next_inspection_due'], insp['inspector_name']))
conn.commit()
conn.close()
print('[postgres] Loaded', len(inspections), 'inspection records')
"

echo "✅ PostgreSQL seeding complete."

# ── Step 3: Seed Neo4j Knowledge Graph ───────────────────────────────────────────
echo ""
echo "[3/6] Seeding Neo4j Knowledge Graph..."

echo "  → Building equipment nodes..."
python -c "
from neo4j import GraphDatabase
import csv
driver = GraphDatabase.driver('bolt://localhost:7687', auth=('neo4j', 'neo4jpassword'))
with driver.session() as session, open('data/seeds/equipment_master.csv') as f:
    reader = csv.DictReader(f)
    for row in reader:
        session.run('''
            MERGE (e:Equipment {equipment_id: \$equipment_id})
            SET e.name = \$name, e.equipment_type = \$equipment_type, e.location = \$location,
                e.criticality = \$criticality, e.status = \$status, e.manufacturer = \$manufacturer
        ''', equipment_id=row['equipment_id'], name=row['name'], equipment_type=row['equipment_type'],
             location=row['location'], criticality=row['criticality'], status=row['status'], manufacturer=row['manufacturer'])
driver.close()
print('[neo4j] Loaded equipment nodes')
"

echo "  → Building regulation nodes..."
python -c "
from neo4j import GraphDatabase
import json
driver = GraphDatabase.driver('bolt://localhost:7687', auth=('neo4j', 'neo4jpassword'))
with driver.session() as session, open('data/seeds/regulation_clauses.json') as f:
    clauses = json.load(f)
    for clause in clauses:
        session.run('''
            MERGE (r:Regulation {clause_id: \$clause_id})
            SET r.regulation = \$regulation, r.title = \$title, r.requirement = \$requirement, r.category = \$category
        ''', **clause)
driver.close()
print('[neo4j] Loaded regulation nodes')
"

echo "✅ Neo4j seeding complete."

# ── Step 4: Initialize ChromaDB ──────────────────────────────────────────────────
echo ""
echo "[4/6] Initializing ChromaDB collections..."
python devops/database/chroma_setup.py
echo "✅ ChromaDB initialization complete."

# ── Step 5: Trigger document ingestion ───────────────────────────────────────────
echo ""
echo "[5/6] Triggering document ingestion pipeline..."
echo "  (This will be handled by run_ingestion.sh — skipping for now)"

# ── Step 6: Summary ───────────────────────────────────────────────────────────────
echo ""
echo "[6/6] Database seeding summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ PostgreSQL: Equipment, maintenance logs, work orders, incidents, inspections, users"
echo "✅ Neo4j: Equipment nodes, regulation nodes, relationships (partial)"
echo "✅ ChromaDB: Collections initialized (ready for ingestion)"
echo ""
echo "Next steps:"
echo "  1. Run: ./devops/scripts/run_ingestion.sh     (ingest documents into vector DB)"
echo "  2. Run: ./devops/scripts/train_models.sh      (train ML models)"
echo "  3. Start backend: docker-compose up backend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
