from fastapi import APIRouter
from backend.config.settings import settings

router = APIRouter()


@router.get("/system/status")
async def system_status():
    status = {}
    try:
        import psycopg2

        conn = psycopg2.connect(settings.DATABASE_URL)
        conn.close()
        status["postgres"] = "connected"
    except Exception as e:
        status["postgres"] = f"error: {str(e)[:60]}"

    try:
        from backend.database.neo4j_client import Neo4jClient

        Neo4jClient().run("RETURN 1")
        status["neo4j"] = "connected"
    except Exception as e:
        status["neo4j"] = f"error: {str(e)[:60]}"

    try:
        from backend.database.chromadb_client import ChromaDBClient

        ChromaDBClient().client.heartbeat()
        status["chromadb"] = "connected"
    except Exception as e:
        status["chromadb"] = f"error: {str(e)[:60]}"

    try:
        import redis as redis_lib

        r = redis_lib.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT)
        r.ping()
        status["redis"] = "connected"
    except Exception as e:
        status["redis"] = f"error: {str(e)[:60]}"

    status["gemini"] = "configured" if settings.GEMINI_API_KEY else "missing — set GEMINI_API_KEY in .env"
    overall = "healthy" if all(v in ["connected", "configured"] for v in status.values()) else "degraded"
    return {"overall": overall, **status}
