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

    def generate_plant_compliance_report(self, equipment_list: list[dict], work_orders: list[dict] | None = None) -> dict:
        """
        Generate a detailed plant compliance report including executive summary via LLM.
        Called by `/api/compliance/audit-package` to build the ZIP package.
        """
        from datetime import datetime
        results = []
        for eq in equipment_list:
            results.append(self.checker.check_equipment(eq, additional_records=work_orders))

        non_compliant = [r for r in results if r["overall_status"] == "non_compliant"]
        partial = [r for r in results if r["overall_status"] == "partial"]
        compliant = [r for r in results if r["overall_status"] == "compliant"]
        avg_score = round(sum(r["compliance_score"] for r in results) / len(results), 1) if results else 0.0
        total_critical_gaps = sum(r["critical_gaps_count"] for r in results)

        all_gaps = []
        for r in results:
            for g in r.get("gaps", []):
                gap_copy = dict(g)
                gap_copy["equipment_tag"] = r["equipment_tag"]
                all_gaps.append(gap_copy)

        # Generate Executive Summary via LLM
        gaps_desc = []
        for g in all_gaps[:15]:
            gaps_desc.append(
                f"- Tag {g.get('equipment_tag')}: {g.get('regulation_source')} {g.get('clause_id')} "
                f"({g.get('severity')}): {g.get('requirement')}"
            )
        gaps_list_str = "\n".join(gaps_desc) or "No compliance gaps found."

        system_prompt = (
            "You are the Compliance Intelligence Agent for IndustrialBrain.\n"
            "Generate a concise, professional executive summary of the plant compliance status for the plant manager.\n"
            "List the major gaps, focus areas, and urgent action items based on the provided metrics and details."
        )
        user_prompt = (
            f"PLANT COMPLIANCE METRICS:\n"
            f"- Total Equipment Checked: {len(results)}\n"
            f"- Fully Compliant: {len(compliant)}\n"
            f"- Partially Compliant: {len(partial)}\n"
            f"- Non-Compliant: {len(non_compliant)}\n"
            f"- Average Compliance Score: {avg_score}%\n"
            f"- Total Critical Gaps: {total_critical_gaps}\n\n"
            f"ALL DETECTED GAPS:\n"
            f"{gaps_list_str}\n\n"
            f"Write a professional executive summary outlining:\n"
            f"1. Current compliance health of the plant.\n"
            f"2. The most critical regulations violated (e.g., OISD, Factories Act, PESO).\n"
            f"3. Immediate recommended actions for the plant manager to address high-severity gaps.\n"
        )

        try:
            executive_summary = call_llm(system_prompt, user_prompt)
        except Exception as e:
            logger.warning(f"Failed to generate LLM executive summary, using fallback: {e}")
            executive_summary = (
                f"Plant Compliance Executive Summary — Generated on {datetime.now().strftime('%Y-%m-%d')}\n"
                f"===============================================================\n"
                f"The plant compliance assessment evaluated {len(results)} assets, resulting in an average compliance score of {avg_score}%.\n\n"
                f"Compliance Status Breakdown:\n"
                f"- Fully Compliant Assets: {len(compliant)}\n"
                f"- Partially Compliant Assets: {len(partial)}\n"
                f"- Non-Compliant Assets: {len(non_compliant)}\n"
                f"- Total Critical Gaps Identified: {total_critical_gaps}\n\n"
                f"Key Action Items:\n"
            )
            if all_gaps:
                critical_gaps = [g for g in all_gaps if g.get("severity") == "critical"]
                major_gaps = [g for g in all_gaps if g.get("severity") == "major"]
                if critical_gaps:
                    executive_summary += "1. URGENT: Address critical compliance violations:\n"
                    for g in critical_gaps[:5]:
                        executive_summary += f"   - Tag {g['equipment_tag']}: {g['regulation_source']} {g['clause_id']} - {g['requirement']}\n"
                if major_gaps:
                    executive_summary += "\n2. HIGH PRIORITY: Address major gaps and pending safety inspections:\n"
                    for g in major_gaps[:5]:
                        executive_summary += f"   - Tag {g['equipment_tag']}: {g['regulation_source']} {g['clause_id']} - {g['requirement']}\n"
            else:
                executive_summary += "No compliance gaps identified. Continue standard periodic inspection schedules."

        return {
            "summary": {
                "total_equipment": len(results),
                "non_compliant": len(non_compliant),
                "partial_compliant": len(partial),
                "fully_compliant": len(compliant),
                "average_compliance_score": avg_score,
                "total_critical_gaps": total_critical_gaps,
            },
            "all_gaps": all_gaps,
            "executive_summary": executive_summary,
            "results": results,
            "check_date": datetime.now().strftime("%Y-%m-%d"),
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
            if hasattr(e, "items"):
                e = dict(e)
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
