"""
Smart text chunker — sentence-aware overlapping chunks for RAG.
Owner: Member 2 — ML & Document Intelligence Lead
"""
import re
from loguru import logger


class SmartChunker:
    """
    Split document text into overlapping chunks suitable for embedding.
    Strategy:
      1. Split on sentence boundaries
      2. Build word-count-bounded chunks
      3. Add token overlap so context is not lost between chunks
    """

    def __init__(
        self,
        chunk_size: int = 512,      # max words per chunk
        chunk_overlap: int = 64,    # words of overlap between consecutive chunks
        min_chunk_size: int = 40,   # discard chunks shorter than this
    ):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.min_chunk_size = min_chunk_size
        self._sentence_splitter = re.compile(r'(?<=[.!?])\s+')

    # ------------------------------------------------------------------
    def chunk(self, text: str, metadata: dict | None = None) -> list[dict]:
        """Return list of chunk dicts with text, index, and metadata."""
        if not text or len(text.split()) < self.min_chunk_size:
            return []

        meta = metadata or {}
        sentences = [s.strip() for s in self._sentence_splitter.split(text) if s.strip()]

        chunks: list[dict] = []
        current_words: list[str] = []
        chunk_index = 0

        for sentence in sentences:
            sentence_words = sentence.split()

            # If adding this sentence would exceed the limit, flush current chunk
            if (len(current_words) + len(sentence_words)) > self.chunk_size and current_words:
                chunk_text = " ".join(current_words)
                if len(current_words) >= self.min_chunk_size:
                    chunks.append({
                        "chunk_index": chunk_index,
                        "text": chunk_text,
                        "word_count": len(current_words),
                        "metadata": meta,
                    })
                    chunk_index += 1

                # Keep overlap words from the end of the current chunk
                current_words = current_words[-self.chunk_overlap:]

            current_words.extend(sentence_words)

        # Flush remaining
        if len(current_words) >= self.min_chunk_size:
            chunks.append({
                "chunk_index": chunk_index,
                "text": " ".join(current_words),
                "word_count": len(current_words),
                "metadata": meta,
            })

        logger.debug(f"Produced {len(chunks)} chunks from {len(sentences)} sentences")
        return chunks
