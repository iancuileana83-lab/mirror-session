// "Is it working?": an honest comparison of two scans. Rules only.
// Scan scores come from a photo and move by several points with light, angle and makeup,
// so only a clear difference counts as a change, and nothing here claims a cause.

import { daysBetween, addDays, today, type ScanRecord } from "./history";
import { CONCERNS, type ConcernId } from "./skin-concerns";

/** A difference smaller than this many points is treated as "no clear change". */
export const CHANGE_THRESHOLD = 10;

/** A fair gap between scans, in days (4 to 6 weeks). */
export const FAIR_MIN_DAYS = 28;
export const FAIR_MAX_DAYS = 42;

export type Change = "better" | "worse" | "same";

export type Row = { id: ConcernId; label: string; before: number; after: number; delta: number; change: Change };

export type Comparison = {
  rows: Row[];
  better: number;
  worse: number;
  same: number;
  days: number;
  weeks: number;
  /** Plain sentences about the timing. */
  timing: string | null;
  summary: string;
};

export function compareScans(a: ScanRecord, b: ScanRecord): Comparison {
  const rows: Row[] = [];
  for (const c of CONCERNS) {
    const before = a.scores[c.id];
    const after = b.scores[c.id];
    if (typeof before !== "number" || typeof after !== "number") continue;
    const delta = Math.round(after - before);
    rows.push({
      id: c.id,
      label: c.label,
      before: Math.round(before),
      after: Math.round(after),
      delta,
      change: delta >= CHANGE_THRESHOLD ? "better" : delta <= -CHANGE_THRESHOLD ? "worse" : "same",
    });
  }
  const better = rows.filter((r) => r.change === "better").length;
  const worse = rows.filter((r) => r.change === "worse").length;
  const same = rows.length - better - worse;
  const days = daysBetween(a.date, b.date);
  const weeks = Math.round((days / 7) * 10) / 10;

  let timing: string | null = null;
  if (days < FAIR_MIN_DAYS)
    timing = `These scans are only ${days <= 0 ? "a few hours" : `${days} days`} apart. Skin changes slowly: 4 to 6 weeks apart is a fairer comparison.`;
  else if (days > FAIR_MAX_DAYS * 2)
    timing = `These scans are ${Math.round(weeks)} weeks apart, so a lot may have changed besides your routine.`;

  let summary: string;
  if (rows.length === 0) summary = "There are no concerns scored in both scans to compare.";
  else {
    const verb = (n: number) => (n === 1 ? "looks" : "look");
    summary = `${better} of ${rows.length} concerns ${verb(better)} better, ${worse} ${verb(worse)} worse and ${same} ${same === 1 ? "shows" : "show"} no clear change.`;
    summary += " The scan cannot tell why a score moved: light, angle, makeup, season and your routine can all play a part.";
  }
  return { rows, better, worse, same, days, weeks, timing, summary };
}

/** The coach's proposed next check-in: 4 weeks after the last scan, but never in the past. */
export function proposeCheckin(lastScan: ScanRecord | null): string {
  const base = lastScan ? addDays(lastScan.date, FAIR_MIN_DAYS) : addDays(today(), FAIR_MIN_DAYS);
  const tomorrow = addDays(today(), 1);
  return base < tomorrow ? tomorrow : base;
}

export const FAIR_TIPS = [
  "Same light: daylight from a window, not a lamp from the side.",
  "No makeup, a clean face, hair off the face, front-facing.",
  "Same distance, with the face filling most of the frame.",
  "Same time of day if you can.",
];
