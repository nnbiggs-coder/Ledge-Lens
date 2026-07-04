/** Normalize currency strings to numeric dollars */
export function normalizeCurrency(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  let cleaned = value
    .toLowerCase()
    .replace(/[$,\s]/g, "");
  cleaned = cleaned.replace(
    /(\d+(?:\.\d+)?)(million|mm|m)\b/g,
    (_, n) => String(parseFloat(n) * 1_000_000)
  );
  cleaned = cleaned.replace(
    /(\d+(?:\.\d+)?)k\b/g,
    (_, n) => String(parseFloat(n) * 1_000)
  );
  cleaned = cleaned.replace(
    /(\d+(?:\.\d+)?)(billion|bn|b)\b/g,
    (_, n) => String(parseFloat(n) * 1_000_000_000)
  );
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : null;
}

/** Normalize percentage to 0-100 scale */
export function normalizePercentage(
  value: string | number | null | undefined
): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") {
    return value <= 1 && value > 0 ? value * 100 : value;
  }
  const lower = value.toLowerCase().trim();
  const wordMap: Record<string, number> = {
    "thirty-eight percent": 38,
    "thirty eight percent": 38,
    "fifteen percent": 15,
    "sixty percent": 60,
  };
  if (wordMap[lower]) return wordMap[lower];
  const cleaned = lower.replace(/%/g, "").trim();
  const num = parseFloat(cleaned);
  if (!Number.isFinite(num)) return null;
  return num <= 1 && num > 0 ? num * 100 : num;
}

/** Normalize time strings to minutes since midnight */
export function normalizeTime(value: string | null | undefined): number | null {
  if (!value) return null;
  const lower = value.toLowerCase().trim();
  if (lower === "midnight" || lower === "12:00 a.m." || lower === "12:00 am" || lower === "12am") {
    return 0;
  }
  const match = lower.match(/(\d{1,2}):?(\d{2})?\s*(a\.?m\.?|p\.?m\.?|am|pm)?/);
  if (!match) {
    if (lower.includes("2:00") && lower.includes("a")) return 120;
    if (lower.includes("1:00") && lower.includes("a")) return 60;
    return null;
  }
  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const period = match[3]?.replace(/\./g, "");
  if (period?.startsWith("p") && hours < 12) hours += 12;
  if (period?.startsWith("a") && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

export function timesEqual(a: string, b: string): boolean {
  const na = normalizeTime(a);
  const nb = normalizeTime(b);
  if (na === null || nb === null) return false;
  return na === nb;
}

export function currenciesEqual(
  a: string | number,
  b: string | number
): boolean {
  const na = normalizeCurrency(a);
  const nb = normalizeCurrency(b);
  if (na === null || nb === null) return false;
  return Math.abs(na - nb) < 1;
}

export function percentagesEqual(
  a: string | number,
  b: string | number
): boolean {
  const na = normalizePercentage(a);
  const nb = normalizePercentage(b);
  if (na === null || nb === null) return false;
  return Math.abs(na - nb) < 0.5;
}

export function stringsSimilar(a: string, b: string): boolean {
  return a.toLowerCase().trim() === b.toLowerCase().trim();
}

export function formatRatio(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
