"""
P&ID Symbol Classifier — YOLOv8-nano (CPU) for symbol detection.
Falls back to placeholder if model file not found.
Owner: Member 2 — ML & Document Intelligence Lead
"""
from pathlib import Path
from loguru import logger

# 14 P&ID symbol classes matching the training dataset
PID_CLASSES: dict[int, str] = {
    0: "pump",
    1: "control_valve",
    2: "manual_valve",
    3: "check_valve",
    4: "tank",
    5: "vessel",
    6: "motor",
    7: "heat_exchanger",
    8: "compressor",
    9: "filter",
    10: "flow_meter",
    11: "pressure_indicator",
    12: "temperature_indicator",
    13: "level_indicator",
}

MODEL_PATH = "ml/pid_parser/models/pid_yolov8.pt"


class PIDSymbolClassifier:
    """
    Detect P&ID symbols in engineering drawings using YOLOv8-nano.

    If the fine-tuned model (pid_yolov8.pt) is not yet available,
    falls back to base YOLOv8-nano which can still detect bounding boxes
    but without P&ID-specific classes.
    """

    def __init__(self):
        self.model = None
        self._load_model()

    def _load_model(self):
        try:
            from ultralytics import YOLO
            if Path(MODEL_PATH).exists():
                self.model = YOLO(MODEL_PATH)
                logger.success(f"Loaded fine-tuned P&ID model from {MODEL_PATH}")
            else:
                logger.warning(
                    f"Fine-tuned P&ID model not found at {MODEL_PATH}. "
                    "Using base YOLOv8-nano. Run Colab notebook 02 to train."
                )
                self.model = YOLO("yolov8n.pt")
        except ImportError:
            logger.error("ultralytics not installed — PID classifier unavailable")
        except Exception as e:
            logger.error(f"Model load failed: {e}")

    # ------------------------------------------------------------------
    def detect(
        self,
        image_path: str,
        confidence: float = 0.30,
    ) -> list[dict]:
        """
        Run detection on a P&ID image.

        Returns list of detections:
            {
                symbol_type: str,
                confidence: float,
                bbox: {x1, y1, x2, y2},
                center: {x, y},
                class_id: int,
            }
        """
        if not self.model:
            logger.error("No model loaded — cannot run detection")
            return []

        results = self.model(
            image_path,
            conf=confidence,
            device="cpu",
            verbose=False,
        )

        detections = []
        for result in results:
            for box in result.boxes:
                class_id = int(box.cls[0])
                x1, y1, x2, y2 = [float(v) for v in box.xyxy[0]]
                detections.append({
                    "symbol_type": PID_CLASSES.get(class_id, f"unknown_{class_id}"),
                    "confidence": round(float(box.conf[0]), 3),
                    "class_id": class_id,
                    "bbox": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
                    "center": {"x": round((x1 + x2) / 2, 1), "y": round((y1 + y2) / 2, 1)},
                })

        logger.info(f"Detected {len(detections)} P&ID symbols in {image_path}")
        return detections

    def detect_from_pdf_page(self, pdf_path: str, page_num: int = 0) -> list[dict]:
        """Convert a PDF page to image then detect symbols."""
        import fitz
        import numpy as np
        import tempfile
        from pathlib import Path as _Path

        doc = fitz.open(pdf_path)
        if page_num >= len(doc):
            logger.warning(f"Page {page_num} out of range for {pdf_path}")
            return []

        page = doc[page_num]
        mat = fitz.Matrix(2.0, 2.0)
        pix = page.get_pixmap(matrix=mat)

        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            pix.save(tmp.name)
            detections = self.detect(tmp.name)

        _Path(tmp.name).unlink(missing_ok=True)
        doc.close()
        return detections
