"""
Knowledge Graph Builder — processes ingestion results into Neo4j.
Owner: Member 1 — Backend & RAG Lead
"""
import csv
from io import StringIO
from pathlib import Path
from loguru import logger
from backend.database.neo4j_client import Neo4jClient


class GraphBuilder:
    """
    Builds and maintains the IndustrialBrain knowledge graph in Neo4j.

    Responsibilities:
    - Convert ingestion pipeline results to graph nodes and relationships
    - Seed equipment master data from CSV
    - Link documents → equipment → regulations
    - Update equipment health scores from ML predictions
    """

    def __init__(self):
        self.neo4j = Neo4jClient()

    # ------------------------------------------------------------------
    def process_ingestion_result(self, result: dict):
        """
        Process a completed ingestion result and update the knowledge graph.
        Called by agent1_knowledge after each document is ingested.
        """
        doc_id = result["document_id"]
        filename = result["filename"]
        file_type = result["file_type"]
        subtype = result.get("metadata", {}).get("document_subtype", "general")

        # Create document node
        self.neo4j.create_document_node(doc_id, filename, file_type, subtype)

        # Link equipment tags to document
        for tag in result.get("equipment_tags", []):
            if len(tag) >= 3:  # Filter out noise
                self.neo4j.link_equipment_to_document(tag, doc_id)

        # Link regulation references to document
        for ref in result.get("regulation_refs", []):
            if len(ref) >= 4:
                # Extract clause_id and source
                source = ref.split("-")[0] if "-" in ref else ref[:6]
                self.neo4j.create_regulation_node(ref, source, ref)
                self.neo4j.link_document_to_regulation(doc_id, ref)

        logger.debug(
            f"Graph updated for {filename}: "
            f"{len(result.get('equipment_tags', []))} equipment, "
            f"{len(result.get('regulation_refs', []))} regulations"
        )

    def seed_from_equipment_master(self, csv_path: str | None = None):
        """
        Load equipment_master.csv into Neo4j as Equipment nodes.
        This should be run once on startup if the graph is empty.
        """
        path = Path(csv_path or "data/seeds/equipment_master.csv")
        if not path.exists():
            logger.warning(f"Equipment master not found: {path}")
            return 0

        count = 0
        with open(path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                equipment = {k: v.strip() for k, v in row.items() if v and v.strip()}
                # Normalise the tag field name
                if "equipment_id" in equipment and "tag_id" not in equipment:
                    equipment["tag_id"] = equipment["equipment_id"]

                self.neo4j.create_equipment_node(equipment)
                count += 1

        logger.success(f"Seeded {count} equipment nodes from {path}")
        return count

    def seed_process_flow(self, flow_map: dict[str, list[str]]):
        """
        Create FEEDS_INTO relationships from a process flow map.
        flow_map = {"P-101": ["E-101", "V-101"], "E-101": ["T-101"], ...}
        """
        for upstream, downstreams in flow_map.items():
            for downstream in downstreams:
                self.neo4j.link_equipment_flow(upstream, downstream)
        logger.success(f"Seeded {sum(len(v) for v in flow_map.values())} process flow relationships")

    def seed_default_process_flow(self):
        """
        Seed a plausible CDU → downstream process flow based on equipment master.
        Used for demo purposes — replace with real P&ID-derived connections.
        """
        flow = {
            "P-101": ["E-101", "F-101"],
            "P-102": ["E-101", "F-101"],
            "F-101": ["T-101"],
            "T-101": ["P-103", "P-104", "E-102"],
            "E-101": ["T-101"],
            "E-102": ["T-102"],
            "T-102": ["P-103"],
            "P-103": ["V-102"],
            "P-104": ["R-101", "V-103"],
            "R-101": ["SP-102", "E-104"],
            "E-104": ["V-103", "AC-101"],
            "V-103": ["C-101", "SP-102"],
            "C-101": ["R-101"],
            "V-104": ["C-103", "SP-101"],
            "SP-101": ["V-104"],
            "C-103": ["V-104"],
            "P-201": ["V-104", "E-103"],
            "V-101": ["P-101", "P-102"],
            "F-102": ["R-102"],
            "R-102": ["AC-102", "T-103"],
            "B-101": ["F-101", "F-102"],
            "B-102": ["F-101", "F-102"],
        }
        self.seed_process_flow(flow)

    def update_equipment_health_in_graph(self, tag_id: str, health_score: float, failure_probability: float):
        """Persist ML prediction results back into the knowledge graph."""
        self.neo4j.update_equipment_health(tag_id, health_score, failure_probability)

    def get_graph_stats(self) -> dict:
        return self.neo4j.get_graph_stats()

    def ensure_graph_initialized(self) -> bool:
        """Check if graph has equipment nodes; seed if empty."""
        stats = self.get_graph_stats()
        equipment_count = stats.get("nodes", {}).get("Equipment", 0)
        if equipment_count == 0:
            logger.info("Graph empty — seeding from equipment master...")
            seeded = self.seed_from_equipment_master()
            if seeded > 0:
                self.seed_default_process_flow()
            return seeded > 0
        logger.info(f"Graph has {equipment_count} equipment nodes — skipping seed")
        return True
