"""
IndustrialBrain — Metadata & Data Sanitization Utilities
Strips internal tags, decodes Unicode escapes, sanitizes tab IDs, and normalizes URLs.
"""
import re
import html
from backend.config.settings import settings


def strip_internal_markers(text: str) -> str:
    """Strip <WebsiteContent_...> internal tag wrappers."""
    if not text or not isinstance(text, str):
        return text or ""
    cleaned = re.sub(r"</?WebsiteContent_[A-Za-z0-9_]+>", "", text)
    return cleaned.strip()


def decode_unicode_escapes(text: str) -> str:
    """Decode unicode escape sequences like \\u2014 or \\u0026 into human-readable characters."""
    if not text or not isinstance(text, str):
        return text or ""
    try:
        decoded = text.encode("utf-8").decode("unicode-escape")
    except Exception:
        decoded = text
    decoded = decoded.replace(r"\u2014", "—").replace(r"\u0026", "&")
    return decoded


def normalize_metadata_url(url: str, base_url: str | None = None) -> str:
    """Replace localhost URLs with configured base URL if appropriate, and clean internal markers."""
    clean_url = strip_internal_markers(url)
    target_base = base_url or getattr(settings, "APP_BASE_URL", "http://localhost:8000")
    if not clean_url:
        return f"{target_base.rstrip('/')}/copilot"
    if clean_url.startswith("http://localhost/") or clean_url.startswith("http://localhost:8000/"):
        path = re.sub(r"^http://localhost(:8000)?", "", clean_url)
        clean_url = f"{target_base.rstrip('/')}{path}"
    return clean_url


def sanitize_tab_metadata(tab_data: dict) -> dict:
    """Ensure tabId is a positive integer, isCurrent matches valid tabId, and title/url are cleaned with fallbacks."""
    tab_id = tab_data.get("tabId", 1)
    if not isinstance(tab_id, int) or tab_id <= 0:
        tab_id = 1

    is_current = bool(tab_data.get("isCurrent", False))
    raw_title = tab_data.get("pageTitle", "")
    raw_url = tab_data.get("pageUrl", "")

    cleaned_title = decode_unicode_escapes(strip_internal_markers(raw_title))
    if not cleaned_title:
        cleaned_title = "IndustrialBrain — Knowledge & Operational Intelligence"

    cleaned_url = normalize_metadata_url(raw_url)

    return {
        **tab_data,
        "tabId": tab_id,
        "isCurrent": is_current,
        "pageTitle": cleaned_title,
        "pageUrl": cleaned_url,
    }


def escape_url_for_xml(url: str) -> str:
    """Escape special characters like & in URLs for XML/HTML embedding."""
    clean_url = strip_internal_markers(url)
    return html.escape(clean_url, quote=True)
