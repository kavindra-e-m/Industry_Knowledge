"""
Neo4j singleton client with industrial knowledge graph queries.
Owner: Member 1 — Backend & RAG Lead
"""
from neo4j import GraphDatabase
from loguru import logger
from backend.config.settings import settings


class Neo4jClient:
    """
    Singleton Neo4j driver with pre-built queries for the industrial knowledge graph.

    Schema (abbreviated):
        (Equipment)-[:HAS_DOCUMENT]->(Document)
        (Equipment)-[:INVOLVED_IN]->(Incident)
        (Equipment)-[:HAS_WORK_ORDER]->(WorkOrder)
        (Equipment)-[:GOVERNED_BY]->(Regulation)
        (Equipment)-[:FEEDS_INTO]->(Equipment)
        (Document)-[:REFERENCES]->(Regulation)
    """
    _instance: "Neo4jClient | None" = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self._init()

    def _init(self):
        logger.info(f"Connecting to Neo4j at {settings.NEO4J_URI}...")
        self.driver = GraphDatabase.driver(
            settings.NEO4J_URI,
            auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
        )
        # Verify connection
        try:
            with self.driver.session() as session:
                session.run("RETURN 1")
            logger.success("Neo4j connected")
        except Exception as e:
            logger.error(f"Neo4j connection failed: {e}")
            self.driver = None

    # ------------------------------------------------------------------
    def run(self, query: str, params: dict | None = None) -> list[dict]:
        """Execute a Cypher query and return results as list of dicts."""
        if not hasattr(self, "driver") or self.driver is None:
            return []
        try:
            with self.driver.session() as session:
                result = session.run(query, params or {})
                return [dict(record) for record in result]
        except Exception as e:
            logger.warning(f"Neo4j query execution skipped ({e})")
            return []

    def close(self):
        if self.driver:
            self.driver.close()

    # ------------------------------------------------------------------
    # Equipment queries
    # ------------------------------------------------------------------

    def get_equipment_full_history(self, tag_id: str) -> dict:
        """Fetch equipment node with all related documents, incidents, work orders, regulations."""
        result = self.run("""
            MATCH (e:Equipment {tag_id: $tag_id})
            OPTIONAL MATCH (e)-[:HAS_DOCUMENT]->(d:Document)
            OPTIONAL MATCH (e)-[:INVOLVED_IN]->(i:Incident)
            OPTIONAL MATCH (e)-[:HAS_WORK_ORDER]->(wo:WorkOrder)
            OPTIONAL MATCH (e)-[:GOVERNED_BY]->(r:Regulation)
            OPTIONAL MATCH (e)-[:FEEDS_INTO]->(down:Equipment)
            RETURN e,
                collect(DISTINCT d)  AS documents,
                collect(DISTINCT i)  AS incidents,
                collect(DISTINCT wo) AS work_orders,
                collect(DISTINCT r)  AS regulations,
                collect(DISTINCT down) AS downstream
        """, {"tag_id": tag_id})
        return result[0] if result else {}

    def get_equipment_connections(self, tag_id: str, max_hops: int = 5) -> list[dict]:
        """Get all equipment downstream of a given tag (up to max_hops)."""
        return self.run(f"""
            MATCH (e:Equipment {{tag_id: $tag_id}})-[:FEEDS_INTO*1..{max_hops}]->(down:Equipment)
            RETURN down.tag_id AS tag_id, down.name AS name,
                   down.equipment_type AS equipment_type,
                   down.criticality AS criticality
        """, {"tag_id": tag_id})

    def get_all_equipment(self) -> list[dict]:
        """Return all equipment nodes."""
        return self.run("MATCH (e:Equipment) RETURN e ORDER BY e.tag_id")

    def search_equipment_by_name(self, name_fragment: str) -> list[dict]:
        """Full-text search on equipment name (case-insensitive)."""
        return self.run("""
            MATCH (e:Equipment)
            WHERE toLower(e.name) CONTAINS toLower($name)
            RETURN e ORDER BY e.tag_id LIMIT 20
        """, {"name": name_fragment})

    # ------------------------------------------------------------------
    # Write queries
    # ------------------------------------------------------------------

    def create_equipment_node(self, equipment: dict):
        """Upsert an equipment node with all properties."""
        tag_id = equipment.get("tag_id") or equipment.get("equipment_id")
        if not tag_id:
            return
        props = {k: v for k, v in equipment.items() if k not in ("tag_id", "equipment_id") and v is not None}
        self.run("""
            MERGE (e:Equipment {tag_id: $tag_id})
            SET e += $props, e.tag_id = $tag_id
        """, {"tag_id": tag_id, "props": props})

    def create_document_node(self, document_id: str, filename: str, doc_type: str, subtype: str = "general"):
        self.run("""
            MERGE (d:Document {id: $id})
            SET d.filename = $fn, d.document_type = $doc_type, d.subtype = $subtype
        """, {"id": document_id, "fn": filename, "doc_type": doc_type, "subtype": subtype})

    def link_equipment_to_document(self, tag_id: str, document_id: str):
        self.run("""
            MERGE (e:Equipment {tag_id: $tag_id})
            MERGE (d:Document {id: $doc_id})
            MERGE (e)-[:HAS_DOCUMENT]->(d)
        """, {"tag_id": tag_id, "doc_id": document_id})

    def create_regulation_node(self, clause_id: str, source: str, title: str):
        self.run("""
            MERGE (r:Regulation {clause_id: $clause_id})
            SET r.source = $source, r.title = $title
        """, {"clause_id": clause_id, "source": source, "title": title})

    def link_document_to_regulation(self, document_id: str, clause_id: str):
        self.run("""
            MERGE (d:Document {id: $doc_id})
            MERGE (r:Regulation {clause_id: $clause_id})
            MERGE (d)-[:REFERENCES]->(r)
        """, {"doc_id": document_id, "clause_id": clause_id})

    def link_equipment_flow(self, upstream_tag: str, downstream_tag: str):
        """Create FEEDS_INTO relationship between equipment."""
        self.run("""
            MERGE (a:Equipment {tag_id: $upstream})
            MERGE (b:Equipment {tag_id: $downstream})
            MERGE (a)-[:FEEDS_INTO]->(b)
        """, {"upstream": upstream_tag, "downstream": downstream_tag})

    def update_equipment_health(self, tag_id: str, health_score: float, failure_probability: float):
        self.run("""
            MATCH (e:Equipment {tag_id: $tag_id})
            SET e.health_score = $health, e.failure_probability = $fp, e.last_assessed = datetime()
        """, {"tag_id": tag_id, "health": round(health_score, 3), "fp": round(failure_probability, 3)})

    # ------------------------------------------------------------------
    # Graph statistics
    # ------------------------------------------------------------------

    def get_graph_stats(self) -> dict:
        nodes = self.run("MATCH (n) RETURN labels(n)[0] AS label, count(n) AS count")
        rels = self.run("MATCH ()-[r]->() RETURN type(r) AS rel_type, count(r) AS count")
        return {
            "nodes": {row["label"]: row["count"] for row in nodes if row["label"]},
            "relationships": {row["rel_type"]: row["count"] for row in rels if row["rel_type"]},
        }
