"use client";

import { curveNatural } from "@visx/curve";
import { ArrowRight } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { ComposedChart } from "@/components/charts/composed-chart";
import { Grid } from "@/components/charts/grid";
import { Area } from "@/components/charts/area";
import { Line } from "@/components/charts/line";
import { ReferenceArea } from "@/components/charts/reference-area";
import { SeriesBar } from "@/components/charts/series-bar";
import { ChartTooltip } from "@/components/charts/tooltip/chart-tooltip";
import { TooltipContent } from "@/components/charts/tooltip/tooltip-content";
import { XAxis } from "@/components/charts/x-axis";
import { YAxis } from "@/components/charts/y-axis";
import { WOUND_COHORT_SIZES, WOUND_HEALING_EVIDENCE } from "@/lib/wound-evidence";
import { EARLY_CARE_DEMO } from "@/lib/early-care-demo";

const SERIES = [
  { key: "early", label: "Within 4 weeks", color: "var(--forest)" },
  { key: "intermediate", label: "4–12 weeks", color: "var(--chart-2)" },
  { key: "late", label: "After 12 weeks", color: "var(--slate)" },
] as const;

const COMPLICATIONS = [
  { title: "Cellulitis", description: "Bacteria entering broken skin can infect deeper skin layers. Without prompt treatment, infection can spread further.", href: "https://www.nhs.uk/conditions/cellulitis/", label: "Skin infection" },
  { title: "Osteomyelitis", description: "A wound or nearby infection can put bone at risk. Untreated bone infection can cause lasting damage.", href: "https://www.nhs.uk/conditions/osteomyelitis/", label: "Bone infection" },
  { title: "Sepsis", description: "An infected wound can trigger a life-threatening reaction to infection. Sepsis needs urgent hospital treatment.", href: "https://www.nhs.uk/conditions/sepsis/", label: "A whole-body emergency" },
];

function formatDemoDay(date: Date) {
  return `Day ${Math.round((date.getTime() - EARLY_CARE_DEMO[0].date.getTime()) / 86400000) + 1}`;
}

export default function EarlyCareSection() {
  const reducedMotion = useReducedMotion();

  return (
    <section id="early-care" aria-labelledby="early-care-title" className="rounded-[14px] bg-mint p-6 sm:p-10 lg:p-[42px]">
      <div className="grid items-end gap-7 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
        <div>
          <p className="eyebrow mb-3">Why earlier care matters</p>
          <h2 id="early-care-title" className="section-title max-w-[17ch]">Earlier diagnosis.<br />Linked to faster healing.</h2>
          <p className="mt-5 max-w-[48ch] text-sm leading-relaxed text-forest-muted">A wound that isn’t healing deserves a closer look. Published research links earlier diagnosis with faster healing.</p>
        </div>
        <div className="border-t border-forest/20 pt-5 lg:border-t-0 lg:pt-0">
          <p className="font-display text-[72px] leading-none tabular-nums text-forest">57<span className="text-[40px]">%</span></p>
          <p className="mt-3 max-w-[38ch] text-sm leading-relaxed text-forest">delayed treatment because they thought their wound would heal on its own.</p>
          <p className="mt-3 text-xs leading-relaxed text-forest-muted">US online pilot survey · 780 respondents with wounds open for at least 4 weeks · Surveyed 2021–2022.</p>
          <a href="https://doi.org/10.12968/jowc.2024.0109" target="_blank" rel="noreferrer" className="mt-1 inline-flex min-h-11 items-center text-xs text-forest underline">Read the 2024 survey <span className="sr-only">(opens in a new tab)</span></a>
        </div>
      </div>

      <figure aria-labelledby="healing-evidence-title" aria-describedby="healing-evidence-caption" className="mt-8 rounded-[14px] bg-cream p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 id="healing-evidence-title" className="text-sm font-medium text-forest">A monitoring timeline</h3>
            <p className="mt-1 text-xs leading-relaxed text-forest-muted">36 daily sample values · Relative units</p>
          </div>
          <p className="rounded-full bg-keylime px-3 py-2 text-xs text-forest">Illustrative data</p>
        </div>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-xs text-forest">
          <span className="flex items-center gap-2"><span aria-hidden="true" className="h-3 w-3 bg-forest" /> Sample daily values</span>
          <span className="flex items-center gap-2"><span aria-hidden="true" className="h-0.5 w-5 bg-chart-2" /> Sample trend</span>
        </div>
        <ComposedChart
          data={EARLY_CARE_DEMO}
          aspectRatio=""
          className="mt-5 h-[300px] !touch-pan-y sm:h-[350px]"
          margin={{ top: 24, right: 14, bottom: 40, left: 38 }}
          barGap={0}
          animationDuration={reducedMotion ? 0 : 1100}
          animationEasing="cubic-bezier(0.85, 0, 0.15, 1)"
        >
          <Grid horizontal />
          <ReferenceArea y1={160} y2={220} fill="color-mix(in oklch, var(--chart-foreground-muted) 15%, transparent)" fillOpacity={1} stroke="var(--chart-foreground-muted)" strokeStyle="dashed" strokeDasharray="4,4" fadeEdges fadeEdgesLength={10} axisLabelColor="var(--chart-1)" showMarkers markerColor="var(--chart-1)" yAxisId="left" />
          <SeriesBar dataKey="desktop" radius={0} fill="var(--chart-1)" animate={!reducedMotion} />
          <Area dataKey="mobile" curve={curveNatural} fillOpacity={0.3} fadeEdges fill="var(--chart-2)" animate={!reducedMotion} showLine={false} />
          <Line dataKey="mobile" curve={curveNatural} strokeWidth={2} fadeEdges stroke="var(--chart-2)" animate={!reducedMotion} />
          <XAxis numTicks={4} tickerHalfWidth={25} formatDate={formatDemoDay} />
          <YAxis numTicks={4} />
          <ChartTooltip
            showDatePill={false}
            content={({ point }) => <TooltipContent title={`Day ${point.day} · Illustrative`} rows={[
              { color: "var(--chart-1)", label: "Sample daily value", value: Number(point.desktop) },
              { color: "var(--chart-2)", label: "Sample trend", value: Number(point.mobile) },
            ]} />}
          />
        </ComposedChart>
        <figcaption id="healing-evidence-caption" className="mt-4 border-t border-border pt-4 text-xs leading-relaxed text-forest-muted">
          This chart uses generated example values to illustrate a monitoring timeline. It does not show patient counts, disease risk or clinical outcomes. The shaded reference band is a visual example, not a medical threshold.
        </figcaption>
        <details className="mt-2">
          <summary className="flex min-h-11 list-none items-center justify-between gap-3 text-xs text-forest">View published healing evidence <span aria-hidden="true">+</span></summary>
          <p className="my-3 text-xs leading-relaxed text-forest-muted">Separate from the illustrative chart: Helsinki cohort, 182 patients. Percentages below are published healed-wound counts divided by original group sizes, unadjusted for censored follow-up. The study measured diagnostic delay, including delays within health services.</p>
          <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC12081063/" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-xs text-forest underline">Ahmajärvi et al., International Wound Journal (2025)<span className="sr-only"> (opens in a new tab)</span></a>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[380px] text-left text-xs tabular-nums text-forest">
              <caption className="sr-only">Published healed-wound counts and unadjusted percentages by diagnostic delay and months since wound onset</caption>
              <thead><tr><th scope="col" className="py-3 pr-4 font-medium">Time to diagnosis</th>{WOUND_HEALING_EVIDENCE.map(({ month }) => <th key={month} scope="col" className="py-3 pr-4 font-medium">{month} months</th>)}</tr></thead>
              <tbody>{SERIES.map(({ key, label }) => <tr key={key} className="border-t border-border"><th scope="row" className="py-3 pr-4 font-medium">{label}</th>{WOUND_HEALING_EVIDENCE.map((point) => <td key={point.month} className="py-3 pr-4"><span className="block">{point[key].toFixed(1)}%</span><span className="mt-1 block text-forest-muted">{point.healed[key]} / {WOUND_COHORT_SIZES[key]}</span></td>)}</tr>)}</tbody>
            </table>
          </div>
        </details>
      </figure>

      <div className="mt-9">
        <h3 className="font-display text-[30px] leading-tight text-forest">When infection goes untreated.</h3>
        <p className="mt-3 max-w-[66ch] text-sm leading-relaxed text-forest-muted">These are possible complications of wound infection. They aren’t inevitable, and the studies above don’t estimate your individual risk.</p>
        <div className="mt-5 grid gap-x-8 md:grid-cols-3">
          {COMPLICATIONS.map(({ title, description, href, label }) => (
            <div key={title} className="border-t border-forest/20 pt-5">
              <p className="text-xs text-forest-muted">{label}</p>
              <h4 className="font-display mt-2 text-[28px] leading-tight text-forest">{title}</h4>
              <p className="mt-3 text-[13px] leading-relaxed text-forest-muted">{description}</p>
              <a href={href} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-11 items-center text-xs text-forest underline">Read NHS guidance<span className="sr-only"> on {title} (opens in a new tab)</span></a>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-forest/20 pt-5">
        <p className="max-w-[60ch] text-xs leading-relaxed text-forest-muted">A change worth noticing is a change worth discussing with a clinician.</p>
        <a href="#analyzer" className="inline-flex min-h-11 items-center gap-3 text-sm text-forest underline">Explore the analyzer <ArrowRight className="size-4" /></a>
      </div>
    </section>
  );
}
