"""
Agent 1 — Knowledge Base Agent.
Handles document ingestion, embedding, and knowledge graph building.
Owner: Member 1 — Backend & RAG Lead
"""
import os
import tempfile
from pathlib import Path
from loguru import logger

from backend.database.chromadb_client import ChromaDBClient
from backend.knowledge_graph.graph_builder import GraphBuilder
from backend.rag.llm_chain import call_llm
from backend.rag.prompt_templates import KNOWLEDGE_SYSTEM, KNOWLEDGE_USER


class KnowledgeAgent:
    """
    Agent 1 — Document ingestion and knowledge base management.

    Responsibilities:
    - Accept uploaded files and route to ML ingestion pipeline
    - Store chunks in ChromaDB
    - Update Neo4j knowledge graph
    - Generate ingestion summaries via LLM
    """

    def __init__(self):
        self.chroma = ChromaDBClient()
        self.graph = GraphBuilder()
        logger.success("KnowledgeAgent ready")

    # ------------------------------------------------------------------
    def ingest_file(self, file_path: str, filename: str | None = None) -> dict:
        """
        Full ingestion pipeline: parse → chunk → embed → graph.

        Returns ingestion result with document_id, chunk count, entities.
        """
        from ml.document_processing.ingestion_pipeline import IngestionPipeline

        pipeline = IngestionPipeline()
        result = pipeline.ingest(file_path, document_type=None)

        # Store chunks in ChromaDB
        chunk_meta = {
            "document_id": result["document_id"],
            "filename": result["filename"],
            "file_type": result["file_type"],
            "document_subtype": result["metadata"].get("document_subtype", "general"),
            "equipment_tags": str(result.get("equipment_tags", [])),
        }
        self.chroma.add_chunks(result["chunks"], result["document_id"], chunk_meta)

        # Update knowledge graph
        self.graph.process_ingestion_result(result)

        # Generate LLM summary
        summary = self._generate_summary(result)

        return {
            "document_id": result["document_id"],
            "filename": result["filename"],
            "file_type": result["file_type"],
            "document_subtype": result["metadata"].get("document_subtype", "general"),
            "chunk_count": result["chunk_count"],
            "equipment_tags": result["equipment_tags"],
            "regulation_refs": result["regulation_refs"],
            "word_count": result["metadata"].get("word_count", 0),
            "summary": summary,
            "status": "processed",
        }

    def ingest_bytes(self, file_bytes: bytes, filename: str) -> dict:
        """Accept file bytes (from HTTP upload), save to temp, then ingest."""
        suffix = Path(filename).suffix
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        try:
            result = self.ingest_file(tmp_path, filename)
            result["filename"] = filename  # Restore original name
            return result
        finally:
            os.unlink(tmp_path)

    def process(self, question: str, equipment_tag: str | None = None, metadata: dict | None = None) -> dict:
        """Standard agent interface — returns knowledge base stats for general queries."""
        stats = self.chroma.get_collection_stats()
        graph_stats = self.graph.get_graph_stats()
        return {
            "answer": (
                f"Knowledge base contains {stats['total_chunks']} indexed chunks. "
                f"Knowledge graph has {graph_stats.get('nodes', {}).get('Equipment', 0)} equipment nodes. "
                "Upload documents via POST /api/ingest/document to expand the knowledge base."
            ),
            "chroma_stats": stats,
            "graph_stats": graph_stats,
        }

    # ------------------------------------------------------------------
    def _generate_summary(self, result: dict) -> str:
        user_prompt = KNOWLEDGE_USER.format(
            filename=result["filename"],
            document_type=result["metadata"].get("document_subtype", result["file_type"]),
            equipment_tags=", ".join(result["equipment_tags"][:20]) or "None detected",
            regulation_refs=", ".join(result["regulation_refs"][:10]) or "None detected",
            content_preview=result["raw_text"][:3000],
        )
        return call_llm(KNOWLEDGE_SYSTEM, user_prompt, use_cache=False)
