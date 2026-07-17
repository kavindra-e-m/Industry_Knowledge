"""
IndustrialBrain — FastAPI application entrypoint.
Wires all routes, CORS, auth, and startup events.
Owner: Member 1 — Backend & RAG Lead
"""
from contextlib import asynccontextmanager
from loguru import logger

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import HTTPException

from backend.config.settings import settings
from backend.api.middleware.auth import (
    authenticate_user,
    create_access_token,
    Token,
    get_current_user,
    User,
)

# Route imports
from backend.api.routes import (
    ingest,
    query,
    maintenance,
    compliance,
    lessons,
    pid,
    knowledge_graph,
    stream,
)


# ---------------------------------------------------------------------------
# Startup / Shutdown lifecycle
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize services on startup; clean up on shutdown."""
    logger.info("=" * 60)
    logger.info(f"Starting {settings.APP_NAME}...")

    # Ensure Neo4j graph is seeded on first boot
    try:
        from backend.knowledge_graph.graph_builder import GraphBuilder
        builder = GraphBuilder()
        builder.ensure_graph_initialized()
        logger.success("Knowledge graph ready")
    except Exception as e:
        logger.warning(f"Graph initialization skipped (services may not be up yet): {e}")

    logger.success(f"{settings.APP_NAME} started — API docs at http://localhost:{settings.APP_PORT}/docs")
    logger.info("=" * 60)

    yield

    logger.info(f"Shutting down {settings.APP_NAME}...")


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(
    title="IndustrialBrain API",
    description=(
        "AI-powered Industrial Knowledge Intelligence Platform. "
        "RAG + Knowledge Graph + 6 Specialist Agents. "
        "Hackathon: ET AI 2026 — Problem Statement 08."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow frontend on any port during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten to frontend origin before production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Auth routes (not prefixed — standard OAuth2 flow)
# ---------------------------------------------------------------------------
@app.post("/api/auth/login", response_model=Token, tags=["auth"])
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Obtain a JWT access token.

    Demo credentials:
    - admin / admin123 (Plant Manager)
    - engineer / eng123 (Maintenance Engineer)
    - technician / tech123 (Field Technician)
    """
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_access_token({"sub": user["username"], "role": user["role"]})
    return Token(
        access_token=token,
        token_type="bearer",
        expires_in=settings.JWT_EXPIRE_MINUTES * 60,
        user={
            "username": user["username"],
            "full_name": user["full_name"],
            "role": user["role"],
        },
    )


@app.get("/api/auth/me", tags=["auth"])
async def get_me(current_user: User | None = Depends(get_current_user)):
    """Return current authenticated user info."""
    if not current_user:
        return {"authenticated": False}
    return {"authenticated": True, "user": current_user.model_dump()}


# ---------------------------------------------------------------------------
# API Routes
# ---------------------------------------------------------------------------
app.include_router(ingest.router,          prefix="/api/ingest",      tags=["📄 Ingestion"])
app.include_router(query.router,           prefix="/api/query",        tags=["🤖 Query"])
app.include_router(maintenance.router,     prefix="/api/maintenance",  tags=["🔧 Maintenance"])
app.include_router(compliance.router,      prefix="/api/compliance",   tags=["✅ Compliance"])
app.include_router(lessons.router,         prefix="/api/lessons",      tags=["📚 Lessons Learned"])
app.include_router(pid.router,             prefix="/api/pid",          tags=["📐 P&ID"])
app.include_router(knowledge_graph.router, prefix="/api/graph",        tags=["🗺️ Knowledge Graph"])
app.include_router(stream.router,          prefix="/api/stream",       tags=["⚡ Real-time Stream"])


# ---------------------------------------------------------------------------
# Health + System
# ---------------------------------------------------------------------------
@app.get("/health", tags=["system"])
async def health_check():
    """Service health — quick check for load balancer / uptime monitor."""
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "version": "1.0.0",
        "environment": "development",
    }


@app.get("/api/system/status", tags=["system"])
async def system_status():
    """Detailed status of all connected services."""
    status = {
        "api": "ok",
        "chromadb": "unknown",
        "neo4j": "unknown",
        "postgres": "unknown",
        "redis": "unknown",
        "gemini_configured": bool(settings.GEMINI_API_KEY),
    }

    # ChromaDB
    try:
        from backend.database.chromadb_client import ChromaDBClient
        chroma = ChromaDBClient()
        stats = chroma.get_collection_stats()
        status["chromadb"] = f"ok — {stats['total_chunks']} chunks"
    except Exception as e:
        status["chromadb"] = f"error: {str(e)[:50]}"

    # Neo4j
    try:
        from backend.database.neo4j_client import Neo4jClient
        neo4j = Neo4jClient()
        graph = neo4j.get_graph_stats()
        eq_count = graph.get("nodes", {}).get("Equipment", 0)
        status["neo4j"] = f"ok — {eq_count} equipment nodes"
    except Exception as e:
        status["neo4j"] = f"error: {str(e)[:50]}"

    # PostgreSQL
    try:
        from backend.database.postgres_client import PostgresClient
        pg = PostgresClient()
        ok = pg.health_check()
        status["postgres"] = "ok" if ok else "error: health check failed"
    except Exception as e:
        status["postgres"] = f"error: {str(e)[:50]}"

    # Redis
    try:
        import redis
        r = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, socket_timeout=2)
        r.ping()
        status["redis"] = "ok"
    except Exception as e:
        status["redis"] = f"error: {str(e)[:50]}"

    overall = "ok" if all("ok" in str(v) for v in status.values()) else "degraded"
    status["overall"] = overall
    return status


@app.get("/api/endpoints", tags=["system"])
async def list_endpoints():
    """List all available API endpoints."""
    return {
        "endpoints": [
            {"method": route.methods, "path": route.path, "name": route.name}
            for route in app.routes
            if hasattr(route, "methods")
        ]
    }
