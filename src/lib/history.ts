// Scan history and the next check-in, kept in this browser only. Only scores are stored, never photos.

import { DEMO_LATER_SCORES, DEMO_SCORES } from "./demo";
import type { Scores } from "./skin-concerns";

export type ScanRecord = {
  id: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  scores: Scores;
  source: "photo" | "sample" | "demo";
};

export type Checkin = { date: string; confirmedOn: string };

const SCANS_KEY = "cc:scans:v1";
const CHECKIN_KEY = "cc:checkin:v1";
const MAX_SCANS = 12;

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

export const today = () => new Date().toISOString().slice(0, 10);

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((new Date(`${b}T12:00:00Z`).getTime() - new Date(`${a}T12:00:00Z`).getTime()) / 86_400_000);
}

export const loadScans = (): ScanRecord[] =>
  (read<ScanRecord[]>(SCANS_KEY) ?? []).sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

export function addScan(scores: Scores, source: ScanRecord["source"]): ScanRecord {
  const rec: ScanRecord = { id: `s${Date.now().toString(36)}`, date: today(), scores, source };
  write(SCANS_KEY, [...loadScans(), rec].slice(-MAX_SCANS));
  return rec;
}

export const clearScans = () => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SCANS_KEY);
  } catch {
    // ignore
  }
};

/** Two fictional scans five weeks apart, replacing any saved history. */
export function loadDemoScans(): ScanRecord[] {
  const t = today();
  const demo: ScanRecord[] = [
    { id: "demo-1", date: addDays(t, -35), scores: DEMO_SCORES, source: "demo" },
    { id: "demo-2", date: t, scores: DEMO_LATER_SCORES, source: "demo" },
  ];
  write(SCANS_KEY, demo);
  return demo;
}

export const loadCheckin = (): Checkin | null => read<Checkin>(CHECKIN_KEY);
export const saveCheckin = (c: Checkin) => write(CHECKIN_KEY, c);
export const clearCheckin = () => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CHECKIN_KEY);
  } catch {
    // ignore
  }
};

/** A calendar reminder file (.ics) for the check-in, created in the browser on request. */
export function checkinIcs(date: string): string {
  const d = date.replaceAll("-", "");
  const end = addDays(date, 1).replaceAll("-", "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Counter Check//EN",
    "BEGIN:VEVENT",
    `UID:counter-check-${d}@local`,
    `DTSTAMP:${today().replaceAll("-", "")}T000000Z`,
    `DTSTART;VALUE=DATE:${d}`,
    `DTEND;VALUE=DATE:${end}`,
    "SUMMARY:Counter Check: re-scan your skin",
    "DESCRIPTION:Same light, no makeup, front-facing photo. Compare with your last scan.",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
