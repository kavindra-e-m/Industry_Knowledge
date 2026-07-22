"""
Agent 2 — Expert Copilot (main Q&A agent).
RAG-powered industrial knowledge assistant.
Owner: Member 1 — Backend & RAG Lead
"""
from loguru import logger
from backend.rag.pipeline import RAGPipeline


class CopilotAgent:
    """
    Agent 2 — Industrial knowledge copilot.

    The primary conversational agent. Answers any question
    about equipment, procedures, maintenance, safety using RAG.
    """

    def __init__(self):
        self.rag = RAGPipeline()
        logger.success("CopilotAgent ready")

    def process(
        self,
        question: str,
        equipment_tag: str | None = None,
        metadata: dict | None = None,
    ) -> dict:
        """Answer a question using the full RAG pipeline."""
        result = self.rag.query(
            question=question,
            equipment_tag=equipment_tag,
            n_results=6,
        )
        result["agent"] = "copilot"
        return result
