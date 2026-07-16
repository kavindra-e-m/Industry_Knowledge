"""
generate_inspection_records.py
Generates inspection results + statutory certificate records.
Outputs:
  - data/seeds/inspection_records.json
Owner: Member 4 — Data & DevOps Lead
"""

import csv
import json
import random
from datetime import date, timedelta
from pathlib import Path

random.seed(42)

EQUIPMENT_CSV = Path(__file__).parent.parent / "seeds" / "equipment_master.csv"
OUTPUT_JSON   = Path(__file__).parent.parent / "seeds" / "inspection_records.json"

# ── reference data ─────────────────────────────────────────────────────────────
INSPECTION_TYPES = [
    "Visual Inspection",
    "Ultrasonic Thickness (UT)",
    "Magnetic Particle Inspection (MPI)",
    "Dye Penetrant Test (DPT)",
    "Vibration Analysis",
    "Thermography",
    "Pressure Test (Hydro)",
    "Lube Oil Analysis",
    "Statutory IBR Inspection",
    "Electrical Insulation Test",
    "Corrosion Monitoring",
    "PSSR (Pressure Systems Safety Regulations)",
    "Third-Party Certification Audit",
    "Internal Visual (Vessel Entry)",
    "Relief Valve Testing",
]

# Which inspection types apply to which equipment categories
INSPECTION_MAP = {
    "Centrifugal Pump":       ["Visual Inspection", "Vibration Analysis", "Lube Oil Analysis", "Thermography"],
    "Reciprocating Pump":     ["Visual Inspection", "Vibration Analysis", "Pressure Test (Hydro)", "Lube Oil Analysis"],
    "Heat Exchanger":         ["Ultrasonic Thickness (UT)", "Pressure Test (Hydro)", "Internal Visual (Vessel Entry)", "Corrosion Monitoring"],
    "Pressure Vessel":        ["Ultrasonic Thickness (UT)", "Statutory IBR Inspection", "Internal Visual (Vessel Entry)", "Corrosion Monitoring", "PSSR (Pressure Systems Safety Regulations)"],
    "Fired Heater":           ["Visual Inspection", "Ultrasonic Thickness (UT)", "Thermography", "Statutory IBR Inspection"],
    "Compressor":             ["Vibration Analysis", "Lube Oil Analysis", "Thermography", "Pressure Test (Hydro)"],
    "Boiler":                 ["Statutory IBR Inspection", "Ultrasonic Thickness (UT)", "Corrosion Monitoring", "Relief Valve Testing"],
    "Storage Tank":           ["Ultrasonic Thickness (UT)", "Corrosion Monitoring", "Visual Inspection"],
    "Air Cooler":             ["Corrosion Monitoring", "Pressure Test (Hydro)", "Visual Inspection"],
    "Control Valve":          ["Visual Inspection", "Pressure Test (Hydro)", "PSSR (Pressure Systems Safety Regulations)"],
    "Safety Relief Valve":    ["Relief Valve Testing", "PSSR (Pressure Systems Safety Regulations)", "Third-Party Certification Audit"],
    "Electric Motor":         ["Electrical Insulation Test", "Thermography", "Vibration Analysis"],
    "Flow Meter":             ["Visual Inspection", "Pressure Test (Hydro)"],
    "Level Transmitter":      ["Visual Inspection"],
    "Pressure Transmitter":   ["Visual Inspection"],
    "default":                ["Visual Inspection", "Vibration Analysis"],
}

INSPECTION_AGENCIES = [
    "In-House Inspection Team",
    "In-House Inspection Team",
    "Lloyd's Register",
    "Bureau Veritas",
    "DNV GL",
    "TÜV SÜD",
    "RITES Ltd",
    "Mecon Limited",
    "CE Testing India",
]

FINDINGS_PASS = [
    "No defects observed. Equipment in satisfactory condition.",
    "Minor surface rust noted on external cladding. Monitor at next inspection.",
    "Thickness within acceptable limits. Corrosion rate nominal.",
    "Vibration levels within ISO 10816 limits. No action required.",
    "Insulation resistance acceptable (>100 MΩ). No action required.",
    "Oil sample clean — no metallic particles detected.",
    "All welds and joints in good condition. No leaks.",
    "Equipment passed pressure test at 1.5× design pressure.",
    "Relief valve tested at correct set pressure. Reseats cleanly.",
]

FINDINGS_FAIL = [
    "Wall thickness below minimum acceptable limit. Schedule replacement within 90 days.",
    "Crack detected at weld toe. Immediate repair required before return to service.",
    "High vibration — 12.4 mm/s RMS. Suspected bearing degradation. Corrective action required.",
    "Oil contamination with water. Flush and refill. Investigate seal integrity.",
    "Relief valve chattered at 85% set pressure. Dismantle and lap seat.",
    "Severe corrosion pitting on shell — 3 pits >4mm depth. Repair required.",
    "Pressure test failed at 1.3× DP. Identified leak at nozzle N3. Weld repair required.",
    "Internal corrosion observed on tube sheet. Plugging of 5 tubes recommended.",
    "Electrical insulation degraded (<1 MΩ). Winding replacement required.",
]

CERTIFICATE_TYPES = [
    "IBR Certificate",
    "PESO Approval",
    "Factory Inspectorate Certificate",
    "Third-Party Inspection Certificate",
    "Fitness Certificate",
    None,
    None,
    None,
]


def load_equipment() -> list[dict]:
    if not EQUIPMENT_CSV.exists():
        return [{"equipment_id": f"P-{i}", "equipment_type": "Centrifugal Pump", "installed_date": "2010-01-01"} for i in range(101, 121)]
    with open(EQUIPMENT_CSV, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def inspection_types_for(equipment_type: str) -> list[str]:
    return INSPECTION_MAP.get(equipment_type, INSPECTION_MAP["default"])


def generate_records(equipment: list[dict]) -> list[dict]:
    records = []
    rec_id = 5000

    history_start = date(2020, 1, 1)
    history_end   = date(2025, 6, 30)

    for eq in equipment:
        eq_id    = eq["equipment_id"]
        eq_type  = eq.get("equipment_type", "default")
        ins_types = inspection_types_for(eq_type)

        # Each equipment gets 2–6 inspection events
        n_events = random.randint(2, 6)
        for _ in range(n_events):
            rec_id += 1
            ins_date = history_start + timedelta(days=random.randint(0, (history_end - history_start).days))
            ins_type = random.choice(ins_types)
            agency   = random.choice(INSPECTION_AGENCIES)

            # 85% pass rate
            passed   = random.random() < 0.85
            findings = random.choice(FINDINGS_PASS) if passed else random.choice(FINDINGS_FAIL)
            result   = "Pass" if passed else "Fail"

            # Certificate
            cert_type = random.choice(CERTIFICATE_TYPES)
            cert_no   = f"CERT-{random.randint(10000, 99999)}" if cert_type else None
            cert_valid_until = (ins_date + timedelta(days=random.randint(365, 730))).isoformat() if cert_type else None

            next_inspection = (ins_date + timedelta(days=random.randint(180, 730))).isoformat()

            records.append({
                "inspection_id":         f"INS-{rec_id:06d}",
                "equipment_id":          eq_id,
                "equipment_type":        eq_type,
                "inspection_date":       ins_date.isoformat(),
                "inspection_type":       ins_type,
                "inspecting_agency":     agency,
                "result":                result,
                "findings":              findings,
                "action_required":       not passed,
                "action_description":    findings if not passed else None,
                "action_due_date":       (ins_date + timedelta(days=random.randint(30, 90))).isoformat() if not passed else None,
                "action_closed":         (not passed and random.random() > 0.3),
                "certificate_type":      cert_type,
                "certificate_number":    cert_no,
                "certificate_valid_until": cert_valid_until,
                "certificate_expired":   (cert_valid_until is not None and cert_valid_until < history_end.isoformat()),
                "next_inspection_due":   next_inspection,
                "inspector_name":        f"Insp. {random.choice(['A. Kumar', 'B. Shah', 'C. Nair', 'D. Reddy', 'E. Mehta'])}",
            })

    records.sort(key=lambda x: x["inspection_date"])
    return records


def main() -> None:
    equipment = load_equipment()
    records   = generate_records(equipment)

    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2, ensure_ascii=False)

    print(f"[inspection] Written {len(records)} records → {OUTPUT_JSON}")


if __name__ == "__main__":
    main()
