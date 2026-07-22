from fastapi import APIRouter
from backend.database.chromadb_client import ChromaDBClient
from backend.database.neo4j_client import Neo4jClient
from backend.config.settings import settings
import psycopg2
import redis as redis_lib

router = APIRouter()


@router.get("/system/status")
async def system_status():
    status = {}

    # PostgreSQL check
    try:
        conn = psycopg2.connect(settings.DATABASE_URL)
        conn.close()
        status["postgres"] = "connected"
    except Exception as e:
        status["postgres"] = f"error: {str(e)}"

    # Neo4j check
    try:
        neo4j = Neo4jClient()
        neo4j.run("RETURN 1")
        status["neo4j"] = "connected"
    except Exception as e:
        status["neo4j"] = f"error: {str(e)}"

    # ChromaDB check
    try:
        chroma = ChromaDBClient()
        chroma.client.heartbeat()
        status["chromadb"] = "connected"
    except Exception as e:
        status["chromadb"] = f"error: {str(e)}"

    # Redis check
    try:
        r = redis_lib.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT)
        r.ping()
        status["redis"] = "connected"
    except Exception as e:
        status["redis"] = f"error: {str(e)}"

    # Gemini check
    status["gemini"] = "configured" if settings.GEMINI_API_KEY else "missing API key"

    overall = "healthy" if all(
        v == "connected" or v == "configured"
        for v in status.values()
    ) else "degraded"

    return {"overall": overall, **status}
