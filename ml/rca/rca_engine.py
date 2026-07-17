"""
RCA Engine — Root Cause Analysis using historical work order patterns.
Leverages real incident and work order data from data/seeds/.
Owner: Member 2 — ML & Document Intelligence Lead
"""
import json
from pathlib import Path
from collections import Counter
from loguru import logger


class RCAEngine:
    """
    Root Cause Analysis engine.

    Analyses historical work orders and incidents to:
    1. Find the most probable root cause for a given failure mode.
    2. Recommend corrective actions based on past successful fixes.
    3. Estimate repair duration and recurrence risk.
    """

    WORK_ORDERS_PATH = Path("data/seeds/work_orders.json")
    INCIDENTS_PATH = Path("data/seeds/incidents.json")

    def __init__(self):
        self.work_orders: list[dict] = []
        self.incidents: list[dict] = []
        self._load_data()

    def _load_data(self):
        if self.WORK_ORDERS_PATH.exists():
            with open(self.WORK_ORDERS_PATH) as f:
                self.work_orders = json.load(f)
            logger.success(f"RCA loaded {len(self.work_orders)} work orders")
        else:
            logger.warning("Work orders not found — RCA will use limited data")

        if self.INCIDENTS_PATH.exists():
            with open(self.INCIDENTS_PATH) as f:
                self.incidents = json.load(f)
            logger.success(f"RCA loaded {len(self.incidents)} incidents")
        else:
            logger.warning("Incidents not found — RCA will use work orders only")

    # ------------------------------------------------------------------
    def analyse(self, equipment_tag: str, failure_mode: str) -> dict:
        """
        Perform RCA for a given equipment + failure mode.

        Returns:
            {
                equipment_tag: str,
                failure_mode: str,
                most_probable_root_cause: str,
                confidence: float,
                similar_historical_cases: int,
                recommended_action: str,
                estimated_repair_duration_hours: float,
                parts_likely_needed: list[str],
                recurrence_risk: str,
                similar_work_orders: list[dict],
                similar_incidents: list[dict],
                lessons_learned: str,
            }
        """
        # Find similar work orders
        fm_lower = failure_mode.lower()
        similar_wos = [
            wo for wo in self.work_orders
            if (
                wo.get("equipment_tag") == equipment_tag or
                fm_lower in (wo.get("failure_mode") or "").lower() or
                fm_lower in (wo.get("description") or "").lower()
            )
        ]
        similar_wos.sort(key=lambda x: x.get("completed_at", ""), reverse=True)

        # Find similar incidents
        similar_incs = [
            inc for inc in self.incidents
            if (
                inc.get("equipment_tag") == equipment_tag or
                fm_lower in (inc.get("failure_mode") or "").lower() or
                any(t in fm_lower for t in (inc.get("pattern_tags") or []))
            )
        ]

        # Identify most common root cause
        root_causes = [wo.get("root_cause", "") for wo in similar_wos if wo.get("root_cause")]
        root_causes += [inc.get("root_cause", "") for inc in similar_incs if inc.get("root_cause")]
        top_cause_count = Counter(root_causes).most_common(1)
        most_probable = top_cause_count[0][0] if top_cause_count else "Inspection required to determine root cause."

        # Gather recommended actions
        recommended = ""
        if similar_wos:
            recommended = similar_wos[0].get("actions_taken", "")
        elif similar_incs:
            recommended = similar_incs[0].get("actions_taken", "")
        if not recommended:
            recommended = "Isolate equipment. Inspect for failure mode. Engage specialist if required."

        # Average repair duration
        durations = [
            float(wo.get("actual_duration_hours", 0))
            for wo in similar_wos
            if wo.get("actual_duration_hours")
        ]
        avg_duration = round(sum(durations) / len(durations), 1) if durations else 4.0

        # Parts from similar jobs
        parts: list[str] = []
        for wo in similar_wos[:5]:
            parts.extend(wo.get("parts_used", []))
        parts_unique = list(dict.fromkeys(parts))[:10]

        # Lessons learned
        lessons = ""
        if similar_incs:
            lessons = similar_incs[0].get("lessons_learned", "")

        total_cases = len(similar_wos) + len(similar_incs)
        confidence = round(min(0.95, 0.40 + total_cases * 0.06), 2)
        recurrence = "high" if total_cases >= 4 else "medium" if total_cases >= 2 else "low"

        return {
            "equipment_tag": equipment_tag,
            "failure_mode": failure_mode,
            "most_probable_root_cause": most_probable,
            "confidence": confidence,
            "similar_historical_cases": total_cases,
            "similar_work_orders": similar_wos[:5],
            "similar_incidents": similar_incs[:3],
            "recommended_action": recommended,
            "estimated_repair_duration_hours": avg_duration,
            "parts_likely_needed": parts_unique,
            "recurrence_risk": recurrence,
            "lessons_learned": lessons,
        }

    def get_equipment_failure_history(self, equipment_tag: str) -> dict:
        """Return full failure history summary for an equipment tag."""
        wos = [wo for wo in self.work_orders if wo.get("equipment_tag") == equipment_tag]
        incs = [inc for inc in self.incidents if inc.get("equipment_tag") == equipment_tag]

        emergency_wos = [wo for wo in wos if wo.get("work_type") == "emergency"]
        corrective_wos = [wo for wo in wos if wo.get("work_type") == "corrective"]
        preventive_wos = [wo for wo in wos if wo.get("work_type") == "preventive"]

        return {
            "equipment_tag": equipment_tag,
            "total_work_orders": len(wos),
            "emergency_count": len(emergency_wos),
            "corrective_count": len(corrective_wos),
            "preventive_count": len(preventive_wos),
            "incident_count": len(incs),
            "corrective_ratio": round(
                (len(emergency_wos) + len(corrective_wos)) / len(wos) if wos else 0, 2
            ),
            "last_work_order": wos[-1] if wos else None,
            "last_incident": incs[-1] if incs else None,
            "recurring_failure_modes": [
                {"failure_mode": k, "count": v}
                for k, v in Counter(
                    wo.get("failure_mode", "") for wo in emergency_wos + corrective_wos
                    if wo.get("failure_mode")
                ).most_common(5)
            ],
        }
