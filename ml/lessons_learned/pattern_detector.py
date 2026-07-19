"""
Pattern Detector — mines incident history for recurring failure patterns.
Issues proactive warnings when similar conditions match past incidents.
Owner: Member 2 — ML & Document Intelligence Lead
"""
import json
from collections import Counter, defaultdict
from pathlib import Path
from loguru import logger


class PatternDetector:
    """
    Lessons Learned engine — detects recurring failure patterns in incident history.

    Capabilities:
    1. Identify equipment with repeat failures.
    2. Find shared root causes across equipment types.
    3. Issue proactive warnings based on pattern matching.
    4. Surface relevant lessons learned when a new work order is raised.
    """

    INCIDENTS_PATH = Path("data/seeds/incidents.json")
    WORK_ORDERS_PATH = Path("data/seeds/work_orders.json")

    def __init__(self):
        self.incidents: list[dict] = []
        self.work_orders: list[dict] = []
        self.patterns: dict = {}
        self._load_data()
        self._build_patterns()

    # ------------------------------------------------------------------
    def _load_data(self):
        if self.INCIDENTS_PATH.exists():
            with open(self.INCIDENTS_PATH) as f:
                self.incidents = json.load(f)
            logger.success(f"PatternDetector: loaded {len(self.incidents)} incidents")
        else:
            logger.warning("incidents.json not found — limited pattern detection")

        if self.WORK_ORDERS_PATH.exists():
            with open(self.WORK_ORDERS_PATH) as f:
                self.work_orders = json.load(f)

    def _build_patterns(self):
        """Pre-compute pattern indexes for fast lookup."""
        # Equipment → list of incidents
        equip_incidents: dict[str, list[dict]] = defaultdict(list)
        for inc in self.incidents:
            tag = inc.get("equipment_tag", "")
            if tag:
                equip_incidents[tag].append(inc)

        # Equipment → list of work orders (non-preventive)
        equip_wos: dict[str, list[dict]] = defaultdict(list)
        for wo in self.work_orders:
            if wo.get("work_type") in ("emergency", "corrective"):
                equip_wos[wo.get("equipment_tag", "")].append(wo)

        # Root cause → frequency
        root_cause_counter = Counter(
            inc.get("root_cause", "") for inc in self.incidents if inc.get("root_cause")
        )

        # Location → incident count
        location_counter = Counter(
            inc.get("location", "") for inc in self.incidents if inc.get("location")
        )

        # Pattern tag → incidents
        tag_incidents: dict[str, list[dict]] = defaultdict(list)
        for inc in self.incidents:
            for tag in inc.get("pattern_tags", []):
                tag_incidents[tag].append(inc)

        self.patterns = {
            "equipment_incidents": dict(equip_incidents),
            "equipment_wos": dict(equip_wos),
            "root_cause_frequency": root_cause_counter,
            "high_risk_locations": [
                {"location": loc, "incident_count": cnt}
                for loc, cnt in location_counter.most_common(10)
                if cnt >= 2
            ],
            "pattern_tag_index": dict(tag_incidents),
        }

        logger.success(
            f"Patterns built: {len(equip_incidents)} equipment tracked, "
            f"{len(tag_incidents)} failure patterns indexed"
        )

    # ------------------------------------------------------------------
    def check_for_warnings(
        self,
        equipment_tag: str,
        current_conditions: dict | None = None,
    ) -> list[dict]:
        """
        Check if an equipment tag matches any recurring failure patterns.

        Returns list of warnings (empty = no patterns found).
        """
        warnings: list[dict] = []
        incidents = self.patterns.get("equipment_incidents", {}).get(equipment_tag, [])
        wos = self.patterns.get("equipment_wos", {}).get(equipment_tag, [])

        # --- Warning 1: Recurring incidents ---
        if len(incidents) >= 2:
            causes = Counter(inc.get("root_cause", "") for inc in incidents if inc.get("root_cause"))
            top_cause, top_count = causes.most_common(1)[0] if causes else ("unknown", 1)

            recent_inc = sorted(incidents, key=lambda x: x.get("occurred_at", ""), reverse=True)[0]
            warnings.append({
                "warning_type": "recurring_failure_pattern",
                "equipment_tag": equipment_tag,
                "severity": "high",
                "title": f"⚠️ Recurring failure pattern detected on {equipment_tag}",
                "description": (
                    f"{equipment_tag} has {len(incidents)} recorded incidents. "
                    f"Most common root cause: '{top_cause}' (appears {top_count} times). "
                    f"Last incident: {recent_inc.get('incident_number', 'N/A')} on "
                    f"{str(recent_inc.get('occurred_at', ''))[:10]}."
                ),
                "recommended_action": (
                    f"Proactive inspection recommended. Focus on: {top_cause}. "
                    f"Lessons learned: {recent_inc.get('lessons_learned', 'See incident report.')}"
                ),
                "incident_references": [inc.get("incident_number") for inc in incidents],
            })

        # --- Warning 2: High emergency work order ratio ---
        if len(wos) >= 3:
            warnings.append({
                "warning_type": "high_corrective_ratio",
                "equipment_tag": equipment_tag,
                "severity": "medium",
                "title": f"📊 High corrective maintenance rate on {equipment_tag}",
                "description": (
                    f"{equipment_tag} has {len(wos)} corrective/emergency work orders. "
                    "This indicates the equipment may not be responding to preventive maintenance."
                ),
                "recommended_action": (
                    "Review PM strategy. Consider increasing PM frequency. "
                    "Evaluate for condition-based maintenance or equipment replacement."
                ),
            })

        return warnings

    def get_warning_for_new_work_order(
        self,
        equipment_tag: str,
        failure_mode: str,
        description: str = "",
    ) -> dict | None:
        """
        When a new work order is raised, check if similar past incidents exist.
        Returns the most relevant lesson learned, or None.
        """
        fm_lower = failure_mode.lower()
        desc_lower = description.lower()

        # Search by pattern tags
        matched_incidents: list[dict] = []
        for tag_key, tag_incidents in self.patterns.get("pattern_tag_index", {}).items():
            if tag_key in fm_lower or tag_key in desc_lower:
                matched_incidents.extend(tag_incidents)

        # Search by equipment
        matched_incidents.extend(
            self.patterns.get("equipment_incidents", {}).get(equipment_tag, [])
        )

        if not matched_incidents:
            return None

        # Sort by recency and pick best match
        matched_incidents.sort(key=lambda x: x.get("occurred_at", ""), reverse=True)
        best = matched_incidents[0]

        return {
            "source": "lessons_learned",
            "incident_number": best.get("incident_number", ""),
            "title": f"📚 Lesson from {best.get('incident_number', 'past incident')}",
            "occurred_at": str(best.get("occurred_at", ""))[:10],
            "equipment_tag": best.get("equipment_tag", ""),
            "root_cause": best.get("root_cause", ""),
            "lessons_learned": best.get("lessons_learned", ""),
            "actions_taken": best.get("actions_taken", ""),
            "message": (
                f"Similar incident on {str(best.get('occurred_at', ''))[:10]}: "
                f"{best.get('lessons_learned', '')}"
            ),
        }

    def get_systemwide_patterns(self) -> dict:
        """Return plant-wide pattern summary for dashboard."""
        return {
            "high_risk_locations": self.patterns.get("high_risk_locations", []),
            "top_root_causes": [
                {"cause": cause, "frequency": count}
                for cause, count in self.patterns.get("root_cause_frequency", Counter()).most_common(10)
                if cause
            ],
            "most_problematic_equipment": [
                {
                    "equipment_tag": tag,
                    "incident_count": len(incs),
                    "last_incident": sorted(incs, key=lambda x: x.get("occurred_at", ""), reverse=True)[0].get("incident_number"),
                }
                for tag, incs in sorted(
                    self.patterns.get("equipment_incidents", {}).items(),
                    key=lambda x: len(x[1]),
                    reverse=True,
                )[:10]
                if len(incs) >= 2
            ],
        }
