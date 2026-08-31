// Locale-proof date formatting. Plain `.toLocaleDateString()` renders
// differently depending on the browser's OS locale (M/D/Y on en-US,
// D/M/Y on en-GB) — the same timestamp reads as a different date to
// different users. These always render the same way everywhere.

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

/** "22 Jul 2026" */
export function formatDate(value: string | Date | null | undefined): string {
  const date = toDate(value);
  if (!date) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** "22 Jul 2026, 14:35" */
export function formatDateTime(value: string | Date | null | undefined): string {
  const date = toDate(value);
  if (!date) return "—";
  return `${formatDate(date)}, ${date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function calendarDaysBetween(
  from: string | Date,
  to: string | Date,
): number {
  const start = toDate(from);
  const end = toDate(to);
  if (!start || !end) return 0;
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.floor((endUtc - startUtc) / (1000 * 60 * 60 * 24));
}

export function daysActiveSince(start: string | Date, now = new Date()): number {
  return Math.max(0, calendarDaysBetween(start, now));
}

export function daysUntilStart(start: string | Date, now = new Date()): number {
  return Math.max(0, calendarDaysBetween(now, start));
}

export function daysUntilEnd(end: string | Date, now = new Date()): number {
  return Math.max(0, calendarDaysBetween(now, end));
}

export function localDateInputValue(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
