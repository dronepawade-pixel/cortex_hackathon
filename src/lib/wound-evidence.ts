// Ahmajärvi et al., Int Wound J (2025), Table 5:
// https://pmc.ncbi.nlm.nih.gov/articles/PMC12081063/#iwj70141-tbl-0005
// Cumulative healed-wound counts, not Kaplan–Meier survival estimates.
export const WOUND_COHORT_SIZES = { early: 33, intermediate: 94, late: 55 };

const OBSERVED_HEALING = [
  { month: 3, healed: { early: 18, intermediate: 16, late: 0 } },
  { month: 6, healed: { early: 23, intermediate: 47, late: 9 } },
  { month: 12, healed: { early: 24, intermediate: 67, late: 26 } },
  { month: 18, healed: { early: 25, intermediate: 73, late: 35 } },
];

export const WOUND_HEALING_EVIDENCE = OBSERVED_HEALING.map(({ month, healed }) => ({
  // Encoding relative time on the chart's time axis; these are not study dates.
  date: new Date(Date.UTC(2000, month, 1)),
  month,
  healed,
  early: 100 * healed.early / WOUND_COHORT_SIZES.early,
  intermediate: 100 * healed.intermediate / WOUND_COHORT_SIZES.intermediate,
  late: 100 * healed.late / WOUND_COHORT_SIZES.late,
}));
