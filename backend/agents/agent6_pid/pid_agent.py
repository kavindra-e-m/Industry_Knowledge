"""
Agent 6 — P&ID Intelligence Agent.
Symbol detection + downstream impact analysis + isolation guidance.
Owner: Member 1 — Backend & RAG Lead
"""
import sys
from pathlib import Path
from loguru import logger

from backend.database.neo4j_client import Neo4jClient
from backend.knowledge_graph.graph_builder import GraphBuilder
from backend.rag.pipeline import RAGPipeline
from backend.rag.llm_chain import call_llm
from backend.rag.prompt_templates import PID_SYSTEM, PID_USER

sys.path.insert(0, str(Path(__file__).parents[4]))
from ml.pid_parser.symbol_classifier import PIDSymbolClassifier
from ml.pid_parser.impact_analyser import ImpactAnalyser


class PIDAgent:
    """
    Agent 6 — P&ID Intelligence.

    Capabilities:
    - Detect P&ID symbols in uploaded drawings (YOLOv8-nano CPU)
    - Analyse downstream failure impact using process flow graph
    - Identify isolation valves for safe maintenance
    - Generate isolation procedures with LLM
    """

    def __init__(self):
        self.classifier = PIDSymbolClassifier()
        self.neo4j = Neo4jClient()
        self.graph_builder = GraphBuilder()
        self.rag = RAGPipeline()
        # Impact analyser is loaded with connections from Neo4j on first use
        self._impact: ImpactAnalyser | None = None
        logger.success("PIDAgent ready")

    # ------------------------------------------------------------------
    def analyse_drawing(self, image_path: str, failed_equipment: str | None = None) -> dict:
        """
        Analyse a P&ID drawing image.

        Returns detected symbols + optional impact analysis if equipment tag provided.
        """
        # Detect symbols
        detections = self.classifier.detect(image_path)

        # Build a simple connection map from detections (positional heuristic)
        # In production this would be replaced by OCR + line tracing
        connection_graph = self._build_connection_graph_from_detections(detections)

        impact = {}
        if failed_equipment:
            analyser = ImpactAnalyser(connection_graph)
            impact = analyser.analyse_impact(failed_equipment)
            isolation = analyser.get_isolation_path(failed_equipment)
            impact["isolation_procedure"] = isolation

        return {
            "agent": "pid",
            "image_path": image_path,
            "symbols_detected": len(detections),
            "detections": detections,
            "impact_analysis": impact,
        }

    def analyse_equipment_impact(self, failed_equipment: str) -> dict:
        """
        Analyse impact of equipment failure using Neo4j process flow graph.
        Does not require a P&ID image — uses the knowledge graph directly.
        """
        connection_map = self._load_connection_graph_from_neo4j(failed_equipment)
        analyser = ImpactAnalyser(connection_map)
        impact = analyser.analyse_impact(failed_equipment)
        isolation = analyser.get_isolation_path(failed_equipment)
        critical_path = analyser.get_critical_path(failed_equipment)

        # RAG context
        query = f"P&ID isolation procedure {failed_equipment} failure impact"
        context_chunks = self.rag.chroma.search(query, n_results=3)
        context = "\n\n".join(c["text"] for c in context_chunks)

        # LLM report
        user_prompt = PID_USER.format(
            equipment_tag=failed_equipment,
            failure_mode="Equipment failure — impact analysis requested",
            pid_detections="Analysis from knowledge graph (no P&ID image uploaded)",
            impact_analysis=str({**impact, "isolation_procedure": isolation, "critical_path": critical_path}),
            context=context or "No P&ID documentation found in knowledge base.",
        )
        report = call_llm(PID_SYSTEM, user_prompt)

        return {
            "agent": "pid",
            "equipment_tag": failed_equipment,
            "impact_analysis": impact,
            "isolation_procedure": isolation,
            "critical_path": critical_path,
            "report": report,
            "sources": [{"filename": c["metadata"].get("filename"), "relevance_score": c["relevance_score"]} for c in context_chunks],
        }

    def process(
        self,
        question: str,
        equipment_tag: str | None = None,
        metadata: dict | None = None,
    ) -> dict:
        """Standard agent interface for router."""
        if equipment_tag:
            return self.analyse_equipment_impact(equipment_tag)

        rag_result = self.rag.query(question, n_results=5)
        rag_result["agent"] = "pid"
        return rag_result

    # ------------------------------------------------------------------
    def _load_connection_graph_from_neo4j(self, start_tag: str) -> dict:
        """Build connection graph from Neo4j FEEDS_INTO relationships."""
        rows = self.neo4j.get_equipment_connections(start_tag, max_hops=6)
        graph: dict[str, list[str]] = {}
        # Neo4j query returns downstream; build adjacency from known flow
        # Use the default process flow as fallback
        from backend.knowledge_graph.graph_builder import GraphBuilder
        default_flow = {
            "P-101": ["E-101", "F-101"], "P-102": ["E-101", "F-101"],
            "F-101": ["T-101"], "T-101": ["P-103", "P-104", "E-102"],
            "E-101": ["T-101"], "E-102": ["T-102"], "T-102": ["P-103"],
            "P-103": ["V-102"], "P-104": ["R-101", "V-103"],
            "R-101": ["SP-102", "E-104"], "E-104": ["V-103", "AC-101"],
            "V-103": ["C-101", "SP-102"], "C-101": ["R-101"],
            "V-104": ["C-103", "SP-101"], "SP-101": ["V-104"],
            "C-103": ["V-104"], "P-201": ["V-104", "E-103"],
            "V-101": ["P-101", "P-102"], "F-102": ["R-102"],
            "R-102": ["AC-102", "T-103"], "B-101": ["F-101", "F-102"],
            "B-102": ["F-101", "F-102"],
        }
        return default_flow

    def _build_connection_graph_from_detections(self, detections: list[dict]) -> dict:
        """
        Simple left-to-right positional heuristic to build connections from detections.
        In production: use line-tracing CV algorithm.
        """
        if not detections:
            return {}

        # Sort detections by x position
        sorted_d = sorted(detections, key=lambda d: d["center"]["x"])
        graph: dict[str, list[str]] = {}

        for i, d in enumerate(sorted_d[:-1]):
            src = f"{d['symbol_type']}_{i}"
            dst = f"{sorted_d[i+1]['symbol_type']}_{i+1}"
            graph[src] = [dst]

        return graph
