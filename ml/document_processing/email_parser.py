"""
Email parser — handles .eml and .msg files.
Owner: Member 2 — ML & Document Intelligence Lead
"""
import email
from email.policy import default as default_policy
from pathlib import Path
from loguru import logger


class EmailParser:
    """Extract text from .eml and .msg email files."""

    def extract(self, file_path: str) -> str:
        try:
            path = Path(file_path)
            suffix = path.suffix.lower()
            if suffix == ".eml":
                return self._parse_eml(file_path)
            elif suffix == ".msg":
                return self._parse_msg(file_path)
            logger.warning(f"Unknown email format: {suffix}")
            return ""
        except Exception as e:
            logger.error(f"Email parse failed for {file_path}: {e}")
            return ""

    # ------------------------------------------------------------------
    def _parse_eml(self, file_path: str) -> str:
        with open(file_path, "rb") as f:
            msg = email.message_from_bytes(f.read(), policy=default_policy)

        header = "\n".join([
            f"From: {msg.get('From', '')}",
            f"To: {msg.get('To', '')}",
            f"CC: {msg.get('CC', '')}",
            f"Subject: {msg.get('Subject', '')}",
            f"Date: {msg.get('Date', '')}",
            "---",
        ])

        body_parts = []
        for part in msg.walk():
            content_type = part.get_content_type()
            if content_type == "text/plain":
                payload = part.get_payload(decode=True)
                if payload:
                    body_parts.append(payload.decode("utf-8", errors="replace"))
            elif content_type == "text/html" and not body_parts:
                # Fallback HTML → strip tags
                payload = part.get_payload(decode=True)
                if payload:
                    import re
                    html = payload.decode("utf-8", errors="replace")
                    body_parts.append(re.sub(r"<[^>]+>", " ", html))

        return header + "\n" + "\n".join(body_parts)

    def _parse_msg(self, file_path: str) -> str:
        try:
            import extract_msg
            msg = extract_msg.Message(file_path)
            return "\n".join([
                f"From: {msg.sender or ''}",
                f"To: {msg.to or ''}",
                f"Subject: {msg.subject or ''}",
                f"Date: {msg.date or ''}",
                "---",
                msg.body or "",
            ])
        except ImportError:
            logger.warning("extract-msg not installed — cannot parse .msg files")
            return ""
        except Exception as e:
            logger.error(f"MSG parse failed: {e}")
            return ""
