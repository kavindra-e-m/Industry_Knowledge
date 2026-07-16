"""
generate_work_orders.py
Generates work order history + outcomes for all equipment.
Outputs:
  - data/seeds/work_orders.json
Owner: Member 4 — Data & DevOps Lead
"""

import csv
import json
import random
from datetime import date, timedelta
from pathlib import Path

random.seed(42)

EQUIPMENT_CSV = Path(__file__).parent.parent / "seeds" / "equipment_master.csv"
OUTPUT_JSON   = Path(__file__).parent.parent / "seeds" / "work_orders.json"

PRIORITIES   = ["P1 - Critical", "P2 - High", "P3 - Medium", "P4 - Low"]
PRIORITY_W   = [5, 20, 50, 25]

WO_TYPES = [
    "Corrective",
    "Preventive",
    "Predictive",
    "Emergency",
    "Inspection",
    "Modification",
    "Statutory",
]

DISCIPLINES = ["Mechanical", "Electrical", "Instrumentation", "Civil", "Operations"]

STATUSES = [
    "Closed",
    "Closed",
    "Closed",
    "Closed",
    "In Progress",
    "Open",
    "Deferred",
    "Cancelled",
]

CONTRACTORS = [
    "In-House Team",
    "In-House Team",
    "In-House Team",
    "SKF Services",
    "Flowserve India",
    "ABB Field Services",
    "Thermax Maintenance",
    "L&T Hydrocarbon Engineering",
    "Forbes Marshall Services",
    "Siemens Service",
]

WORK_DESCRIPTIONS = [
    "Replace mechanical seal and align pump. Flush bearing housing.",
    "Overhaul heat exchanger — clean tube bundle, replace gaskets, pressure test.",
    "Inspect and replace control valve trim. Calibrate positioner.",
    "Realign coupling and balance impeller. Check motor insulation.",
    "Investigate high vibration reading. Perform root cause analysis.",
    "Statutory pressure vessel inspection as per IBR regulations.",
    "Replace bearing set (DE + NDE). Lubricate and reassemble.",
    "Clean strainer basket. Inspect suction piping for corrosion.",
    "Calibrate differential pressure transmitter. Verify loop output.",
    "Repair insulation damage on pipeline section. Restore cladding.",
    "Investigate abnormal noise from gearbox. Inspect oil level and condition.",
    "Replace V-belt set. Check sheave alignment and tension.",
    "Emergency shutdown — investigate cause and restore to service.",
    "Annual performance test and efficiency measurement.",
    "Repair leaking flange. Replace spiral wound gasket.",
    "Annual safety relief valve inspection and set-pressure verification.",
    "Thermal imaging survey — identify hot spots in electrical panels.",
    "Lubrication route — grease all motor bearings per schedule.",
    "Thickness measurement survey on pressure vessel shell.",
    "Flow meter calibration and DP cell zeroing.",
]


def load_equipment() -> list[dict]:
    if not EQUIPMENT_CSV.exists():
        return [{"equipment_id": f"P-{i}", "criticality": "High", "location": "Unit-01"} for i in range(101, 151)]
    with open(EQUIPMENT_CSV, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def generate_work_orders(equipment: list[dict]) -> list[dict]:
    work_orders = []
    wo_counter = 1000

    start_date = date(2020, 1, 1)
    end_date   = date(2025, 6, 30)

    for eq in equipment:
        eq_id       = eq["equipment_id"]
        criticality = eq.get("criticality", "Medium")

        # Number of WOs depends on criticality
        count_map = {"Critical": (15, 30), "High": (8, 18), "Medium": (4, 10), "Low": (1, 5)}
        lo, hi = count_map.get(criticality, (3, 8))
        n_wo = random.randint(lo, hi)

        used_dates: set[date] = set()
        for _ in range(n_wo):
            wo_counter += 1
            wo_id = f"WO-{wo_counter:06d}"

            # Pick a unique-ish date
            attempts = 0
            while attempts < 20:
                wo_date = start_date + timedelta(days=random.randint(0, (end_date - start_date).days))
                if wo_date not in used_dates:
                    used_dates.add(wo_date)
                    break
                attempts += 1

            priority   = random.choices(PRIORITIES, weights=PRIORITY_W, k=1)[0]
            wo_type    = random.choice(WO_TYPES)
            discipline = random.choice(DISCIPLINES)
            status     = random.choice(STATUSES)
            contractor = random.choice(CONTRACTORS)
            description= random.choice(WORK_DESCRIPTIONS)

            # Planned vs actual hours
            planned_hrs  = round(random.uniform(2, 40), 1)
            actual_hrs   = round(planned_hrs * random.uniform(0.7, 1.6), 1) if status == "Closed" else None
            planned_cost = random.randint(5_000, 5_00_000)
            actual_cost  = int(planned_cost * random.uniform(0.8, 1.4)) if status == "Closed" else None

            # Due date is 1–14 days after raised date
            due_date = wo_date + timedelta(days=random.randint(1, 14))
            closed_date = None
            if status == "Closed":
                close_offset = random.randint(0, 21)
                closed_date = (wo_date + timedelta(days=close_offset)).isoformat()
                closed_date = closed_date if (wo_date + timedelta(days=close_offset)) <= end_date else end_date.isoformat()

            work_orders.append({
                "wo_id":           wo_id,
                "equipment_id":    eq_id,
                "location":        eq.get("location", ""),
                "raised_date":     wo_date.isoformat(),
                "due_date":        due_date.isoformat(),
                "closed_date":     closed_date,
                "wo_type":         wo_type,
                "priority":        priority,
                "discipline":      discipline,
                "description":     description,
                "contractor":      contractor,
                "planned_hrs":     planned_hrs,
                "actual_hrs":      actual_hrs,
                "planned_cost_inr":planned_cost,
                "actual_cost_inr": actual_cost,
                "status":          status,
                "failure_found":   random.choice([True, False, False]),
                "repeat_failure":  random.choice([True, False, False, False, False]),
            })

    work_orders.sort(key=lambda x: x["raised_date"])
    return work_orders


def main() -> None:
    equipment = load_equipment()
    work_orders = generate_work_orders(equipment)

    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(work_orders, f, indent=2, ensure_ascii=False)

    print(f"[work_orders] Written {len(work_orders)} records → {OUTPUT_JSON}")


if __name__ == "__main__":
    main()
