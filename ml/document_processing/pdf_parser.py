"""
PDF parser — primary: pdfplumber (text + tables), fallback: PyMuPDF.
Owner: Member 2 — ML & Document Intelligence Lead
"""
import pdfplumber
import fitz  # PyMuPDF
from loguru import logger


class PDFParser:
    """Extract text and tables from PDF files."""

    def extract(self, file_path: str) -> str:
        """Try pdfplumber first; fall back to PyMuPDF if text is too sparse."""
        try:
            text = self._pdfplumber(file_path)
            if len(text.strip()) >= 50:
                return text
            logger.warning(f"pdfplumber returned sparse text — trying PyMuPDF for {file_path}")
            return self._pymupdf(file_path)
        except Exception as e:
            logger.warning(f"pdfplumber failed ({e}) — falling back to PyMuPDF")
            return self._pymupdf(file_path)

    # ------------------------------------------------------------------
    def _pdfplumber(self, file_path: str) -> str:
        parts = []
        with pdfplumber.open(file_path) as pdf:
            for i, page in enumerate(pdf.pages, start=1):
                text = page.extract_text() or ""

                # Extract tables as pipe-separated text
                table_text = ""
                tables = page.extract_tables()
                for table in tables:
                    for row in table:
                        if row:
                            cleaned = [str(c or "").strip() for c in row]
                            table_text += " | ".join(cleaned) + "\n"

                page_content = f"[Page {i}]\n{text}"
                if table_text:
                    page_content += f"\n[Tables]\n{table_text}"
                parts.append(page_content)

        return "\n\n".join(parts)

    def _pymupdf(self, file_path: str) -> str:
        doc = fitz.open(file_path)
        parts = []
        for i, page in enumerate(doc, start=1):
            parts.append(f"[Page {i}]\n{page.get_text()}")
        doc.close()
        return "\n\n".join(parts)
