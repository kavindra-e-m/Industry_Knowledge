"""
ChromaDB singleton client + embedding wrapper.
Owner: Member 1 — Backend & RAG Lead
"""


# pyrefly: ignore [missing-import]
import chromadb
from sentence_transformers import SentenceTransformer
from loguru import logger
from backend.config.settings import settings


class ChromaDBClient:
    """
    Singleton ChromaDB client with integrated SentenceTransformer embeddings.

    Usage:
        client = ChromaDBClient()
        client.add_chunks(chunks, document_id, metadata)
        results = client.search("pump seal failure", n_results=5)
    """
    _instance: "ChromaDBClient | None" = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self._init()

    def _init(self):
        logger.info(f"Connecting to ChromaDB at {settings.CHROMA_HOST}:{settings.CHROMA_PORT}...")
        try:
            self.client = chromadb.HttpClient(
                host=settings.CHROMA_HOST,
                port=settings.CHROMA_PORT,
            )
            self.client.heartbeat()
        except Exception as e:
            logger.warning(f"ChromaDB HttpClient connection fallback triggered: {e}")
            self.client = chromadb.PersistentClient(path="./data/chromadb")

        logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL}")
        self.embedder = SentenceTransformer(settings.EMBEDDING_MODEL)

        self.collection = self.client.get_or_create_collection(
            name=settings.CHROMA_COLLECTION_DOCUMENTS,
            metadata={"hnsw:space": "cosine"},
        )
        logger.success(
            f"ChromaDB ready — collection '{settings.CHROMA_COLLECTION_DOCUMENTS}' "
            f"has {self.collection.count()} documents"
        )

    # ------------------------------------------------------------------
    def add_chunks(
        self,
        chunks: list[dict],
        document_id: str,
        metadata: dict,
    ) -> int:
        """
        Embed and store document chunks.

        Returns number of chunks added.
        """
        if not chunks:
            return 0

        texts = [c["text"] for c in chunks]
        embeddings = self.embedder.encode(texts, show_progress_bar=False).tolist()

        ids = [f"{document_id}_chunk_{c['chunk_index']}" for c in chunks]
        metadatas = [
            {
                **metadata,
                "chunk_index": c.get("chunk_index", i),
                "word_count": c.get("word_count", 0),
            }
            for i, c in enumerate(chunks)
        ]

        # Add in batches of 100 to avoid memory spikes
        batch_size = 100
        for i in range(0, len(chunks), batch_size):
            self.collection.add(
                embeddings=embeddings[i:i+batch_size],
                documents=texts[i:i+batch_size],
                metadatas=metadatas[i:i+batch_size],
                ids=ids[i:i+batch_size],
            )

        logger.debug(f"Stored {len(chunks)} chunks for document {document_id}")
        return len(chunks)

    def search(
        self,
        query: str,
        n_results: int = 5,
        where: dict | None = None,
        min_relevance: float = 0.0,
    ) -> list[dict]:
        """
        Semantic search over stored document chunks.

        Returns:
            list of {text, metadata, relevance_score, rank}
        """
        embedding = self.embedder.encode([query]).tolist()

        kwargs: dict = {
            "query_embeddings": embedding,
            "n_results": min(n_results, max(1, self.collection.count())),
        }
        if where:
            kwargs["where"] = where

        results = self.collection.query(**kwargs)

        if not results["documents"] or not results["documents"][0]:
            return []

        output = []
        for i, (doc, meta, dist) in enumerate(zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
        )):
            relevance = round(1.0 - float(dist), 3)
            if relevance >= min_relevance:
                output.append({
                    "text": doc,
                    "metadata": meta,
                    "relevance_score": relevance,
                    "rank": i + 1,
                })

        return output

    def delete_document(self, document_id: str) -> int:
        """Delete all chunks for a document by ID prefix."""
        existing = self.collection.get(where={"document_id": document_id})
        if existing["ids"]:
            self.collection.delete(ids=existing["ids"])
            logger.info(f"Deleted {len(existing['ids'])} chunks for {document_id}")
            return len(existing["ids"])
        return 0

    def get_collection_stats(self) -> dict:
        return {
            "collection_name": settings.CHROMA_COLLECTION_DOCUMENTS,
            "total_chunks": self.collection.count(),
            "host": f"{settings.CHROMA_HOST}:{settings.CHROMA_PORT}",
        }
