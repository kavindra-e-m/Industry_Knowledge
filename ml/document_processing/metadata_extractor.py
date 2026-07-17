"""
Metadata extractor — classifies document type and extracts dates.
Owner: Member 2 — ML & Document Intelligence Lead
"""
import re
from pathlib import Path

# Keywords for document subtype classification
DOCUMENT_TYPE_KEYWORDS: dict[str, list[str]] = {
    "manual": ["manual", "operating instruction", "maintenance guide", "oem", "instruction book"],
    "inspection_report": ["inspection report", "inspection record", "ndt report", "corrosion survey", "thickness measurement"],
    "procedure": ["procedure", "sop", "standard operating", "work instruction", "method statement"],
    "work_order": ["work order", "maintenance order", "job card", "work request"],
    "incident_report": ["incident report", "near miss", "accident report", "incident investigation", "occurrence report"],
    "compliance": ["compliance", "audit report", "regulatory", "certificate of fitness", "statutory inspection"],
    "pid_drawing": ["p&id", "piping and instrumentation", "process flow diagram", "pfd", "isometric"],
    "datasheet": ["datasheet", "data sheet", "equipment data", "specification sheet", "vendor data"],
    "permit": ["permit to work", "ptw", "hot work permit", "confined space", "work permit"],
}

DATE_PATTERNS = [
    r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b',
    r'\b\d{4}[/-]\d{1,2}[/-]\d{1,2}\b',
    r'\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\b',
    r'\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}\b',
]


class MetadataExtractor:
    """Extract document metadata: type classification, dates, file info."""

    def extract(self, text: str, filename: str, file_type: str) -> dict:
        preview = (text[:1000] + " " + filename).lower()
        return {
            "filename": filename,
            "file_type": file_type,
            "document_subtype": self._classify(preview),
            "dates_found": self._extract_dates(text),
            "word_count": len(text.split()),
            "char_count": len(text),
            "has_tables": "[Tables]" in text or " | " in text,
        }

    # ------------------------------------------------------------------
    def _classify(self, preview: str) -> str:
        scores: dict[str, int] = {}
        for doc_type, keywords in DOCUMENT_TYPE_KEYWORDS.items():
            count = sum(1 for kw in keywords if kw in preview)
            if count > 0:
                scores[doc_type] = count
        if not scores:
            return "general"
        return max(scores, key=lambda k: scores[k])

    def _extract_dates(self, text: str) -> list[str]:
        found = []
        for pattern in DATE_PATTERNS:
            found.extend(re.findall(pattern, text, re.IGNORECASE))
        # Deduplicate and cap
        return list(dict.fromkeys(found))[:15]
