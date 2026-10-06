export type Reading = {
  day: number;
  date: Date;
  area: number; // cm²
  redness: number; // 0-100 %
  temp: number; // °C
  ph: number;
  moisture: "dry" | "moist" | "wet";
};

export type Scored = Reading & { score: number; status: "on-track" | "watch" | "at-risk" };

export type ImageRegion = { x: number; y: number; width: number; height: number };

// ponytail: transparent rule-based score, no ML. Swap with model later.
export function scoreReading(r: Reading, prev?: Reading): Scored {
  let s = 100;
  if (r.redness > 45) s -= 20;
  else if (r.redness > 30) s -= 12;
  else if (r.redness > 20) s -= 6;

  if (prev) {
    const shrink = (prev.area - r.area) / prev.area;
    if (r.area > prev.area) s -= 25;
    else if (shrink < 0.05) s -= 12;
  }

  if (r.temp >= 38) s -= 20;
  else if (r.temp >= 37.5) s -= 10;

  if (r.ph >= 7.5) s -= 15;
  else if (r.ph >= 7.0) s -= 8;

  if (r.moisture === "wet") s -= 10;
  if (r.moisture === "dry") s -= 8;

  s = Math.max(0, Math.min(100, Math.round(s)));
  const status = s >= 80 ? "on-track" : s >= 50 ? "watch" : "at-risk";
  return { ...r, score: s, status };
}

export function scoreSeries(readings: Reading[]): Scored[] {
  return readings.map((r, i) => scoreReading(r, i > 0 ? readings[i - 1] : undefined));
}

export function earlyWarning(series: Scored[]): string | null {
  const last = series[series.length - 1];
  if (!last) return null;
  if (last.status === "at-risk")
    return `Day ${last.day}: Healing Score ${last.score} — early impaired-healing signal. Area stall + temp/pH drift precede visual pus by ~48h. Escalate review.`;
  if (last.status === "watch")
    return `Day ${last.day}: Score ${last.score} — healing slowing. Watch: re-measure in 24h, check temp/pH trend.`;
  return null;
}

const d = (day: number) =>
  new Date(Date.now() - (6 - day) * 24 * 3600 * 1000);

export const DEMO_NORMAL: Reading[] = [
  { day: 1, date: d(1), area: 8.2, redness: 42, temp: 37.8, ph: 7.1, moisture: "moist" },
  { day: 2, date: d(2), area: 7.4, redness: 36, temp: 37.4, ph: 6.8, moisture: "moist" },
  { day: 3, date: d(3), area: 6.3, redness: 28, temp: 37.0, ph: 6.4, moisture: "moist" },
  { day: 4, date: d(4), area: 5.2, redness: 20, temp: 36.8, ph: 6.1, moisture: "moist" },
  { day: 5, date: d(5), area: 4.1, redness: 14, temp: 36.7, ph: 5.9, moisture: "moist" },
];

export const DEMO_IMPAIRED: Reading[] = [
  { day: 1, date: d(1), area: 8.0, redness: 40, temp: 37.7, ph: 7.0, moisture: "moist" },
  { day: 2, date: d(2), area: 7.6, redness: 38, temp: 37.6, ph: 7.1, moisture: "moist" },
  { day: 3, date: d(3), area: 7.5, redness: 44, temp: 38.0, ph: 7.4, moisture: "wet" },
  // ponytail: the wow moment — score drops day 4 while wound still "looks okay"
  { day: 4, date: d(4), area: 7.6, redness: 52, temp: 38.3, ph: 7.7, moisture: "wet" },
  { day: 5, date: d(5), area: 8.1, redness: 61, temp: 38.6, ph: 7.9, moisture: "wet" },
];

export function isRedDominantPixel(red: number, green: number, blue: number): boolean {
  return red > 120 && red > green + 25 && red > blue + 15;
}

// Redness estimate from the selected region: count red-dominant pixels. Runs fully client-side.
export function estimateRedness(img: HTMLImageElement, region?: ImageRegion): number {
  const c = document.createElement("canvas");
  const N = 96;
  const selected = region ?? { x: 0, y: 0, width: 1, height: 1 };
  const sourceX = Math.round(img.naturalWidth * selected.x);
  const sourceY = Math.round(img.naturalHeight * selected.y);
  const sourceWidth = Math.max(1, Math.round(img.naturalWidth * selected.width));
  const sourceHeight = Math.max(1, Math.round(img.naturalHeight * selected.height));
  const scale = Math.min(1, N / Math.max(sourceWidth, sourceHeight));
  c.width = Math.max(1, Math.round(sourceWidth * scale));
  c.height = Math.max(1, Math.round(sourceHeight * scale));
  const ctx = c.getContext("2d");
  if (!ctx) return 30;
  ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, c.width, c.height);
  const px = ctx.getImageData(0, 0, c.width, c.height).data;
  let red = 0,
    total = 0;
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i],
      g = px[i + 1],
      b = px[i + 2];
    total++;
    if (isRedDominantPixel(r, g, b)) red++;
  }
  return Math.round((red / Math.max(1, total)) * 100);
}
