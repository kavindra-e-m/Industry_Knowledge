// init_neo4j.cypher
// Neo4j schema initialization for Knowledge Graph
// Owner: Member 4 — Data & DevOps Lead

// ═══════════════════════════════════════════════════════════════════════════════
// DROP EXISTING CONSTRAINTS (for clean re-init)
// ═══════════════════════════════════════════════════════════════════════════════

DROP CONSTRAINT equipment_id_unique IF EXISTS;
DROP CONSTRAINT document_id_unique IF EXISTS;
DROP CONSTRAINT regulation_id_unique IF EXISTS;
DROP CONSTRAINT incident_id_unique IF EXISTS;
DROP CONSTRAINT person_id_unique IF EXISTS;

// ═══════════════════════════════════════════════════════════════════════════════
// NODE LABELS & CONSTRAINTS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Equipment ──────────────────────────────────────────────────────────────────
CREATE CONSTRAINT equipment_id_unique IF NOT EXISTS FOR (e:Equipment) REQUIRE e.equipment_id IS UNIQUE;
CREATE INDEX equipment_type_idx IF NOT EXISTS FOR (e:Equipment) ON (e.equipment_type);
CREATE INDEX equipment_criticality_idx IF NOT EXISTS FOR (e:Equipment) ON (e.criticality);
CREATE INDEX equipment_location_idx IF NOT EXISTS FOR (e:Equipment) ON (e.location);

// ─── Document ───────────────────────────────────────────────────────────────────
CREATE CONSTRAINT document_id_unique IF NOT EXISTS FOR (d:Document) REQUIRE d.doc_id IS UNIQUE;
CREATE INDEX document_type_idx IF NOT EXISTS FOR (d:Document) ON (d.doc_type);

// ─── Regulation ─────────────────────────────────────────────────────────────────
CREATE CONSTRAINT regulation_id_unique IF NOT EXISTS FOR (r:Regulation) REQUIRE r.clause_id IS UNIQUE;
CREATE INDEX regulation_name_idx IF NOT EXISTS FOR (r:Regulation) ON (r.regulation);

// ─── Incident ───────────────────────────────────────────────────────────────────
CREATE CONSTRAINT incident_id_unique IF NOT EXISTS FOR (i:Incident) REQUIRE i.incident_id IS UNIQUE;
CREATE INDEX incident_date_idx IF NOT EXISTS FOR (i:Incident) ON (i.occurred_at);
CREATE INDEX incident_severity_idx IF NOT EXISTS FOR (i:Incident) ON (i.severity);

// ─── Person (Expert / Technician) ──────────────────────────────────────────────
CREATE CONSTRAINT person_id_unique IF NOT EXISTS FOR (p:Person) REQUIRE p.name IS UNIQUE;

// ─── Failure Mode ───────────────────────────────────────────────────────────────
CREATE INDEX failure_mode_idx IF NOT EXISTS FOR (f:FailureMode) ON (f.mode_name);

// ─── Part ───────────────────────────────────────────────────────────────────────
CREATE INDEX part_number_idx IF NOT EXISTS FOR (p:Part) ON (p.part_number);

// ═══════════════════════════════════════════════════════════════════════════════
// RELATIONSHIP PATTERNS
// ═══════════════════════════════════════════════════════════════════════════════

// Equipment relationships:
//   (Equipment)-[:HAS_SUBCOMPONENT]->(Equipment)
//   (Equipment)-[:MAINTAINED_BY]->(Person)
//   (Equipment)-[:DOCUMENTED_IN]->(Document)
//   (Equipment)-[:GOVERNED_BY]->(Regulation)
//   (Equipment)-[:FAILED_IN]->(Incident)
//   (Equipment)-[:EXHIBITS]->(FailureMode)
//   (Equipment)-[:USES_PART]->(Part)
//   (Equipment)-[:CONNECTED_TO {via: "P&ID"}]->(Equipment)
//   (Equipment)-[:LOCATED_IN]->(Location)

// Document relationships:
//   (Document)-[:DESCRIBES]->(Equipment)
//   (Document)-[:REFERENCES]->(Regulation)
//   (Document)-[:REFERENCES]->(Incident)
//   (Document)-[:AUTHORED_BY]->(Person)

// Incident relationships:
//   (Incident)-[:INVOLVED]->(Equipment)
//   (Incident)-[:CAUSED_BY]->(FailureMode)
//   (Incident)-[:INVESTIGATED_BY]->(Person)
//   (Incident)-[:SIMILAR_TO]->(Incident)

// Regulation relationships:
//   (Regulation)-[:APPLIES_TO]->(Equipment)
//   (Regulation)-[:REQUIRES]->(Document)

// Person relationships:
//   (Person)-[:MAINTAINS]->(Equipment)
//   (Person)-[:AUTHORED]->(Document)
//   (Person)-[:HAS_EXPERTISE_IN {domain: "pump_maintenance"}]->(FailureMode)

// ═══════════════════════════════════════════════════════════════════════════════
// FULL-TEXT SEARCH INDEXES (for semantic queries)
// ═══════════════════════════════════════════════════════════════════════════════

CREATE FULLTEXT INDEX equipment_search IF NOT EXISTS FOR (e:Equipment) ON EACH [e.name, e.equipment_type, e.location, e.manufacturer];
CREATE FULLTEXT INDEX document_search IF NOT EXISTS FOR (d:Document) ON EACH [d.title, d.content_text];
CREATE FULLTEXT INDEX incident_search IF NOT EXISTS FOR (i:Incident) ON EACH [i.description, i.root_cause, i.immediate_cause];
CREATE FULLTEXT INDEX regulation_search IF NOT EXISTS FOR (r:Regulation) ON EACH [r.title, r.requirement];

// ═══════════════════════════════════════════════════════════════════════════════
// SAMPLE QUERIES (for reference)
// ═══════════════════════════════════════════════════════════════════════════════

// 1. Find all equipment maintained by a technician
// MATCH (p:Person {name: "Rajesh Kumar"})-[:MAINTAINS]->(e:Equipment)
// RETURN e.equipment_id, e.name, e.criticality

// 2. Find equipment with similar failure patterns
// MATCH (e1:Equipment)-[:FAILED_IN]->(i1:Incident)-[:CAUSED_BY]->(f:FailureMode)<-[:CAUSED_BY]-(i2:Incident)<-[:FAILED_IN]-(e2:Equipment)
// WHERE e1.equipment_id <> e2.equipment_id
// RETURN e1.equipment_id, e2.equipment_id, f.mode_name, COUNT(*) AS common_failures
// ORDER BY common_failures DESC

// 3. Trace P&ID impact (downstream equipment)
// MATCH path = (e:Equipment {equipment_id: "P-101"})-[:CONNECTED_TO*1..3]->(downstream:Equipment)
// RETURN path

// 4. Find compliance gaps for equipment
// MATCH (e:Equipment {equipment_id: "V-103"})-[:GOVERNED_BY]->(r:Regulation)
// WHERE NOT (e)-[:DOCUMENTED_IN]->(:Document)-[:SATISFIES]->(r)
// RETURN r.clause_id, r.title, r.requirement

// 5. Knowledge cliff — find equipment only maintained by retiring experts
// MATCH (e:Equipment)<-[:MAINTAINS]-(p:Person)
// WHERE p.retirement_date < date("2026-01-01")
// WITH e, COUNT(p) AS expert_count
// WHERE expert_count = 1
// RETURN e.equipment_id, e.name, expert_count

// ═══════════════════════════════════════════════════════════════════════════════
// END OF SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════
