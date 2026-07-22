/**
 * IndustrialBrain — Metadata Sanitizer Utilities
 * Resolves tab ID validation, internal tag stripping, Unicode decoding, and URL parameter escaping.
 */

/**
 * Strips internal <WebsiteContent_...> marker wrappers.
 */
export function stripInternalMarkers(text) {
  if (!text || typeof text !== "string") return text || "";
  return text.replace(/<\/?WebsiteContent_[A-Za-z0-9_]+>/g, "").trim();
}

/**
 * Decodes Unicode escapes like \u2014 or \u0026 into human-readable characters.
 */
export function decodeUnicodeEscapes(text) {
  if (!text || typeof text !== "string") return text || "";
  return text
    .replace(/\\u2014/g, "—")
    .replace(/\\u0026/g, "&")
    .replace(/&amp;/g, "&");
}

/**
 * Normalizes page URLs and handles environment-aware base URLs.
 */
export function normalizeMetadataUrl(url, fallbackPath = "/copilot") {
  let cleanUrl = stripInternalMarkers(url);
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
  
  if (!cleanUrl) {
    return `${baseUrl}${fallbackPath}`;
  }

  if (cleanUrl.startsWith("http://localhost/") || cleanUrl.startsWith("http://localhost:8000/")) {
    const path = cleanUrl.replace(/^http:\/\/localhost(:8000)?/, "");
    cleanUrl = `${baseUrl}${path}`;
  }
  return cleanUrl;
}

/**
 * Sanitizes tab metadata ensuring positive integer tabId, synchronized isCurrent state, and cleaned titles/URLs.
 */
export function sanitizeTabMetadata(tabData = {}) {
  let tabId = typeof tabData.tabId === "number" ? tabData.tabId : parseInt(tabData.tabId, 10);
  if (isNaN(tabId) || tabId <= 0) {
    tabId = 1;
  }

  const isCurrent = Boolean(tabData.isCurrent);
  
  // Clean title & url with fallback protection
  let rawTitle = stripInternalMarkers(tabData.pageTitle || "");
  let pageTitle = decodeUnicodeEscapes(rawTitle);
  if (!pageTitle) {
    pageTitle = "IndustrialBrain — Knowledge & Operational Intelligence";
  }

  let pageUrl = normalizeMetadataUrl(tabData.pageUrl || "");

  return {
    ...tabData,
    tabId,
    isCurrent,
    pageTitle,
    pageUrl,
  };
}

/**
 * Escapes query parameters and special characters in URLs for XML/HTML structures.
 */
export function escapeUrlForXml(url) {
  const cleanUrl = stripInternalMarkers(url);
  return cleanUrl.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
