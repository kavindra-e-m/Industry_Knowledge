# API contracts — agree on this FIRST, day 1

Freezing these shapes early is what lets all four of you build in parallel
without stepping on each other. Update this file via PR, not silently.

## POST /api/ingest/document
Request: multipart file upload
Response: { "filename": str, "status": "queued" | "processed" | "failed" }

## POST /api/query
Request: { "question": str, "equipment_id": str | null }
Response: { "answer": str, "sources": [str] }

## GET /api/graph/equipment/{equipment_id}
Response: { "equipment_id": str, "history": [ {type, date, description, source_doc} ] }

## ML -> Backend handoff (internal function calls, not HTTP)
- ml.ocr.document_parser.parse(file) -> {text, tables, metadata}
- ml.pid_parser.drawing_to_graph.parse(file) -> {equipment: [...], connections: [...]}
- ml.predictive_maintenance.inference.predict(equipment_id) -> {risk_score, reasoning}
- ml.rca_engine.root_cause.analyse(equipment_id, failure_date) -> {probable_cause, evidence, past_fixes}
