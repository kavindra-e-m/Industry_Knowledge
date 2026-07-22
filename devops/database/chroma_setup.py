"""
chroma_setup.py
Initialize ChromaDB collections for RAG vector store.
Owner: Member 4 — Data & DevOps Lead
"""

import chromadb
from chromadb.config import Settings

# ── Configuration ─────────────────────────────────────────────────────────────
CHROMA_HOST = "chromadb"  # Docker service name
CHROMA_PORT = 8000
COLLECTION_NAME = "industrial_documents"

# Distance metrics: "l2" (Euclidean), "ip" (inner product), "cosine"
DISTANCE_METRIC = "cosine"

# Embedding dimensions (adjust based on your embedding model)
# Sentence Transformers all-MiniLM-L6-v2 → 384 dimensions
# Sentence Transformers all-mpnet-base-v2 → 768 dimensions
EMBEDDING_DIM = 384


def init_chromadb_collections():
    """
    Initialize ChromaDB collections for document ingestion.
    Called during setup phase before any document ingestion.
    """
    print("[chroma_setup] Connecting to ChromaDB...")
    client = chromadb.HttpClient(
        host=CHROMA_HOST,
        port=CHROMA_PORT,
        settings=Settings(allow_reset=True, anonymized_telemetry=False)
    )

    # Delete existing collection if exists (clean start)
    try:
        client.delete_collection(name=COLLECTION_NAME)
        print(f"[chroma_setup] Deleted existing collection: {COLLECTION_NAME}")
    except Exception:
        pass

    # Create collection with metadata schema
    collection = client.create_collection(
        name=COLLECTION_NAME,
        metadata={
            "description": "Industrial knowledge base — manuals, procedures, maintenance logs, P&IDs",
            "distance_metric": DISTANCE_METRIC,
            "embedding_dimension": EMBEDDING_DIM,
        }
    )

    print(f"[chroma_setup] Created collection: {COLLECTION_NAME}")
    print(f"[chroma_setup]   Distance metric: {DISTANCE_METRIC}")
    print(f"[chroma_setup]   Embedding dimension: {EMBEDDING_DIM}")

    # Define metadata schema expectations (for documentation purposes)
    metadata_schema = {
        "doc_id":          "str — unique document identifier",
        "doc_type":        "str — manual | procedure | inspection | maintenance_log | pid | email",
        "equipment_id":    "str — associated equipment tag (if applicable)",
        "source_file":     "str — original file path",
        "chunk_id":        "str — unique chunk identifier",
        "page_number":     "int — page number in source document (if applicable)",
        "date":            "str — document date (ISO 8601)",
        "author":          "str — document author",
        "title":           "str — document title",
        "regulation_refs": "list[str] — referenced regulation clause IDs",
    }

    print("\n[chroma_setup] Expected metadata schema:")
    for key, desc in metadata_schema.items():
        print(f"  {key:20s} → {desc}")

    # Insert a dummy document to verify collection works
    collection.add(
        ids=["test-doc-001"],
        documents=["This is a test document for ChromaDB initialization."],
        metadatas=[{
            "doc_id": "TEST-001",
            "doc_type": "test",
            "source_file": "test.txt",
            "chunk_id": "test-doc-001-chunk-0",
        }]
    )
    print("\n[chroma_setup] Inserted test document successfully.")

    # Verify retrieval
    results = collection.query(
        query_texts=["test document"],
        n_results=1
    )
    print(f"[chroma_setup] Test query results: {results['ids']}")

    # Delete test document
    collection.delete(ids=["test-doc-001"])
    print("[chroma_setup] Deleted test document.")

    print("\n[chroma_setup] ✅ ChromaDB initialization complete.")
    print(f"[chroma_setup] Collection ready: {COLLECTION_NAME}")


if __name__ == "__main__":
    init_chromadb_collections()
