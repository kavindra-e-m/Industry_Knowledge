"""
Central config - env vars for DB connections, LLM keys, etc.
Owner: Member 1
"""
import os

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "ps08password")

CHROMA_HOST = os.getenv("CHROMA_HOST", "localhost")
CHROMA_PORT = int(os.getenv("CHROMA_PORT", 8000))

POSTGRES_URL = os.getenv("POSTGRES_URL", "postgresql://ps08:ps08pass@localhost:5432/ps08")

LLM_API_KEY = os.getenv("LLM_API_KEY", "")
