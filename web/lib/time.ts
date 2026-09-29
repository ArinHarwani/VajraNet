// lib/time.ts - Time utilities compliant with PRD_00 §7

/**
 * Converts a UTC ISO-8601 string (e.g. 2025-05-15T09:30:00Z) to formatted IST (UTC + 05:30).
 * Always explicitly labels the output with "IST".
 */
export function formatUtcToIst(utcIso: string, includeDate = false): string {
  if (!utcIso) return "N/A";
  const date = new Date(utcIso);
  if (isNaN(date.getTime())) return "Invalid Time";

  // Format in Asia/Kolkata timezone
  const timeFormatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const timeStr = timeFormatter.format(date);

  if (includeDate) {
    const dateFormatter = new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
    });
    return `${dateFormatter.format(date)}, ${timeStr} IST`;
  }

  return `${timeStr} IST`;
}

/**
 * Computes verification valid_start for a forecast issued at T for lead L:
 * valid_start = T + L - 30min (PRD_00 §7)
 */
export function computeValidStart(issueIso: string, leadMin: number): string {
  const d = new Date(issueIso);
  const offsetMs = (leadMin - 30) * 60 * 1000;
  const validD = new Date(d.getTime() + offsetMs);
  return validD.toISOString().replace(/\.\d{3}Z$/, "Z");
}

/**
 * Formats ETA window [min, max] or single number in human readable form.
 */
export function formatEta(eta: [number, number] | number | null): string {
  if (eta === null || eta === undefined) return "No threat imminent";
  if (Array.isArray(eta)) {
    if (eta[0] === 0 && eta[1] <= 10) return "Imminent / Underway";
    return `${eta[0]}–${eta[1]} min`;
  }
  if (eta <= 0) return "Imminent / Underway";
  return `~${Math.round(eta)} min`;
}
