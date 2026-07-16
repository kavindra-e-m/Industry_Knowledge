# ML & Document Intelligence — Member 2

You own everything that turns a raw file into structured knowledge:
OCR, P&ID drawing parsing, predictive maintenance, root-cause analysis,
and lessons-learned pattern mining. Your outputs feed Member 1's ingest
endpoint and knowledge graph — see `docs/api-contracts.md` for the exact
handoff shapes.

## Structure
- `ocr/` — text extraction from PDFs and scanned forms
- `pid_parser/` — computer vision over P&ID engineering drawings
- `predictive_maintenance/` — equipment health / failure risk model
- `rca_engine/` — root-cause analysis on past failures
- `lessons_learned/` — pattern detection across incident reports
- `notebooks/` — exploration, kept out of production code paths

## Run locally
```bash
pip install -r requirements.txt --break-system-packages
```
