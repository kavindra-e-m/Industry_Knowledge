"""
NER pipeline — spaCy + regex for industrial entity extraction.
Extracts: equipment tags, regulation references, persons, dates, locations.
Owner: Member 2 — ML & Document Intelligence Lead
"""
import re
from loguru import logger

# ---------------------------------------------------------------------------
# Equipment tag patterns (covers ISA naming conventions used in Indian refineries)
# ---------------------------------------------------------------------------
EQUIPMENT_PATTERNS: list[str] = [
    r'\b[PVMTEKCFHBCRSLT][VFTCEAKB]?-\d{2,4}[A-Z]?\b',   # e.g. P-101, CV-102, TK-201A
    r'\b[A-Z]{2,3}-\d{3,4}[A-Z]?\b',                      # e.g. FE-101, LT-102, PT-201
    r'\bPump\s+[A-Z]-?\d+\b',
    r'\bValve\s+[A-Z]-?\d+\b',
    r'\bMotor\s+[A-Z]-?\d+\b',
    r'\bCompressor\s+[A-Z]-?\d+\b',
    r'\bReactor\s+[A-Z]-?\d+\b',
    r'\bBoiler\s+[A-Z]-?\d+\b',
]

# ---------------------------------------------------------------------------
# Regulation reference patterns
# ---------------------------------------------------------------------------
REGULATION_PATTERNS: list[str] = [
    r'\bOISD[-\s]?\d+\b',
    r'\bOISD[-\s]?(?:STD|GDN)[-\s]?\d+\b',
    r'\b[Ff]actory\s+[Aa]ct\s+(?:1948\s+)?[Ss]ection\s+\d+\b',
    r'\b[Ff]actory\s+[Aa]ct\s+S(?:ec(?:tion)?)\.?\s*\d+\b',
    r'\bPESO\b',
    r'\bISO\s+\d{4,5}(?:[:-]\d+)?\b',
    r'\bAPI\s+\d+[A-Z]?\b',
    r'\bASME\s+(?:Section|Sec\.?)\s+[IVX]+\b',
    r'\bNACE\s+MR\d{4}\b',
    r'\bIS\s*:\s*\d{3,5}\b',
]

# ---------------------------------------------------------------------------
# Failure mode keywords (used for tagging)
# ---------------------------------------------------------------------------
FAILURE_MODE_PATTERNS: list[str] = [
    r'\b(?:seal|bearing|impeller|valve|corrosion|fouling|vibration|overheating|leakage|cavitation|erosion|fatigue|cracking|deformation)\s+(?:failure|damage|wear|degradation)?\b',
]


class NERPipeline:
    """
    Named Entity Recognition pipeline for industrial documents.
    Combines regex patterns with spaCy for standard NLP entities.
    """

    def __init__(self):
        self.nlp = None
        self._load_spacy()

    def _load_spacy(self):
        try:
            import spacy
            self.nlp = spacy.load("en_core_web_sm")
            logger.success("spaCy en_core_web_sm loaded")
        except OSError:
            logger.warning(
                "spaCy model not found. Run: python -m spacy download en_core_web_sm"
            )
        except ImportError:
            logger.warning("spaCy not installed — regex-only NER mode")

    # ------------------------------------------------------------------
    def extract(self, text: str) -> dict:
        """
        Extract entities from text.

        Returns:
            {
                equipment_tags: list[str],
                regulation_refs: list[str],
                persons: list[str],
                dates: list[str],
                locations: list[str],
                failure_modes: list[str],
                organisations: list[str],
            }
        """
        entities: dict[str, list[str]] = {
            "equipment_tags": [],
            "regulation_refs": [],
            "persons": [],
            "dates": [],
            "locations": [],
            "failure_modes": [],
            "organisations": [],
        }

        # --- Regex extraction ---
        for pattern in EQUIPMENT_PATTERNS:
            matches = re.findall(pattern, text)
            entities["equipment_tags"].extend(matches)

        for pattern in REGULATION_PATTERNS:
            matches = re.findall(pattern, text, re.IGNORECASE)
            entities["regulation_refs"].extend(matches)

        for pattern in FAILURE_MODE_PATTERNS:
            matches = re.findall(pattern, text, re.IGNORECASE)
            entities["failure_modes"].extend(m.strip() for m in matches if m.strip())

        # --- spaCy NLP (capped at 100k chars for CPU speed) ---
        if self.nlp and text:
            doc = self.nlp(text[:100_000])
            for ent in doc.ents:
                label = ent.label_
                ent_text = ent.text.strip()
                if not ent_text:
                    continue
                if label == "PERSON":
                    entities["persons"].append(ent_text)
                elif label == "DATE":
                    entities["dates"].append(ent_text)
                elif label in ("GPE", "LOC", "FAC"):
                    entities["locations"].append(ent_text)
                elif label == "ORG":
                    entities["organisations"].append(ent_text)

        # Deduplicate all lists
        for key in entities:
            entities[key] = sorted(set(entities[key]))

        return entities
