"""
Agent 5 — Lessons Learned Agent.
Detects recurring failure patterns and issues proactive warnings.
Owner: Member 1 — Backend & RAG Lead
"""
import sys
from pathlib import Path
from loguru import logger

from backend.rag.pipeline import RAGPipeline
from backend.rag.llm_chain import call_llm
from backend.rag.prompt_templates import LESSONS_SYSTEM, LESSONS_USER

sys.path.insert(0, str(Path(__file__).parents[4]))
from ml.lessons_learned.pattern_detector import PatternDetector


class LessonsAgent:
    """
    Agent 5 — Lessons Learned Intelligence.

    Mines incident history for recurring failure patterns and
    proactively surfaces lessons learned when similar conditions occur.
    """

    def __init__(self):
        self.detector = PatternDetector()
        self.rag = RAGPipeline()
        logger.success("LessonsAgent ready")

    # ------------------------------------------------------------------
    def get_warnings(self, equipment_tag: str, failure_mode: str = "") -> dict:
        """Get proactive warnings for an equipment tag."""
        # Get pattern warnings
        warnings = self.detector.check_for_warnings(equipment_tag)

        # Get lessons for current failure mode
        lesson = None
        if failure_mode:
            lesson = self.detector.get_warning_for_new_work_order(equipment_tag, failure_mode)

        # RAG context
        query = f"lessons learned incidents {equipment_tag} {failure_mode}"
        context_chunks = self.rag.chroma.search(query, n_results=3)
        context = "\n\n".join(c["text"] for c in context_chunks)

        # Incident history as text
        incident_history = "\n".join([
            str(w) for w in warnings
        ]) if warnings else "No recurring patterns detected."

        # LLM report only if there are warnings
        report = ""
        if warnings or lesson:
            user_prompt = LESSONS_USER.format(
                equipment_tag=equipment_tag,
                failure_mode=failure_mode or "General condition assessment",
                pattern_results=str(warnings),
                incident_history=incident_history,
                context=context or "No specific incident documents found.",
            )
            report = call_llm(LESSONS_SYSTEM, user_prompt)

        return {
            "agent": "lessons",
            "equipment_tag": equipment_tag,
            "warnings": warnings,
            "current_lesson": lesson,
            "warning_count": len(warnings),
            "report": report,
            "sources": [{"filename": c["metadata"].get("filename"), "relevance_score": c["relevance_score"]} for c in context_chunks],
        }

    def get_systemwide_patterns(self) -> dict:
        """Get plant-wide failure pattern summary."""
        return {
            "agent": "lessons",
            **self.detector.get_systemwide_patterns(),
        }

    def process(
        self,
        question: str,
        equipment_tag: str | None = None,
        metadata: dict | None = None,
    ) -> dict:
        """Standard agent interface for router."""
        failure_mode = (metadata or {}).get("failure_mode", "")
        if equipment_tag:
            return self.get_warnings(equipment_tag, failure_mode)

        rag_result = self.rag.query(question, n_results=5)
        rag_result["agent"] = "lessons"
        return rag_result
