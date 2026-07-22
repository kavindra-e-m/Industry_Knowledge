"""
Compliance Checker — checks equipment against OISD, Factories Act, PESO regulations.
Owner: Member 2 — ML & Document Intelligence Lead
"""
import json
from datetime import datetime, timedelta
from pathlib import Path
from loguru import logger


class ComplianceChecker:
    """
    Checks equipment compliance against Indian industrial regulations.

    Uses data/seeds/regulation_clauses.json to determine:
    - Which regulations apply to each equipment type
    - Required inspection intervals
    - Whether inspections are overdue
    - Gap severity and corrective action
    """

    REGULATIONS_PATH = Path("data/seeds/regulation_clauses.json")
    WORK_ORDERS_PATH = Path("data/seeds/work_orders.json")

    def __init__(self):
        self.regulations: list[dict] = []
        self.work_orders: list[dict] = []
        self._load_data()

    def _load_data(self):
        if self.REGULATIONS_PATH.exists():
            with open(self.REGULATIONS_PATH) as f:
                data = json.load(f)
                if isinstance(data, list):
                    self.regulations = data
                elif isinstance(data, dict):
                    self.regulations = data.get("regulations", [])
                else:
                    self.regulations = []
            logger.success(f"Loaded {len(self.regulations)} regulation clauses")
        else:
            logger.warning("regulation_clauses.json not found")

        if self.WORK_ORDERS_PATH.exists():
            with open(self.WORK_ORDERS_PATH) as f:
                self.work_orders = json.load(f)

    # ------------------------------------------------------------------
    def check_equipment(
        self,
        equipment: dict,
        additional_records: list[dict] | None = None,
    ) -> dict:
        """
        Run compliance check for a single equipment record.

        Args:
            equipment: dict with at minimum:
                - tag_id or equipment_id: str
                - equipment_type: str
                - criticality: str (Critical/High/Medium/Low)
            additional_records: extra inspection records to merge with work orders

        Returns compliance report dict.
        """
        tag = equipment.get("tag_id") or equipment.get("equipment_id") or "UNKNOWN"
        eq_type = equipment.get("equipment_type", "")

        # Find applicable regulations
        applicable = [
            r for r in self.regulations
            if (
                eq_type in r.get("applicability", []) or
                "all" in r.get("applicability", [])
            )
        ]

        # Merge records
        records = list(self.work_orders)
        if additional_records:
            records.extend(additional_records)

        # Check each regulation
        gaps = []
        passed = []
        for reg in applicable:
            gap = self._check_regulation(tag, reg, records)
            if gap:
                gaps.append(gap)
            else:
                passed.append(reg["clause_id"])

        total = len(applicable)
        critical_gaps = [g for g in gaps if g.get("severity") == "critical"]
        major_gaps = [g for g in gaps if g.get("severity") == "major"]

        score = round((total - len(gaps)) / total * 100 if total > 0 else 100.0, 1)

        if critical_gaps:
            overall_status = "non_compliant"
        elif major_gaps:
            overall_status = "partial"
        elif gaps:
            overall_status = "partial"
        else:
            overall_status = "compliant"

        return {
            "equipment_tag": tag,
            "equipment_type": eq_type,
            "criticality": equipment.get("criticality", "Unknown"),
            "compliance_score": score,
            "overall_status": overall_status,
            "total_regulations_checked": total,
            "passed_count": len(passed),
            "gaps_count": len(gaps),
            "critical_gaps_count": len(critical_gaps),
            "major_gaps_count": len(major_gaps),
            "gaps": gaps,
            "passed_clauses": passed,
            "check_date": datetime.now().strftime("%Y-%m-%d"),
        }

    def check_plant_compliance(self, equipment_list: list[dict]) -> dict:
        """Run compliance check across all equipment and aggregate results."""
        results = []
        for eq in equipment_list:
            results.append(self.check_equipment(eq))

        non_compliant = [r for r in results if r["overall_status"] == "non_compliant"]
        partial = [r for r in results if r["overall_status"] == "partial"]
        compliant = [r for r in results if r["overall_status"] == "compliant"]
        avg_score = round(sum(r["compliance_score"] for r in results) / len(results), 1) if results else 0

        return {
            "summary": {
                "total_equipment": len(results),
                "non_compliant": len(non_compliant),
                "partial_compliant": len(partial),
                "fully_compliant": len(compliant),
                "average_compliance_score": avg_score,
                "total_critical_gaps": sum(r["critical_gaps_count"] for r in results),
            },
            "critical_equipment": [r for r in non_compliant if r["criticality"] == "Critical"],
            "results": results,
            "check_date": datetime.now().strftime("%Y-%m-%d"),
        }

    # ------------------------------------------------------------------
    def _check_regulation(self, tag: str, reg: dict, records: list[dict]) -> dict | None:
        interval_months = reg.get("inspection_interval_months")
        if not interval_months:
            return None

        last_inspection = self._get_last_inspection(tag, records)

        # No inspection record at all
        if not last_inspection:
            return {
                "regulation_source": reg["source"],
                "clause_id": reg["clause_id"],
                "requirement": reg["title"],
                "gap_description": (
                    f"No inspection record found for {tag}. "
                    f"Required every {interval_months} months per {reg['source']} {reg['clause_id']}."
                ),
                "gap_type": "missing_record",
                "severity": reg.get("severity_if_violated", "major"),
                "corrective_action": reg.get("corrective_action", "Schedule inspection immediately."),
                "legal_consequence": reg.get("legal_consequence", ""),
            }

        # Check if overdue
        due_date = last_inspection + timedelta(days=interval_months * 30.44)
        overdue_days = (datetime.now() - due_date).days

        if overdue_days > 0:
            return {
                "regulation_source": reg["source"],
                "clause_id": reg["clause_id"],
                "requirement": reg["title"],
                "gap_description": (
                    f"Inspection overdue by {overdue_days} days. "
                    f"Last inspection: {last_inspection.strftime('%Y-%m-%d')}. "
                    f"Due: {due_date.strftime('%Y-%m-%d')}. "
                    f"Required every {interval_months} months per {reg['source']} {reg['clause_id']}."
                ),
                "gap_type": "overdue",
                "severity": reg.get("severity_if_violated", "major"),
                "last_inspection": last_inspection.strftime("%Y-%m-%d"),
                "due_date": due_date.strftime("%Y-%m-%d"),
                "overdue_days": overdue_days,
                "corrective_action": reg.get("corrective_action", "Schedule inspection immediately."),
                "legal_consequence": reg.get("legal_consequence", ""),
            }

        return None  # Compliant

    def _get_last_inspection(self, tag: str, records: list[dict]) -> datetime | None:
        """Find the most recent inspection date for a tag from all records."""
        dates: list[datetime] = []
        date_fields = ["completed_at", "inspection_date", "scheduled_date"]

        for record in records:
            if record.get("equipment_tag") != tag:
                continue
            for field in date_fields:
                val = record.get(field)
                if not val:
                    continue
                try:
                    clean = str(val).split("T")[0].split("+")[0].replace("Z", "")
                    dates.append(datetime.fromisoformat(clean))
                except (ValueError, TypeError):
                    pass

        return max(dates) if dates else None
