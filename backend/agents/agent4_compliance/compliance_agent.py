"""
Agent 4 — Compliance Intelligence Agent.
OISD / Factories Act / PESO gap detection + LLM report.
Owner: Member 1 — Backend & RAG Lead
"""
import sys
import json
from pathlib import Path
from loguru import logger

from backend.database.neo4j_client import Neo4jClient
from backend.rag.pipeline import RAGPipeline
from backend.rag.llm_chain import call_llm
from backend.rag.prompt_templates import COMPLIANCE_SYSTEM, COMPLIANCE_USER

sys.path.insert(0, str(Path(__file__).parents[4]))
from ml.compliance.compliance_checker import ComplianceChecker


class ComplianceAgent:
    """
    Agent 4 — Compliance Intelligence.

    Checks equipment against Indian industrial regulations and generates
    actionable compliance reports with specific clause references.
    """

    def __init__(self):
        self.checker = ComplianceChecker()
        self.neo4j = Neo4jClient()
        self.rag = RAGPipeline()
        logger.success("ComplianceAgent ready")

    # ------------------------------------------------------------------
    def check_equipment(self, equipment_tag: str) -> dict:
        """Run compliance check for a single equipment tag."""
        # Get equipment details from Neo4j
        history = self.neo4j.get_equipment_full_history(equipment_tag)
        e = history.get("e") or {}

        equipment = {
            "tag_id": equipment_tag,
            "equipment_type": e.get("equipment_type", ""),
            "criticality": e.get("criticality", "Unknown"),
        }

        # Run compliance check
        compliance_result = self.checker.check_equipment(equipment)

        # Get regulation context from RAG
        query = f"OISD regulations for {equipment.get('equipment_type', equipment_tag)} inspection"
        context_chunks = self.rag.chroma.search(query, n_results=3)
        context = "\n\n".join(c["text"] for c in context_chunks)

        # Applicable regulations summary
        applicable_regs = "\n".join([
            f"- {g['regulation_source']} {g['clause_id']}: {g['requirement']}"
            for g in compliance_result.get("gaps", [])
        ]) or "No gaps found."

        # LLM report
        user_prompt = COMPLIANCE_USER.format(
            equipment_tag=equipment_tag,
            equipment_type=equipment.get("equipment_type", "Unknown"),
            location=e.get("location", "Unknown"),
            criticality=equipment.get("criticality", "Unknown"),
            compliance_results=json.dumps(compliance_result, indent=2, default=str),
            applicable_regulations=applicable_regs,
            context=context or "No specific compliance documents found.",
        )
        report = call_llm(COMPLIANCE_SYSTEM, user_prompt)

        return {
            "agent": "compliance",
            "equipment_tag": equipment_tag,
            "compliance_score": compliance_result["compliance_score"],
            "overall_status": compliance_result["overall_status"],
            "critical_gaps_count": compliance_result["critical_gaps_count"],
            "gaps": compliance_result["gaps"],
            "report": report,
            "sources": [{"filename": c["metadata"].get("filename"), "relevance_score": c["relevance_score"]} for c in context_chunks],
        }

    def check_plant_compliance(self) -> dict:
        """Run compliance across all equipment in the plant."""
        try:
            all_equipment = self.neo4j.get_all_equipment()
        except Exception as e:
            logger.warning(f"Neo4j offline ({e}), using default plant equipment list for compliance scan.")
            all_equipment = [
                {"tag_id": "P-101", "equipment_type": "Pump", "criticality": "High"},
                {"tag_id": "P-104", "equipment_type": "Pump", "criticality": "Medium"},
                {"tag_id": "E-101", "equipment_type": "Heat Exchanger", "criticality": "High"},
                {"tag_id": "CV-102", "equipment_type": "Control Valve", "criticality": "Medium"},
                {"tag_id": "SV-102", "equipment_type": "Safety Valve", "criticality": "High"},
                {"tag_id": "P-202", "equipment_type": "Pump", "criticality": "High"},
                {"tag_id": "R-102", "equipment_type": "Reactor", "criticality": "High"},
                {"tag_id": "C-101", "equipment_type": "Compressor", "criticality": "High"},
            ]
        eq_list = []
        for row in all_equipment:
            e = row.get("e") or row
            if isinstance(e, dict):
                eq_list.append({
                    "tag_id": e.get("tag_id") or e.get("equipment_id", ""),
                    "equipment_type": e.get("equipment_type", ""),
                    "criticality": e.get("criticality", "Medium"),
                })

        result = self.checker.check_plant_compliance(eq_list)
        return {"agent": "compliance", **result}

    def process(
        self,
        question: str,
        equipment_tag: str | None = None,
        metadata: dict | None = None,
    ) -> dict:
        """Standard agent interface for router."""
        if equipment_tag:
            return self.check_equipment(equipment_tag)

        rag_result = self.rag.query(question, n_results=5)
        rag_result["agent"] = "compliance"
        return rag_result
