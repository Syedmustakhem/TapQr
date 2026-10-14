// src/api/utils.ts
//
// Small shared helpers for API response parsing.
// Mirrors the defensive parsing used by the TapQR web dashboard.

/**
 * Coerce an unknown API value to a finite number.
 * The backend sometimes returns numeric strings.
 */
export function toNumber(
  value: unknown
): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Format an ISO timestamp as a human-friendly
 * relative time ("2 min ago"). Mirrors the web
 * dashboard's formatNotificationTime helper.
 */
export function relativeTime(
  value: string
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  const diff =
    Date.now() - date.getTime();

  const seconds = Math.floor(
    diff / 1000
  );

  if (seconds < 30) {
    return "Just now";
  }

  if (seconds < 60) {
    return `${seconds}s ago`;
  }

  const minutes = Math.floor(
    seconds / 60
  );

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(
    minutes / 60
  );

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(
    hours / 24
  );

  if (days < 7) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString(
    undefined,
    {
      day: "2-digit",
      month: "short",
    }
  );
}

/**
 * Format a number with Indian digit grouping,
 * matching the web dashboard.
 */
export function formatCount(
  value: number
): string {
  return new Intl.NumberFormat(
    "en-IN"
  ).format(value);
}
