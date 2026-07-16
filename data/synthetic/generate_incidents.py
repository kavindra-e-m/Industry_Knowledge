"""
generate_incidents.py
Generates realistic incident + near-miss reports for the plant (5-year window).
Outputs:
  - data/seeds/incidents.json
Owner: Member 4 — Data & DevOps Lead
"""

import csv
import json
import random
from datetime import date, datetime, time, timedelta
from pathlib import Path

random.seed(42)

EQUIPMENT_CSV = Path(__file__).parent.parent / "seeds" / "equipment_master.csv"
OUTPUT_JSON   = Path(__file__).parent.parent / "seeds" / "incidents.json"

# ── reference data ─────────────────────────────────────────────────────────────
INCIDENT_TYPES = [
    "Equipment Failure",
    "Process Deviation",
    "Near Miss",
    "Near Miss",
    "Near Miss",          # near-misses are most common
    "Unsafe Condition",
    "Unsafe Act",
    "Fire",
    "Spill / Release",
    "Electrical Incident",
    "Mechanical Injury",
    "Slips / Trips / Falls",
    "Pressure Exceedance",
    "Unplanned Shutdown",
]

SEVERITY_LEVELS = ["Critical", "High", "Medium", "Low", "Near Miss"]
SEVERITY_WEIGHTS= [3, 10, 25, 30, 32]

DEPARTMENTS = [
    "Operations",
    "Maintenance",
    "HSE",
    "Projects",
    "Instrumentation",
    "Utilities",
]

IMMEDIATE_CAUSES = [
    "Human error — incorrect valve alignment",
    "Human error — bypassed interlock",
    "Inadequate isolation before work",
    "Fatigue — night shift",
    "Communication failure during shift handover",
    "Use of incorrect spare part",
    "Exceeding design pressure during startup",
    "Corrosion-induced thinning — undetected",
    "Seal failure due to run-dry condition",
    "Overloaded pump — discharge valve partially closed",
    "Instrument calibration not performed",
    "Delayed maintenance — overdue PM",
    "Inadequate PPE usage",
    "Slippery walkway — hydrocarbon spill",
    "Electrical short — insulation degradation",
    "Relief valve chatter — fouled seat",
    "Loss of cooling water — fouled tubes",
    "Operator unfamiliar with new SOP revision",
    "Valve actuator failure — spring worn",
    "Combustible gas accumulation — ventilation inadequate",
]

ROOT_CAUSES = [
    "Inadequate maintenance procedures",
    "Training gap — procedure not followed",
    "Management of change (MOC) not implemented",
    "Design deficiency — insufficient corrosion allowance",
    "Inadequate hazard identification (HAZID/HAZOP gap)",
    "Procurement of substandard spare parts",
    "Ineffective work permit system",
    "No formal handover checklist",
    "Outdated SOPs not reflective of current plant state",
    "Lack of predictive maintenance program",
    "Absence of root cause analysis culture",
    "Insufficient inspection frequency for critical equipment",
    "Overreliance on reactive maintenance",
    "Poor housekeeping practices",
    "Inadequate lighting in work area",
]

CORRECTIVE_ACTIONS = [
    "Revise SOP and conduct refresher training for all operators.",
    "Implement formal MOC process for all P&ID changes.",
    "Increase PM frequency from annual to 6-monthly for critical equipment.",
    "Install double-block-and-bleed isolation on high-risk lines.",
    "Add vibration monitoring sensors to critical pumps.",
    "Enforce mandatory competency assessment before operating new equipment.",
    "Upgrade corrosion inhibitor dosing system and increase inspection frequency.",
    "Install automated gas detection and alarm system in confined spaces.",
    "Create digital isolation register with mandatory sign-off.",
    "Establish quarterly HAZOP review for modified sections.",
    "Replace substandard OEM part with approved equivalent and update spares list.",
    "Implement buddy system for all night-shift operations.",
    "Install slip-resistant grating on all elevated walkways.",
    "Conduct RCA training for all maintenance supervisors.",
    "Create near-miss reporting culture — monthly reward program.",
]

INVESTIGATORS = [
    "HSE Manager — Ramesh Nair",
    "Plant Manager — Sanjay Kulkarni",
    "Maintenance Superintendent — Arjun Desai",
    "Process Engineer — Meera Krishnan",
    "HSE Officer — Tanveer Ahmed",
]


def random_datetime(start: date, end: date) -> str:
    delta = (end - start).days
    d = start + timedelta(days=random.randint(0, delta))
    t = time(hour=random.randint(0, 23), minute=random.choice([0, 15, 30, 45]))
    return datetime.combine(d, t).isoformat()


def load_equipment_ids() -> list[str]:
    if not EQUIPMENT_CSV.exists():
        return [f"P-{i}" for i in range(101, 151)]
    with open(EQUIPMENT_CSV, newline="", encoding="utf-8") as f:
        return [row["equipment_id"] for row in csv.DictReader(f)]


def generate_incidents(equipment_ids: list[str], total: int = 180) -> list[dict]:
    incidents = []
    start_date = date(2020, 1, 1)
    end_date   = date(2025, 6, 30)

    for i in range(1, total + 1):
        inc_id      = f"INC-{2020 + (i % 6):04d}-{i:04d}"
        occurred_at = random_datetime(start_date, end_date)
        inc_type    = random.choice(INCIDENT_TYPES)
        severity    = random.choices(SEVERITY_LEVELS, weights=SEVERITY_WEIGHTS, k=1)[0]
        eq_id       = random.choice(equipment_ids)
        dept        = random.choice(DEPARTMENTS)
        imm_cause   = random.choice(IMMEDIATE_CAUSES)
        root_cause  = random.choice(ROOT_CAUSES)
        corr_action = random.choice(CORRECTIVE_ACTIONS)
        investigator= random.choice(INVESTIGATORS)

        # Injury / loss figures (mostly zero for near-misses)
        injuries    = 0 if severity in ("Near Miss", "Low") else random.randint(0, 3)
        lost_days   = 0 if injuries == 0 else random.randint(1, 30)
        prop_damage = 0 if severity == "Near Miss" else random.randint(0, 20_00_000)

        # Downtime hours
        downtime_hrs = 0.0
        if severity == "Critical":
            downtime_hrs = round(random.uniform(24, 240), 1)
        elif severity == "High":
            downtime_hrs = round(random.uniform(4, 48), 1)
        elif severity == "Medium":
            downtime_hrs = round(random.uniform(1, 12), 1)

        # Closed / open status
        closed = random.random() > 0.05
        closed_date = None
        if closed:
            occurred_dt = datetime.fromisoformat(occurred_at)
            closed_dt   = occurred_dt + timedelta(days=random.randint(3, 45))
            closed_date = closed_dt.date().isoformat()

        incidents.append({
            "incident_id":       inc_id,
            "occurred_at":       occurred_at,
            "closed_date":       closed_date,
            "incident_type":     inc_type,
            "severity":          severity,
            "equipment_id":      eq_id,
            "department":        dept,
            "location_detail":   f"Near {eq_id} — {random.choice(['north side', 'south side', 'access platform', 'ground level', 'control room'])}",
            "description":       f"{inc_type} involving {eq_id}. {imm_cause}.",
            "immediate_cause":   imm_cause,
            "root_cause":        root_cause,
            "corrective_action": corr_action,
            "investigator":      investigator,
            "injuries":          injuries,
            "lost_time_days":    lost_days,
            "property_damage_inr": prop_damage,
            "downtime_hours":    downtime_hrs,
            "repeat_incident":   random.random() < 0.12,
            "lessons_documented": closed,
            "regulatory_reportable": severity in ("Critical", "High") and injuries > 0,
        })

    incidents.sort(key=lambda x: x["occurred_at"])
    return incidents


def main() -> None:
    equipment_ids = load_equipment_ids()
    incidents = generate_incidents(equipment_ids, total=180)

    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(incidents, f, indent=2, ensure_ascii=False)

    print(f"[incidents] Written {len(incidents)} records → {OUTPUT_JSON}")


if __name__ == "__main__":
    main()
