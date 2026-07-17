"""
Master document ingestion orchestrator.
Routes any supported file to the correct parser, extracts text + entities,
chunks for RAG, and returns a unified result dict.
Owner: Member 2 — ML & Document Intelligence Lead
"""
import os
import uuid
from pathlib import Path
from typing import Optional
from loguru import logger

from ml.document_processing.pdf_parser import PDFParser
from ml.document_processing.ocr_engine import OCREngine
from ml.document_processing.excel_parser import ExcelParser
from ml.document_processing.word_parser import WordParser
from ml.document_processing.email_parser import EmailParser
from ml.document_processing.chunker import SmartChunker
from ml.document_processing.metadata_extractor import MetadataExtractor
from ml.entity_extraction.ner_pipeline import NERPipeline

SUPPORTED_EXTENSIONS: dict[str, str] = {
    ".pdf": "pdf",
    ".png": "image", ".jpg": "image", ".jpeg": "image",
    ".tiff": "image", ".tif": "image", ".bmp": "image",
    ".xlsx": "excel", ".xls": "excel", ".csv": "excel",
    ".docx": "word", ".doc": "word",
    ".eml": "email", ".msg": "email",
}


class IngestionPipeline:
    """
    Unified ingestion pipeline for all document types.

    Usage:
        pipeline = IngestionPipeline()
        result = pipeline.ingest("path/to/manual.pdf")
        # result contains: document_id, chunks, entities, metadata, ...
    """

    def __init__(self):
        logger.info("Initialising IngestionPipeline — CPU mode")
        self.pdf_parser = PDFParser()
        self.ocr_engine = OCREngine()
        self.excel_parser = ExcelParser()
        self.word_parser = WordParser()
        self.email_parser = EmailParser()
        self.chunker = SmartChunker(chunk_size=512, chunk_overlap=64)
        self.metadata_extractor = MetadataExtractor()
        self.ner = NERPipeline()
        logger.success("IngestionPipeline ready")

    # ------------------------------------------------------------------
    def ingest(self, file_path: str, document_type: Optional[str] = None) -> dict:
        """
        Ingest a single file.

        Returns a dict with:
          - document_id: str (UUID)
          - filename: str
          - file_path: str
          - file_type: str
          - raw_text: str
          - chunks: list[dict]
          - entities: dict
          - metadata: dict
          - equipment_tags: list[str]
          - regulation_refs: list[str]
          - chunk_count: int
        """
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        extension = path.suffix.lower()
        file_type = document_type or SUPPORTED_EXTENSIONS.get(extension)
        if not file_type:
            raise ValueError(f"Unsupported file type: {extension}")

        logger.info(f"Ingesting {path.name} as {file_type}")

        # 1. Extract text
        raw_text = self._extract_text(str(file_path), file_type)
        if not raw_text.strip():
            logger.warning(f"No text extracted from {path.name}")

        # 2. Metadata
        metadata = self.metadata_extractor.extract(raw_text, path.name, file_type)

        # 3. NER
        entities = self.ner.extract(raw_text)

        # 4. Chunk for RAG
        chunks = self.chunker.chunk(raw_text, metadata={
            "filename": path.name,
            "file_type": file_type,
            "document_subtype": metadata.get("document_subtype", "general"),
            "equipment_tags": entities.get("equipment_tags", []),
        })

        document_id = str(uuid.uuid4())
        result = {
            "document_id": document_id,
            "filename": path.name,
            "file_path": str(file_path),
            "file_type": file_type,
            "raw_text": raw_text,
            "chunks": chunks,
            "entities": entities,
            "metadata": metadata,
            "chunk_count": len(chunks),
            "equipment_tags": entities.get("equipment_tags", []),
            "regulation_refs": entities.get("regulation_refs", []),
        }

        logger.success(
            f"Ingested {path.name}: {len(chunks)} chunks | "
            f"{len(result['equipment_tags'])} equip tags | "
            f"{len(result['regulation_refs'])} reg refs"
        )
        return result

    def ingest_directory(self, directory: str) -> list[dict]:
        """Recursively ingest all supported files in a directory."""
        dir_path = Path(directory)
        if not dir_path.is_dir():
            raise NotADirectoryError(f"Not a directory: {directory}")

        files = [f for f in dir_path.rglob("*") if f.suffix.lower() in SUPPORTED_EXTENSIONS]
        logger.info(f"Found {len(files)} supported files in {directory}")

        results = []
        for file in files:
            try:
                results.append(self.ingest(str(file)))
            except Exception as e:
                logger.error(f"Failed to ingest {file.name}: {e}")
        return results

    # ------------------------------------------------------------------
    def _extract_text(self, file_path: str, file_type: str) -> str:
        if file_type == "pdf":
            text = self.pdf_parser.extract(file_path)
            # If text is sparse (likely scanned), fallback to OCR
            if len(text.strip()) < 50:
                logger.info(f"Sparse text in PDF — applying OCR for {file_path}")
                text = self.ocr_engine.extract(file_path)
            return text
        elif file_type == "image":
            return self.ocr_engine.extract(file_path)
        elif file_type == "excel":
            return self.excel_parser.extract(file_path)
        elif file_type == "word":
            return self.word_parser.extract(file_path)
        elif file_type == "email":
            return self.email_parser.extract(file_path)
        return ""
