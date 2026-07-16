"""
generate_equipment_master.py
Generates 100+ realistic industrial equipment records for a heavy-process plant.
Outputs:
  - data/seeds/equipment_master.csv   (seed file consumed by init_postgres.sql)
Owner: Member 4 — Data & DevOps Lead
"""

import csv
import random
import uuid
from datetime import date, timedelta
from pathlib import Path

# ── deterministic seed so every run produces the same data ──────────────────
random.seed(42)

OUTPUT_CSV = Path(__file__).parent.parent / "seeds" / "equipment_master.csv"

# ── reference tables ─────────────────────────────────────────────────────────
EQUIPMENT_TYPES = [
    "Centrifugal Pump",
    "Reciprocating Pump",
    "Heat Exchanger",
    "Pressure Vessel",
    "Fired Heater",
    "Compressor",
    "Boiler",
    "Storage Tank",
    "Air Cooler",
    "Agitator",
    "Filter",
    "Separator",
    "Column",
    "Reactor",
    "Electric Motor",
    "Control Valve",
    "Safety Relief Valve",
    "Flow Meter",
    "Level Transmitter",
    "Pressure Transmitter",
]

LOCATIONS = [
    "Unit-01 Crude Distillation",
    "Unit-02 Vacuum Distillation",
    "Unit-03 Hydrodesulphurisation",
    "Unit-04 Reforming",
    "Unit-05 Fluid Catalytic Cracking",
    "Unit-06 Amine Treating",
    "Unit-07 Utilities",
    "Unit-08 Cooling Water",
    "Unit-09 Effluent Treatment",
    "Unit-10 Offsite Storage",
    "Flare System",
    "Control Room",
    "Substation A",
    "Substation B",
]

MANUFACTURERS = [
    "KSB", "Sulzer", "Flowserve", "Atlas Copco", "Thermax",
    "BHEL", "L&T", "Forbes Marshall", "Alfa Laval", "SPX Flow",
    "Emerson", "ABB", "Honeywell", "Siemens", "Yokogawa",
]

CRITICALITY = ["Critical", "High", "Medium", "Low"]
CRITICALITY_WEIGHTS = [0.15, 0.25, 0.40, 0.20]

STATUS = ["Active", "Active", "Active", "Active", "Standby", "Under Maintenance", "Decommissioned"]

# Tag-prefix map — keeps IDs realistic per equipment type
TAG_PREFIXES = {
    "Centrifugal Pump":       "P",
    "Reciprocating Pump":     "P",
    "Heat Exchanger":         "E",
    "Pressure Vessel":        "V",
    "Fired Heater":           "F",
    "Compressor":             "C",
    "Boiler":                 "B",
    "Storage Tank":           "TK",
    "Air Cooler":             "AC",
    "Agitator":               "AG",
    "Filter":                 "FL",
    "Separator":              "SP",
    "Column":                 "T",
    "Reactor":                "R",
    "Electric Motor":         "M",
    "Control Valve":          "CV",
    "Safety Relief Valve":    "SV",
    "Flow Meter":             "FE",
    "Level Transmitter":      "LT",
    "Pressure Transmitter":   "PT",
}

# ── helper ────────────────────────────────────────────────────────────────────

def random_date(start_year: int = 2005, end_year: int = 2022) -> date:
    start = date(start_year, 1, 1)
    end = date(end_year, 12, 31)
    delta = (end - start).days
    return start + timedelta(days=random.randint(0, delta))


def random_next_maintenance(installed: date) -> date:
    """Schedule next PM 6–24 months from a random base after install."""
    base = installed + timedelta(days=random.randint(365, 365 * 5))
    return base + timedelta(days=random.randint(180, 730))


def generate_equipment(count: int = 120) -> list[dict]:
    records = []
    tag_counters: dict[str, int] = {}

    for _ in range(count):
        eq_type = random.choice(EQUIPMENT_TYPES)
        prefix = TAG_PREFIXES[eq_type]
        tag_counters[prefix] = tag_counters.get(prefix, 100)
        tag_counters[prefix] += 1
        tag_id = f"{prefix}-{tag_counters[prefix]}"

        installed = random_date()
        next_pm = random_next_maintenance(installed)
        age_years = round((date(2025, 7, 1) - installed).days / 365.25, 1)

        design_pressure_bar = round(random.uniform(1.5, 80.0), 1) if eq_type not in (
            "Electric Motor", "Flow Meter", "Level Transmitter", "Pressure Transmitter"
        ) else None

        design_temp_c = round(random.uniform(50, 420), 0) if eq_type not in (
            "Electric Motor", "Flow Meter", "Level Transmitter", "Pressure Transmitter",
            "Storage Tank",
        ) else None

        records.append({
            "equipment_id":       tag_id,
            "name":               f"{eq_type} {tag_id}",
            "equipment_type":     eq_type,
            "location":           random.choice(LOCATIONS),
            "manufacturer":       random.choice(MANUFACTURERS),
            "model_number":       f"MDL-{random.randint(1000, 9999)}",
            "serial_number":      str(uuid.uuid4()).upper()[:12],
            "installed_date":     installed.isoformat(),
            "age_years":          age_years,
            "design_pressure_bar": design_pressure_bar,
            "design_temp_c":      design_temp_c,
            "criticality":        random.choices(CRITICALITY, weights=CRITICALITY_WEIGHTS, k=1)[0],
            "status":             random.choice(STATUS),
            "next_pm_due":        next_pm.isoformat(),
            "parent_equipment_id": None,   # populated for sub-components below
            "notes":              "",
        })

    # Add a handful of sub-components (seal, bearing, impeller) for pumps
    sub_records = []
    pumps = [r for r in records if r["equipment_type"] in ("Centrifugal Pump", "Reciprocating Pump")]
    for pump in random.sample(pumps, min(20, len(pumps))):
        for sub_name, sub_type in [("Mechanical Seal", "Seal"), ("Bearing", "Bearing"), ("Impeller", "Impeller")]:
            sub_id = f"{pump['equipment_id']}-{sub_type[:3].upper()}"
            sub_records.append({
                "equipment_id":        sub_id,
                "name":                f"{sub_name} for {pump['equipment_id']}",
                "equipment_type":      sub_type,
                "location":            pump["location"],
                "manufacturer":        random.choice(MANUFACTURERS),
                "model_number":        f"MDL-{random.randint(1000, 9999)}",
                "serial_number":       str(uuid.uuid4()).upper()[:12],
                "installed_date":      pump["installed_date"],
                "age_years":           pump["age_years"],
                "design_pressure_bar": None,
                "design_temp_c":       None,
                "criticality":         "High",
                "status":              pump["status"],
                "next_pm_due":         pump["next_pm_due"],
                "parent_equipment_id": pump["equipment_id"],
                "notes":               f"Sub-component of {pump['equipment_id']}",
            })

    return records + sub_records


# ── main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    records = generate_equipment(120)
    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)

    fieldnames = [
        "equipment_id", "name", "equipment_type", "location", "manufacturer",
        "model_number", "serial_number", "installed_date", "age_years",
        "design_pressure_bar", "design_temp_c", "criticality", "status",
        "next_pm_due", "parent_equipment_id", "notes",
    ]

    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)

    print(f"[equipment] Written {len(records)} records → {OUTPUT_CSV}")


if __name__ == "__main__":
    main()
