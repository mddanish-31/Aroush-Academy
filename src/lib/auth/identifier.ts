export function normalizeIdentifier(raw: string): string | null {
  if (typeof raw !== "string") {
    return null;
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.includes("@")) {
    return trimmed.toLowerCase();
  }

  const cleaned = trimmed.replace(/[\s\-()[\]{}]/g, "");

  if (/^\+91\d{10}$/.test(cleaned)) {
    return cleaned;
  }

  if (/^91\d{10}$/.test(cleaned)) {
    return "+" + cleaned;
  }

  if (/^0\d{10}$/.test(cleaned)) {
    return "+91" + cleaned.slice(1);
  }

  if (/^\d{10}$/.test(cleaned)) {
    return "+91" + cleaned;
  }

  return null;
}
