"""
generate_compliance_docs.py
Generates synthetic operating procedure documents with deliberate compliance gaps.
Useful for testing the compliance-checker agent against OISD / Factory Act / PESO.

Outputs:
  - data/sample_documents/procedures/<procedure_id>.txt  (one file per procedure)
  - data/seeds/compliance_docs_index.json               (manifest for ingestion)
Owner: Member 4 — Data & DevOps Lead
"""

import json
import random
from pathlib import Path

random.seed(42)

PROCEDURES_DIR = Path(__file__).parent.parent / "sample_documents" / "procedures"
INDEX_JSON     = Path(__file__).parent.parent / "seeds" / "compliance_docs_index.json"

# ── Regulation clauses that procedures should satisfy ─────────────────────────
# Each clause has a 30% probability of being "missing" from a given procedure.
REGULATION_CLAUSES = [
    {
        "clause_id":    "OISD-STD-116-4.2",
        "regulation":   "OISD-STD-116",
        "title":        "Pre-startup safety review checklist",
        "requirement":  "A formal pre-startup safety review (PSSR) shall be documented and signed off before any equipment returns to service after maintenance.",
    },
    {
        "clause_id":    "OISD-STD-118-6.1",
        "regulation":   "OISD-STD-118",
        "title":        "Isolation and lockout/tagout",
        "requirement":  "Energy isolation (LOTO) procedure must be documented with step-by-step valve numbers, electrical isolation points and responsible persons.",
    },
    {
        "clause_id":    "OISD-STD-105-3.3",
        "regulation":   "OISD-STD-105",
        "title":        "Work permit system",
        "requirement":  "All non-routine work shall be covered under a formal work permit (hot work / cold work / confined space entry) signed by a competent authority.",
    },
    {
        "clause_id":    "FACTORIES-ACT-SEC41B",
        "regulation":   "Factories Act 1948 — Section 41B",
        "title":        "Compulsory disclosure of hazards",
        "requirement":  "Occupier shall maintain an up-to-date inventory of hazardous chemicals and their Material Safety Data Sheets (MSDS) accessible at point of use.",
    },
    {
        "clause_id":    "FACTORIES-ACT-SEC36A",
        "regulation":   "Factories Act 1948 — Section 36A",
        "title":        "Precautions against dangerous fumes",
        "requirement":  "No person shall enter any confined space containing dangerous fumes without breathing apparatus and a standby person stationed outside.",
    },
    {
        "clause_id":    "PESO-GAS-COND-5.4",
        "regulation":   "PESO Gas Cylinder Rules 2016 — Condition 5.4",
        "title":        "Pressure vessel periodic testing",
        "requirement":  "Pressure vessels shall undergo hydraulic testing at 1.5× design pressure every 5 years and be certified by a competent person.",
    },
    {
        "clause_id":    "OISD-STD-116-7.1",
        "regulation":   "OISD-STD-116",
        "title":        "Management of change procedure",
        "requirement":  "Any change to equipment, process parameters, or operating procedures shall go through a formal Management of Change (MOC) review.",
    },
    {
        "clause_id":    "OISD-STD-189-4.5",
        "regulation":   "OISD-STD-189",
        "title":        "Emergency response plan",
        "requirement":  "Each unit must have a documented Emergency Response Plan (ERP) with roles, escalation matrix, and evacuation routes updated annually.",
    },
    {
        "clause_id":    "FACTORIES-ACT-SEC41C",
        "regulation":   "Factories Act 1948 — Section 41C",
        "title":        "Trained personnel for hazardous processes",
        "requirement":  "Persons operating hazardous process equipment shall have documented training records and a valid competency certificate.",
    },
    {
        "clause_id":    "OISD-GDN-206-3.1",
        "regulation":   "OISD-GDN-206",
        "title":        "Safety instrumented systems testing",
        "requirement":  "All safety instrumented functions (SIF) shall be proof-tested at the frequency specified in the SIL determination study.",
    },
]

PROCEDURE_TEMPLATES = [
    {
        "proc_type": "Pump Startup",
        "equipment_types": ["Centrifugal Pump", "Reciprocating Pump"],
        "steps": [
            "Verify pump is mechanically sound and coupling guard is in place.",
            "Check lube oil level in bearing housing. Top up if required.",
            "Open suction valve fully. Crack open discharge valve.",
            "Prime pump — open vent until liquid flows without bubbles.",
            "Start motor. Verify rotation direction matches arrow on casing.",
            "Slowly open discharge valve to design flow.",
            "Check for vibration, abnormal noise, and seal leakage.",
            "Record discharge pressure, flow rate, and motor current.",
            "Notify control room — unit in service.",
        ],
    },
    {
        "proc_type": "Heat Exchanger Cleaning",
        "equipment_types": ["Heat Exchanger"],
        "steps": [
            "Obtain cold work permit signed by operations supervisor.",
            "Isolate shell-side and tube-side with double-block-and-bleed.",
            "Depressurize and drain to safe location.",
            "Purge with nitrogen and verify oxygen content >19.5% before entry.",
            "Remove bonnet and pull tube bundle using certified lifting tackle.",
            "Clean tubes using high-pressure water jet or mechanical cleaning.",
            "Inspect tube sheets for erosion, pitting, and fouling deposits.",
            "Reassemble with new gaskets. Torque flanges per procedure.",
            "Pressure test at 1.5× design pressure before reintroduction.",
        ],
    },
    {
        "proc_type": "Pressure Vessel Entry",
        "equipment_types": ["Pressure Vessel", "Storage Tank"],
        "steps": [
            "Raise confined space entry permit — Operations + HSE co-signature required.",
            "Isolate all inlets and outlets with spectacle blinds. Verify with P&ID.",
            "Depressurize, drain, and purge vessel.",
            "Test atmosphere: O₂ 19.5–23.5%, LEL <10%, H₂S <1 ppm.",
            "Assign standby rescue person stationed at manway — never enters.",
            "Entrant to wear full-face SCBA if H₂S risk exists.",
            "Carry out internal visual inspection — record findings on checklist.",
            "Exit and secure manway. Restore blinds per blind register.",
            "Sign off permit. Notify control room.",
        ],
    },
    {
        "proc_type": "Control Valve Maintenance",
        "equipment_types": ["Control Valve"],
        "steps": [
            "Obtain cold work permit.",
            "Switch controller to manual. Place valve in fail-safe position.",
            "Bypass flow through manual bypass valve if available.",
            "Isolate valve using upstream and downstream block valves.",
            "Drain to safe blowdown. Verify zero energy state.",
            "Remove actuator and body. Clean and inspect trim, seat, and cage.",
            "Replace seat rings and packing if worn.",
            "Reassemble and bench-test actuator stroke and air supply.",
            "Reinstall and loop-test with DCS. Verify full travel.",
            "Return to automatic mode. Record As-found / As-left data.",
        ],
    },
    {
        "proc_type": "Fired Heater Startup",
        "equipment_types": ["Fired Heater"],
        "steps": [
            "Verify all SIS and BMS instruments are in service and tested.",
            "Purge firebox for minimum 3 minutes at >25% excess air.",
            "Verify fuel gas pressure is within operating range.",
            "Establish process flow through coils at minimum 50% design rate.",
            "Light pilot burner — confirm stable pilot flame before opening main fuel.",
            "Ramp up duty in steps of 10% per 15 minutes. Monitor coil outlet temperatures.",
            "Record flue gas O₂ (target 2–4%) and CO (target <100 ppm).",
            "Verify all safety trips are armed.",
            "Log startup in heater logbook with duty officer signature.",
        ],
    },
    {
        "proc_type": "Compressor Shutdown",
        "equipment_types": ["Compressor"],
        "steps": [
            "Notify control room and downstream units of planned shutdown.",
            "Reduce throughput to minimum flow before shutdown.",
            "Trip compressor using normal stop sequence — never emergency trip for planned shutdown.",
            "Isolate suction and discharge valves. Depressurize casing.",
            "Engage turning gear if required to prevent thermal bow.",
            "Drain lube oil and seal oil systems if extended outage.",
            "Tag out all energy sources as per LOTO procedure.",
            "Record vibration and bearing temperature readings at shutdown.",
            "Issue work permit for any planned maintenance.",
        ],
    },
    {
        "proc_type": "Safety Relief Valve Testing",
        "equipment_types": ["Safety Relief Valve"],
        "steps": [
            "Obtain work permit. Verify replacement SRV is available and certified.",
            "Isolate SRV using isolation valve (if installed).",
            "Remove SRV and send to certified workshop for bench testing.",
            "Test at set pressure as per nameplate. Document As-found set pressure.",
            "Lap seat if leaking below set pressure.",
            "Re-test after maintenance. Issue certificate for as-left condition.",
            "Reinstall and torque flange bolts per specification.",
            "Remove isolation. Verify no leak on body and bonnet.",
            "Update SRV register and next test due date.",
        ],
    },
    {
        "proc_type": "Emergency Shutdown Response",
        "equipment_types": ["*"],
        "steps": [
            "Activate Emergency Response Plan as per plant ERP document.",
            "Sound general alarm — evacuate non-essential personnel.",
            "Isolate affected equipment using ESD pushbuttons or DCS.",
            "Notify plant emergency coordinator and HSE officer.",
            "Deploy first responders with appropriate PPE to assess situation.",
            "Account for all personnel using muster point roll call.",
            "Contact external emergency services if required (PESO, Fire Brigade).",
            "Preserve evidence for incident investigation.",
            "Complete incident notification within 2 hours per statutory requirement.",
        ],
    },
]


def pick_clauses_with_gaps(all_clauses: list[dict], gap_probability: float = 0.30) -> tuple[list[str], list[dict]]:
    """Return (covered_clause_ids, gap_clauses) for a procedure."""
    covered = []
    gaps    = []
    for clause in all_clauses:
        if random.random() < gap_probability:
            gaps.append(clause)
        else:
            covered.append(clause["clause_id"])
    return covered, gaps


def format_procedure_text(proc_id: str, template: dict, covered_clauses: list[str], gap_clauses: list[dict]) -> str:
    lines = []
    lines.append(f"PROCEDURE: {template['proc_type'].upper()}")
    lines.append(f"Document No: {proc_id}")
    lines.append(f"Revision: Rev-{random.randint(0, 5)}")
    lines.append(f"Approved by: {random.choice(['Plant Manager', 'Operations Superintendent', 'HSE Manager'])}")
    lines.append(f"Applicable Equipment: {', '.join(template['equipment_types'])}")
    lines.append("")
    lines.append("=" * 60)
    lines.append("SCOPE")
    lines.append("=" * 60)
    lines.append(f"This procedure covers the safe execution of {template['proc_type'].lower()} ")
    lines.append("activities in accordance with applicable plant standards and regulations.")
    lines.append("")

    lines.append("=" * 60)
    lines.append("REFERENCED REGULATIONS")
    lines.append("=" * 60)
    if covered_clauses:
        for cid in covered_clauses:
            lines.append(f"  - {cid}")
    else:
        lines.append("  (No specific regulation references cited in this revision.)")
    lines.append("")

    lines.append("=" * 60)
    lines.append("PROCEDURE STEPS")
    lines.append("=" * 60)
    for j, step in enumerate(template["steps"], 1):
        lines.append(f"  Step {j}: {step}")
    lines.append("")

    # Deliberately omit gap clause content — that's the compliance gap
    if gap_clauses:
        lines.append("=" * 60)
        lines.append("COMPLIANCE GAPS (INTERNAL — FOR TESTING)")
        lines.append("=" * 60)
        lines.append("The following regulatory requirements are NOT addressed in this procedure:")
        for gc in gap_clauses:
            lines.append(f"  [MISSING] {gc['clause_id']} — {gc['title']}")
            lines.append(f"            Requirement: {gc['requirement']}")
        lines.append("")

    lines.append("=" * 60)
    lines.append("END OF PROCEDURE")
    lines.append("=" * 60)
    return "\n".join(lines)


def main() -> None:
    PROCEDURES_DIR.mkdir(parents=True, exist_ok=True)
    INDEX_JSON.parent.mkdir(parents=True, exist_ok=True)

    index = []
    proc_counter = 1

    # Generate 2–3 instances per template (different units / equipment tags)
    for template in PROCEDURE_TEMPLATES:
        instances = random.randint(2, 3)
        for _ in range(instances):
            proc_id = f"SOP-{proc_counter:04d}"
            proc_counter += 1

            covered_clauses, gap_clauses = pick_clauses_with_gaps(REGULATION_CLAUSES, gap_probability=0.30)
            content = format_procedure_text(proc_id, template, covered_clauses, gap_clauses)

            out_path = PROCEDURES_DIR / f"{proc_id}.txt"
            out_path.write_text(content, encoding="utf-8")

            index.append({
                "doc_id":              proc_id,
                "proc_type":           template["proc_type"],
                "file_path":           str(out_path.relative_to(Path(__file__).parent.parent.parent)),
                "applicable_equipment": template["equipment_types"],
                "covered_clauses":     covered_clauses,
                "gap_clauses":         [gc["clause_id"] for gc in gap_clauses],
                "gap_count":           len(gap_clauses),
                "compliance_score":    round((len(covered_clauses) / len(REGULATION_CLAUSES)) * 100, 1),
            })

    with open(INDEX_JSON, "w", encoding="utf-8") as f:
        json.dump(index, f, indent=2, ensure_ascii=False)

    print(f"[compliance_docs] Written {proc_counter - 1} procedure files → {PROCEDURES_DIR}")
    print(f"[compliance_docs] Index written → {INDEX_JSON}")


if __name__ == "__main__":
    main()
