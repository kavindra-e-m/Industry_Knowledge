"""
PostgreSQL client via SQLAlchemy — equipment and work order queries.
Owner: Member 1 — Backend & RAG Lead
"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from loguru import logger
from typing import Generator
from backend.config.settings import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency — yields a DB session and closes it after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class PostgresClient:
    """
    Helper for direct SQL queries without ORM models.
    Use for read-heavy operations where raw SQL is cleaner.
    """

    def __init__(self):
        self.engine = engine

    def execute(self, sql: str, params: dict | None = None) -> list[dict]:
        with self.engine.connect() as conn:
            result = conn.execute(text(sql), params or {})
            return [dict(row._mapping) for row in result]

    # ------------------------------------------------------------------
    # Equipment queries
    # ------------------------------------------------------------------

    def get_all_equipment(self) -> list[dict]:
        return self.execute("SELECT * FROM equipment ORDER BY equipment_id")

    def get_equipment(self, tag_id: str) -> dict | None:
        rows = self.execute(
            "SELECT * FROM equipment WHERE tag_id = :tag OR equipment_id = :tag LIMIT 1",
            {"tag": tag_id},
        )
        return rows[0] if rows else None

    def get_equipment_work_orders(self, tag_id: str, limit: int = 50) -> list[dict]:
        return self.execute(
            """
            SELECT * FROM work_orders
            WHERE equipment_tag = :tag
            ORDER BY completed_at DESC NULLS LAST
            LIMIT :limit
            """,
            {"tag": tag_id, "limit": limit},
        )

    def get_overdue_preventive_maintenance(self) -> list[dict]:
        return self.execute("""
            SELECT e.tag_id, e.name, e.equipment_type, e.criticality,
                   e.next_pm_due, e.location,
                   CURRENT_DATE - e.next_pm_due::date AS days_overdue
            FROM equipment e
            WHERE e.next_pm_due::date < CURRENT_DATE
              AND e.status = 'Active'
            ORDER BY days_overdue DESC
        """)

    def get_critical_equipment_at_risk(self) -> list[dict]:
        return self.execute("""
            SELECT tag_id, name, equipment_type, location,
                   failure_probability, health_score, criticality
            FROM equipment
            WHERE criticality IN ('Critical', 'High')
              AND failure_probability > 0.6
            ORDER BY failure_probability DESC
            LIMIT 20
        """)

    # ------------------------------------------------------------------
    # Incidents + compliance
    # ------------------------------------------------------------------

    def get_compliance_gaps(self) -> list[dict]:
        return self.execute("""
            SELECT * FROM compliance_checks
            WHERE overall_status IN ('non_compliant', 'partial')
            ORDER BY critical_gaps_count DESC, check_date DESC
        """)

    def save_compliance_result(self, result: dict):
        self.execute("""
            INSERT INTO compliance_checks
                (equipment_tag, compliance_score, overall_status, critical_gaps_count,
                 gaps_json, check_date)
            VALUES
                (:tag, :score, :status, :critical, :gaps, CURRENT_DATE)
            ON CONFLICT (equipment_tag) DO UPDATE SET
                compliance_score = :score,
                overall_status = :status,
                critical_gaps_count = :critical,
                gaps_json = :gaps,
                check_date = CURRENT_DATE
        """, {
            "tag": result["equipment_tag"],
            "score": result["compliance_score"],
            "status": result["overall_status"],
            "critical": result["critical_gaps_count"],
            "gaps": str(result.get("gaps", [])),
        })

    def health_check(self) -> bool:
        try:
            rows = self.execute("SELECT 1 AS ok")
            return rows[0]["ok"] == 1
        except Exception as e:
            logger.error(f"PostgreSQL health check failed: {e}")
            return False
