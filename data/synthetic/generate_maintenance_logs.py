"""
generate_maintenance_logs.py
Generates 5-year maintenance event history for all equipment.
Outputs:
  - data/seeds/maintenance_logs.json   (consumed by seed_db.sh → Postgres)
Owner: Member 4 — Data & DevOps Lead
"""

import csv
import json
import random
from datetime import date, timedelta
from pathlib import Path

random.seed(42)

EQUIPMENT_CSV = Path(__file__).parent.parent / "seeds" / "equipment_master.csv"
OUTPUT_JSON   = Path(__file__).parent.parent / "seeds" / "maintenance_logs.json"

# ── reference tables ──────────────────────────────────────────────────────────
MAINTENANCE_TYPES = [
    "Preventive Maintenance",
    "Corrective Maintenance",
    "Predictive Maintenance",
    "Condition-Based Maintenance",
    "Emergency Repair",
    "Overhaul",
    "Inspection",
    "Lubrication Service",
    "Calibration",
    "Pressure Test",
]

FAILURE_MODES = [
    "Bearing failure",
    "Mechanical seal leakage",
    "Impeller erosion",
    "Cavitation",
    "Vibration — misalignment",
    "Vibration — imbalance",
    "Tube fouling",
    "Tube leak",
    "Corrosion / pitting",
    "Gasket blow-out",
    "Valve packing leak",
    "Instrument drift",
    "Overheating",
    "Electrical fault",
    "Coupling failure",
    "Fatigue crack",
    "Blockage / plugging",
    "Normal wear",
    None,   # no failure — scheduled PM
    None,
    None,
]

TECHNICIANS = [
    "Rajesh Kumar",
    "Sunita Sharma",
    "Mohammed Irfan",
    "Priya Menon",
    "Arvind Singh",
    "Deepa Nair",
    "Karthik Rajan",
    "Fatima Sheikh",
    "Suresh Patel",
    "Anita Joshi",
]

SPARE_PARTS = [
    "Mechanical Seal Kit",
    "Bearing Set (DE+NDE)",
    "Gasket Set",
    "Impeller",
    "Coupling Insert",
    "O-Ring Kit",
    "Packing Rings",
    "Pressure Gauge",
    "Flow Indicator",
    "Valve Trim Set",
    "Lube Oil Filter",
    "V-Belt Set",
    "Motor Winding",
    "Thermowell",
    "None",
]

WORK_STATUSES = ["Completed", "Completed", "Completed", "Deferred", "Partially Completed"]


def random_date_in_range(start: date, end: date) -> date:
    delta = (end - start).days
    if delta <= 0:
        return start
    return start + timedelta(days=random.randint(0, delta))


def duration_hours(maintenance_type: str) -> float:
    ranges = {
        "Preventive Maintenance":     (2, 8),
        "Corrective Maintenance":     (4, 24),
        "Predictive Maintenance":     (1, 4),
        "Condition-Based Maintenance":(1, 6),
        "Emergency Repair":           (2, 48),
        "Overhaul":                   (24, 120),
        "Inspection":                 (1, 4),
        "Lubrication Service":        (0.5, 2),
        "Calibration":                (1, 3),
        "Pressure Test":              (2, 8),
    }
    lo, hi = ranges.get(maintenance_type, (1, 8))
    return round(random.uniform(lo, hi), 1)


def cost_inr(maintenance_type: str, parts_used: str) -> int:
    base = {
        "Preventive Maintenance":     (5_000,  30_000),
        "Corrective Maintenance":     (15_000, 1_50_000),
        "Predictive Maintenance":     (2_000,  10_000),
        "Condition-Based Maintenance":(5_000,  40_000),
        "Emergency Repair":           (50_000, 5_00_000),
        "Overhaul":                   (2_00_000, 20_00_000),
        "Inspection":                 (1_000,  8_000),
        "Lubrication Service":        (500,    3_000),
        "Calibration":                (2_000,  12_000),
        "Pressure Test":              (5_000,  25_000),
    }
    lo, hi = base.get(maintenance_type, (1_000, 50_000))
    parts_premium = 0 if parts_used == "None" else random.randint(2_000, 30_000)
    return random.randint(lo, hi) + parts_premium


def load_equipment_ids() -> list[str]:
    if not EQUIPMENT_CSV.exists():
        # fallback sample if CSV not yet generated
        return [f"P-{i}" for i in range(101, 151)] + [f"E-{i}" for i in range(101, 121)]
    with open(EQUIPMENT_CSV, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return [row["equipment_id"] for row in reader]


def generate_logs_for_equipment(equipment_id: str, years: int = 5) -> list[dict]:
    logs = []
    history_start = date(2020, 1, 1)
    history_end   = date(2025, 6, 30)

    # Scheduled PM every 6 months on average
    pm_interval = timedelta(days=random.randint(120, 210))
    current_pm  = history_start + timedelta(days=random.randint(0, 60))

    while current_pm <= history_end:
        m_type  = random.choice(["Preventive Maintenance", "Inspection", "Lubrication Service"])
        failure = None   # scheduled — no failure
        parts   = random.choice(SPARE_PARTS)
        status  = random.choices(WORK_STATUSES, weights=[70, 70, 70, 10, 5], k=1)[0]

        logs.append(_build_record(equipment_id, current_pm, m_type, failure, parts, status))
        current_pm += pm_interval + timedelta(days=random.randint(-15, 15))

    # Sprinkle 0–4 unscheduled corrective / emergency events
    n_corrective = random.randint(0, 4)
    for _ in range(n_corrective):
        event_date = random_date_in_range(history_start, history_end)
        m_type  = random.choice(["Corrective Maintenance", "Emergency Repair"])
        failure = random.choice([f for f in FAILURE_MODES if f is not None])
        parts   = random.choice(SPARE_PARTS)
        status  = random.choices(WORK_STATUSES, weights=[80, 80, 80, 5, 10], k=1)[0]
        logs.append(_build_record(equipment_id, event_date, m_type, failure, parts, status))

    logs.sort(key=lambda x: x["maintenance_date"])
    return logs


def _build_record(
    equipment_id: str,
    event_date: date,
    m_type: str,
    failure_mode: str | None,
    parts_used: str,
    status: str,
) -> dict:
    hours = duration_hours(m_type)
    cost  = cost_inr(m_type, parts_used)
    tech  = random.choice(TECHNICIANS)

    observations = []
    if failure_mode:
        observations.append(f"Failure observed: {failure_mode}.")
    if parts_used != "None":
        observations.append(f"Replaced: {parts_used}.")
    if status == "Deferred":
        observations.append("Work deferred due to operational constraints. Follow-up scheduled.")
    if not observations:
        observations.append("Routine maintenance completed. No abnormalities observed.")

    return {
        "log_id":              f"ML-{random.randint(100000, 999999)}",
        "equipment_id":        equipment_id,
        "maintenance_date":    event_date.isoformat(),
        "maintenance_type":    m_type,
        "failure_mode":        failure_mode,
        "technician":          tech,
        "duration_hours":      hours,
        "parts_used":          parts_used if parts_used != "None" else None,
        "cost_inr":            cost,
        "status":              status,
        "observations":        " ".join(observations),
        "next_due_date":       (event_date + timedelta(days=random.randint(180, 365))).isoformat(),
    }


def main() -> None:
    equipment_ids = load_equipment_ids()
    all_logs: list[dict] = []

    for eq_id in equipment_ids:
        all_logs.extend(generate_logs_for_equipment(eq_id))

    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(all_logs, f, indent=2, ensure_ascii=False)

    print(f"[maintenance] Written {len(all_logs)} log entries → {OUTPUT_JSON}")


if __name__ == "__main__":
    main()
