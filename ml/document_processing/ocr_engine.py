"""
OCR Engine — PaddleOCR (primary, CPU mode) with pytesseract fallback.
Handles scanned PDFs and image files.
Owner: Member 2 — ML & Document Intelligence Lead
"""
from loguru import logger
import numpy as np


class OCREngine:
    """Extract text from images and scanned PDFs via OCR."""

    def __init__(self):
        self._paddle = None
        self._tesseract_available = False
        self._init_ocr()

    def _init_ocr(self):
        """Try PaddleOCR first, then pytesseract as fallback."""
        try:
            from paddleocr import PaddleOCR
            logger.info("Initialising PaddleOCR (CPU mode) — first run downloads models...")
            self._paddle = PaddleOCR(use_angle_cls=True, lang="en", use_gpu=False, show_log=False)
            logger.success("PaddleOCR ready")
        except Exception as e:
            logger.warning(f"PaddleOCR not available ({e}) — will use pytesseract fallback")
            try:
                import pytesseract
                self._tesseract_available = True
                logger.success("pytesseract fallback ready")
            except ImportError:
                logger.error("Neither PaddleOCR nor pytesseract available. Install one.")

    # ------------------------------------------------------------------
    def extract(self, file_path: str) -> str:
        """Route to correct extraction method based on file type."""
        if file_path.lower().endswith(".pdf"):
            return self._extract_pdf(file_path)
        return self._extract_image(file_path)

    # ------------------------------------------------------------------
    def _extract_image(self, image_path: str) -> str:
        if self._paddle:
            return self._paddle_image(image_path)
        if self._tesseract_available:
            return self._tesseract_image(image_path)
        return ""

    def _extract_pdf(self, pdf_path: str) -> str:
        """Convert each PDF page to image then OCR."""
        import fitz  # PyMuPDF
        doc = fitz.open(pdf_path)
        all_text = []
        for i, page in enumerate(doc, start=1):
            mat = fitz.Matrix(2.0, 2.0)  # 2x scale for better OCR accuracy
            pix = page.get_pixmap(matrix=mat)
            img_array = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, pix.n)
            if pix.n == 4:  # RGBA → RGB
                img_array = img_array[:, :, :3]
            text = self._ocr_array(img_array)
            if text:
                all_text.append(f"[Page {i}]\n{text}")
        doc.close()
        return "\n\n".join(all_text)

    def _ocr_array(self, img_array: np.ndarray) -> str:
        if self._paddle:
            return self._paddle_array(img_array)
        if self._tesseract_available:
            return self._tesseract_array(img_array)
        return ""

    def _paddle_image(self, image_path: str) -> str:
        result = self._paddle.ocr(image_path, cls=True)
        if not result or not result[0]:
            return ""
        lines = [
            line[1][0]
            for line in result[0]
            if line and line[1][1] > 0.60  # confidence threshold
        ]
        return "\n".join(lines)

    def _paddle_array(self, img_array: np.ndarray) -> str:
        result = self._paddle.ocr(img_array, cls=True)
        if not result or not result[0]:
            return ""
        lines = [
            line[1][0]
            for line in result[0]
            if line and line[1][1] > 0.60
        ]
        return "\n".join(lines)

    def _tesseract_image(self, image_path: str) -> str:
        import pytesseract
        from PIL import Image
        return pytesseract.image_to_string(Image.open(image_path))

    def _tesseract_array(self, img_array: np.ndarray) -> str:
        import pytesseract
        from PIL import Image
        img = Image.fromarray(img_array)
        return pytesseract.image_to_string(img)
