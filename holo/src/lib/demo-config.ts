// Simulated "today" for the demo — anchored to the morning of 2025-03-10.
// Seed dates match the case-study sample CSVs verbatim.
// At this moment: orders 1001-1003 are delivered, 1004 is freshly packed
// (ships in a few hours), 1005 is open and awaits tomorrow's harvest.
export const DEMO_TODAY = "2025-03-10";

export function addDaysISO(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
