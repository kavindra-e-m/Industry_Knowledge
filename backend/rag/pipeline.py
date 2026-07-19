"""
RAG Pipeline — retrieval-augmented generation for industrial Q&A.
Owner: Member 1 — Backend & RAG Lead
"""
from loguru import logger
from backend.database.chromadb_client import ChromaDBClient
from backend.database.neo4j_client import Neo4jClient
from backend.rag.llm_chain import call_llm
from backend.rag.prompt_templates import COPILOT_SYSTEM, COPILOT_USER


class RAGPipeline:
    """
    Full RAG pipeline:
      1. Semantic retrieval from ChromaDB
      2. Graph context from Neo4j (equipment history)
      3. LLM answer generation via Gemini 1.5 Flash
      4. Source citation packaging

    Usage:
        rag = RAGPipeline()
        result = rag.query("How do I replace the mechanical seal on P-101?", equipment_tag="P-101")
    """

    def __init__(self):
        self.chroma = ChromaDBClient()
        self.neo4j = Neo4jClient()

    # ------------------------------------------------------------------
    def query(
        self,
        question: str,
        equipment_tag: str | None = None,
        n_results: int = 5,
        min_relevance: float = 0.3,
    ) -> dict:
        """
        Answer a question using RAG + knowledge graph context.

        Returns:
            {
                answer: str,
                sources: list[{filename, relevance_score, text_preview}],
                equipment_tag: str | None,
                chunks_retrieved: int,
                graph_context_available: bool,
            }
        """
        # 1. Semantic retrieval
        where = None
        if equipment_tag:
            # Try to filter by equipment tag in chunk metadata
            where = {"equipment_tags": {"$contains": equipment_tag}}

        chunks = []
        try:
            chunks = self.chroma.search(
                question,
                n_results=n_results,
                where=where,
                min_relevance=min_relevance,
            )
        except Exception as e:
            logger.warning(f"ChromaDB search failed (equipment filter), retrying without filter: {e}")
            try:
                chunks = self.chroma.search(question, n_results=n_results)
            except Exception as e2:
                logger.error(f"ChromaDB search completely failed: {e2}")

        # 2. Graph context
        graph_context = {}
        if equipment_tag:
            try:
                graph_context = self.neo4j.get_equipment_full_history(equipment_tag)
            except Exception as e:
                logger.warning(f"Neo4j query failed for {equipment_tag}: {e}")

        # 3. Build context string
        context_parts = []
        for chunk in chunks:
            source = chunk["metadata"].get("filename", "Unknown source")
            relevance = chunk["relevance_score"]
            context_parts.append(
                f"[Source: {source} | Relevance: {relevance}]\n{chunk['text']}"
            )
        context_str = "\n\n---\n\n".join(context_parts) if context_parts else "No matching documents found in knowledge base."

        history_str = self._format_graph_history(graph_context)

        # 4. LLM generation
        user_prompt = COPILOT_USER.format(
            context=context_str,
            equipment_history=history_str or "No equipment history available.",
            question=question,
        )

        answer = call_llm(COPILOT_SYSTEM, user_prompt)

        # 5. Package sources
        sources = [
            {
                "filename": c["metadata"].get("filename", "Unknown"),
                "document_subtype": c["metadata"].get("document_subtype", "general"),
                "relevance_score": c["relevance_score"],
                "text_preview": c["text"][:250] + "..." if len(c["text"]) > 250 else c["text"],
                "rank": c["rank"],
            }
            for c in chunks
        ]

        return {
            "answer": answer,
            "sources": sources,
            "equipment_tag": equipment_tag,
            "chunks_retrieved": len(chunks),
            "graph_context_available": bool(graph_context),
        }

    # ------------------------------------------------------------------
    def _format_graph_history(self, history: dict) -> str:
        if not history:
            return ""

        e = history.get("e") or {}
        parts = []

        if e:
            parts.append(
                f"Equipment: {e.get('tag_id', 'N/A')} — "
                f"Type: {e.get('equipment_type', 'N/A')} — "
                f"Status: {e.get('status', 'N/A')} — "
                f"Health Score: {e.get('health_score', 'N/A')} — "
                f"Failure Probability: {e.get('failure_probability', 'N/A')}"
            )

        docs = history.get("documents") or []
        if docs:
            parts.append(f"Related Documents: {len(docs)} documents on record")

        wos = history.get("work_orders") or []
        if wos:
            parts.append(f"Work Orders: {len(wos)} on record")

        incs = history.get("incidents") or []
        if incs:
            parts.append(f"Incidents: {len(incs)} incidents recorded")

        downstream = history.get("downstream") or []
        if downstream:
            tags = [d.get("tag_id", "?") for d in downstream if isinstance(d, dict)]
            parts.append(f"Downstream Equipment: {', '.join(tags[:5])}")

        return "\n".join(parts)
