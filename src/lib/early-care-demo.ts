// Generated visual-example data supplied by the user; not clinical observations.
export const EARLY_CARE_DEMO = Array.from({ length: 36 }, (_, i) => ({
  date: new Date(Date.UTC(2024, 0, i + 1)),
  day: i + 1,
  desktop: Math.max(10, Math.floor(180 + Math.sin(i / 4.77) * 38 + Math.cos(i / 1.7) * 24 + Math.sin(i / 0.61) * 14 + Math.cos(i / 0.31) * 8)),
  mobile: Math.max(10, Math.floor(198 + Math.sin((i + 17) / 4.77) * 41 + Math.cos((i + 7) / 1.7) * 24 + Math.sin((i + 3) / 0.61) * 14 + Math.cos((i + 11) / 0.31) * 8)),
}));
