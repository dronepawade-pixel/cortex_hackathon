"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import {
  ArrowDown,
  ArrowRight,
  Camera,
  Check,
  ChevronDown,
  Leaf,
  RotateCcw,
  TriangleAlert,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import HeroWalkthrough from "@/components/hero-walkthrough";
import EarlyCareSection from "@/components/early-care-section";
import { LineChart } from "@/components/charts/line-chart";
import { Line } from "@/components/charts/line";
import { AreaChart } from "@/components/charts/area-chart";
import { Area } from "@/components/charts/area";
import { Gauge } from "@/components/charts/gauge";
import { Grid } from "@/components/charts/grid";
import { XAxis } from "@/components/charts/x-axis";
import { YAxis } from "@/components/charts/y-axis";
import { ChartTooltip } from "@/components/charts/tooltip/chart-tooltip";
import WoundCrop from "@/components/wound-crop";
import {
  DEMO_IMPAIRED,
  DEMO_NORMAL,
  earlyWarning,
  scoreReading,
  scoreSeries,
  type Scored,
} from "@/lib/healing";

const FOREST = "var(--forest)";
const FIELDS = [
  {
    key: "area", label: "Wound area", unit: "cm²", min: 1, max: 15, step: 0.1,
    hint: "Use the same measurement method each time.",
  },
  {
    key: "temp", label: "Skin temperature", unit: "°C", min: 35, max: 40, step: 0.1,
    hint: "Measure the skin around the wound.",
  },
  {
    key: "ph", label: "pH level", unit: "pH", min: 5, max: 9, step: 0.1,
    hint: "Enter the reading from your pH strip.",
  },
  {
    key: "redness", label: "Redness", unit: "%", min: 0, max: 100, step: 1,
    hint: "Estimated from your photo; adjust if needed.",
  },
] as const;

const INITIAL_MEASUREMENTS = { area: "7.8", temp: "38.1", ph: "7.4", redness: "48" };
type Measurements = typeof INITIAL_MEASUREMENTS;
type Demo = "impaired" | "normal";

function StatusBadge({ status }: { status: Scored["status"] }) {
  const color = status === "on-track"
    ? "bg-mint text-forest"
    : status === "watch"
      ? "bg-[#f2e9cf] text-[#6e4e15]"
      : "bg-[#f7e6df] text-[#963a30]";
  return (
    <Badge className={`h-auto gap-1.5 rounded-full border-0 px-3 py-1.5 text-xs font-medium ${color}`}>
      {status === "on-track" ? <Check className="size-3" /> : <TriangleAlert className="size-3" />}
      {status === "on-track" ? "On track" : status === "watch" ? "Needs attention" : "At risk"}
    </Badge>
  );
}

export default function Home() {
  const [demo, setDemo] = useState<Demo>("impaired");
  const base = demo === "impaired" ? DEMO_IMPAIRED : DEMO_NORMAL;
  const series = useMemo(() => scoreSeries(base), [base]);
  const current = series[series.length - 1];
  const warning = earlyWarning(series);
  const [measurements, setMeasurements] = useState<Measurements>(INITIAL_MEASUREMENTS);
  const [moisture, setMoisture] = useState<"dry" | "moist" | "wet">("wet");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [photoLoading, setPhotoLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const photoRequest = useRef(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => () => {
    photoRequest.current += 1;
  }, []);
  useEffect(() => () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
  }, [photoUrl]);

  const invalidFields = FIELDS.filter(({ key, min, max }) => {
    const value = Number(measurements[key]);
    return measurements[key].trim() === "" || !Number.isFinite(value) || value < min || value > max;
  });
  const live = invalidFields.length === 0
    ? scoreReading({
        day: current.day + 1,
        date: new Date(),
        area: Number(measurements.area),
        temp: Number(measurements.temp),
        ph: Number(measurements.ph),
        redness: Number(measurements.redness),
        moisture,
      }, current)
    : null;
  const chartData = useMemo(() => series.map((reading) => ({
    date: reading.date,
    score: reading.score,
    area: reading.area,
  })), [series]);

  function removePhoto() {
    photoRequest.current += 1;
    setPhotoUrl(null);
    setPhotoError("");
    setPhotoLoading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function resetReading(nextDemo: Demo = demo) {
    const previous = (nextDemo === "impaired" ? DEMO_IMPAIRED : DEMO_NORMAL).at(-1)!;
    setMeasurements(nextDemo === "impaired" ? INITIAL_MEASUREMENTS : {
      area: String(previous.area),
      temp: String(previous.temp),
      ph: String(previous.ph),
      redness: String(previous.redness),
    });
    setMoisture(nextDemo === "impaired" ? "wet" : "moist");
    removePhoto();
  }

  function selectDemo(nextDemo: Demo) {
    setDemo(nextDemo);
    resetReading(nextDemo);
  }

  async function onPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) {
      setPhotoError("Choose an image smaller than 10 MB, then try again.");
      return;
    }
    const request = ++photoRequest.current;
    const url = URL.createObjectURL(file);
    setPhotoError("");
    setPhotoLoading(true);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      if (request !== photoRequest.current) {
        URL.revokeObjectURL(url);
        return;
      }
      setPhotoUrl(url);
      setMeasurements((values) => ({ ...values, redness: "" }));
    } catch {
      URL.revokeObjectURL(url);
      if (request === photoRequest.current) setPhotoError("We couldn’t read that photo. Try a JPG, PNG, or WebP image.");
    } finally {
      if (request === photoRequest.current) setPhotoLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1240px] overflow-x-clip px-4 sm:px-7 lg:px-10">
      <a href="#analyzer" className="sr-only z-50 rounded-lg bg-forest p-4 text-cream focus:not-sr-only focus:absolute focus:top-3">Skip to analyzer</a>

      <header className="flex min-h-20 flex-wrap items-center justify-between gap-x-4 gap-y-2 py-4 sm:min-h-28 sm:py-5">
        <a href="#" aria-label="ScanAid home" className="flex min-h-11 items-center gap-2.5 text-forest">
          <span className="grid size-9 place-items-center rounded-full bg-keylime"><Leaf className="size-5" strokeWidth={1.5} /></span>
          <span className="text-xl font-semibold tracking-tight">ScanAid<span className="text-forest-muted">.</span></span>
        </a>
        <nav aria-label="Main navigation" className="order-3 flex w-full items-center gap-5 overflow-x-auto text-[13px] text-forest-muted sm:gap-8 lg:order-none lg:w-auto">
          <a href="#analyzer" className="inline-flex min-h-11 shrink-0 items-center transition-colors hover:text-forest">Analyzer</a>
          <a href="#timeline" className="inline-flex min-h-11 shrink-0 items-center transition-colors hover:text-forest">Timeline</a>
          <a href="#indicators" className="inline-flex min-h-11 shrink-0 items-center transition-colors hover:text-forest">Indicators</a>
          <a href="#early-care" className="hidden min-h-11 shrink-0 items-center transition-colors hover:text-forest sm:inline-flex">Why early care</a>
        </nav>
        <a href="#analyzer" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-forest px-4 text-[13px] text-cream transition-colors hover:bg-[#0c2f10] sm:gap-3 sm:px-5">Try the demo <ArrowRight className="size-3.5" /></a>
      </header>

      <main>
        <section aria-labelledby="hero-title" className="grid gap-3 lg:grid-cols-[1fr_1.08fr]">
          <div className="flex flex-col justify-between rounded-[14px] bg-keylime px-5 py-7 sm:px-10 sm:py-12 lg:p-[42px]">
            <div>
              <p className="eyebrow flex items-center gap-2"><span className="size-1.5 rounded-full bg-forest" /> Intelligent wound-healing platform</p>
              <h1 id="hero-title" className="font-display mt-5 max-w-[12ch] text-[clamp(2.25rem,10vw,4.25rem)] leading-[1.02] text-forest sm:mt-7 sm:text-[clamp(2.75rem,6vw,4.25rem)]">Catch impaired healing.<br /><em className="not-italic text-forest-muted">Before the eye can.</em></h1>
              <p className="mt-5 max-w-[36ch] text-sm leading-relaxed text-forest-muted sm:mt-7 sm:text-[15px]">Start with a photo. Add a few simple measurements. See the signals behind your healing — with a transparent score that helps you know when to look closer.</p>
              <a href="#analyzer" className="group mt-6 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-[14px] bg-forest px-6 py-3.5 text-sm text-cream transition-colors hover:bg-[#0c2f10] sm:mt-8 sm:w-auto sm:justify-start sm:gap-6">Try the live analyzer <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transform-none" /></a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-forest/15 pt-5 text-xs text-forest-muted sm:mt-10 sm:gap-y-3">
              <span className="flex items-center gap-2"><Check className="size-3.5" /> Photos stay on your device</span>
              <span className="flex items-center gap-2"><Check className="size-3.5" /> No account needed</span>
            </div>
          </div>

          <HeroWalkthrough />
        </section>

        <div className="grid gap-5 border-b border-border py-7 sm:grid-cols-3 sm:gap-10 sm:py-10">
          {[
            ["0", "Personal photos uploaded", "Photo processing happens in your browser."],
            ["5", "Signals, one explainable score", "Area, redness, temperature, pH and moisture."],
            ["You + your clinician", "Always in control", "A triage aid, never a replacement for diagnosis."],
          ].map(([value, title, description]) => (
            <div key={title}>
              <p className={`mb-2 text-forest ${value.length > 2 ? "font-display text-[24px] leading-tight sm:text-[30px]" : "font-display text-[32px] leading-none tabular-nums sm:text-[40px]"}`}>{value}</p>
              <p className="text-xs font-medium text-forest">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-forest-muted">{description}</p>
            </div>
          ))}
        </div>

        <section id="analyzer" aria-labelledby="analyzer-title" className="py-12 sm:py-24">
          <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-6">
            <div><p className="eyebrow mb-3">Try it for yourself</p><h2 id="analyzer-title" className="section-title">A new reading.<br />A little more clarity.</h2></div>
            <p className="max-w-[32ch] text-sm leading-relaxed text-forest-muted">Explore a sample case, or add a photo and adjust the measurements to see the score respond.</p>
          </div>

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
            <fieldset className="flex flex-wrap items-center gap-2 sm:gap-3">
              <legend className="sr-only">Choose a sample case</legend>
              <span aria-hidden="true" className="text-xs text-forest-muted">Sample case</span>
              <div className="inline-flex max-w-full rounded-full bg-keylime p-1">
                {(["impaired", "normal"] as const).map((value) => (
                  <label key={value} className={`relative inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center whitespace-nowrap rounded-full px-3 text-xs transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-forest sm:flex-none sm:px-4 ${demo === value ? "bg-cream text-forest" : "text-forest-muted hover:text-forest"}`}>
                    <input
                      className="sr-only"
                      type="radio"
                      name="sample-case"
                      value={value}
                      checked={demo === value}
                      onChange={() => selectDemo(value)}
                    />
                    {value === "impaired" ? "Impaired healing" : "Normal healing"}
                  </label>
                ))}
              </div>
            </fieldset>
            <span className="text-xs text-forest-muted">Simulated history · Comparing with day {current.day}</span>
          </div>

          <div className="grid items-stretch gap-4 lg:grid-cols-[1.35fr_1fr]">
            <div className="min-w-0 rounded-[14px] bg-sage p-4 sm:p-8">
              <div className="mb-5 flex items-center justify-between gap-3 sm:mb-6">
                <h3 className="text-sm font-medium text-forest">Your measurements</h3>
                <Button variant="ghost" className="min-h-11 gap-2 rounded-full px-3 text-xs text-forest hover:bg-cream/40" onClick={() => resetReading()}>
                  <RotateCcw className="size-3.5" /> Reset
                </Button>
              </div>

              <input
                id="wound-photo"
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                tabIndex={-1}
                disabled={photoLoading}
                onChange={onPhoto}
                aria-label="Choose a wound photo"
              />
              {photoUrl ? <WoundCrop key={photoUrl} src={photoUrl} onRednessChange={(value) => setMeasurements((values) => ({ ...values, redness: String(value) }))} onClear={() => setMeasurements((values) => ({ ...values, redness: "" }))} /> : <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={photoLoading}
                aria-describedby="photo-hint photo-feedback"
                className="flex min-h-36 w-full flex-col items-center justify-center gap-2 rounded-[14px] bg-cream/80 px-5 py-7 text-center text-forest transition-colors hover:bg-cream disabled:cursor-wait disabled:opacity-70"
              >
                <span className="mb-1 grid size-10 place-items-center rounded-full bg-keylime"><Camera className="size-5" strokeWidth={1.5} /></span>
                <span className="text-sm font-medium">{photoLoading ? "Reading your photo…" : "Add a wound photo"}</span>
                <span id="photo-hint" className="text-xs text-forest-muted">Redness is calculated from your selected region · Max. 10 MB</span>
              </button>}
              <div id="photo-feedback" role="status" className="mt-2 text-xs leading-relaxed text-forest-muted">
                {photoError ? <span className="text-destructive">{photoError}</span> : photoUrl ? (
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5"><Check className="size-3.5" /> Photo stays on your device.</span>
                    <button type="button" onClick={removePhoto} className="inline-flex min-h-11 items-center gap-1.5 underline"><X className="size-3" /> Remove photo</button>
                  </span>
                ) : "No photo? You can still explore the sample measurements below."}
              </div>

              <div className="mt-6 grid gap-6 sm:mt-7 sm:grid-cols-2 sm:gap-7">
                {FIELDS.map(({ key, label, unit, min, max, step, hint }) => {
                  const invalid = invalidFields.some((field) => field.key === key);
                  return <div key={key} className="min-w-0">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <Label htmlFor={`reading-${key}`} className="min-w-0 flex-1 text-xs font-medium text-forest">{label}</Label>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Input
                          id={`reading-${key}`}
                          type="number"
                          inputMode="decimal"
                          required
                          min={min}
                          max={max}
                          step={step}
                          value={measurements[key]}
                          onChange={(event) => setMeasurements((values) => ({ ...values, [key]: event.target.value }))}
                          aria-invalid={invalid}
                          aria-describedby={`hint-${key}`}
                          className="h-11 w-[72px] rounded-lg border-0 bg-cream px-2 text-right text-sm tabular-nums text-forest sm:w-[76px]"
                        />
                        <span className="min-w-5 text-xs text-forest-muted">{unit}</span>
                      </div>
                    </div>
                    <Slider
                      value={[Math.max(min, Math.min(max, Number(measurements[key]) || min))]}
                      min={min}
                      max={max}
                      step={step}
                      aria-label={`${label} in ${unit}`}
                      onValueChange={(value) => setMeasurements((values) => ({ ...values, [key]: String(Array.isArray(value) ? value[0] : value) }))}
                      className="[&_[data-slot=slider-track]]:bg-forest/15 [&_[data-slot=slider-thumb]]:size-4"
                    />
                    <p id={`hint-${key}`} className={`mt-3 text-[11px] leading-relaxed ${invalid ? "text-destructive" : "text-forest-muted"}`}>
                      {invalid ? `Enter a value between ${min} and ${max} ${unit}.` : hint}
                    </p>
                  </div>;
                })}
              </div>
              <fieldset className="mt-6 border-t border-forest/15 pt-5 sm:mt-7">
                <legend className="sr-only">Moisture level</legend>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <span aria-hidden="true" className="text-xs font-medium text-forest">Moisture level</span>
                  <div className="grid grid-cols-3 gap-1 rounded-2xl bg-cream/60 p-1 sm:flex sm:rounded-full">
                    {(["dry", "moist", "wet"] as const).map((value) => (
                      <label key={value} className={`relative inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl px-2 text-xs capitalize transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-forest sm:rounded-full sm:px-5 ${moisture === value ? "bg-forest text-cream" : "text-forest hover:bg-cream"}`}>
                        <input
                          type="radio"
                          name="moisture"
                          value={value}
                          checked={moisture === value}
                          onChange={() => setMoisture(value)}
                          className="sr-only"
                        />
                        {value}
                      </label>
                    ))}
                  </div>
                </div>
              </fieldset>
            </div>

            <div className="flex min-w-0 flex-col rounded-[14px] bg-keylime p-4 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-sm font-medium text-forest">Reading insight</h3><span className="text-xs text-forest-muted">Day {current.day + 1} · Draft</span></div>
              {live ? <>
                <div className="my-6 flex flex-wrap items-end justify-between gap-3 sm:my-7"><div><p className="font-display text-[64px] leading-none tabular-nums text-forest sm:text-[80px]">{live.score}<span className="ml-2 font-sans text-sm text-forest-muted">/ 100</span></p><p className="mt-2 text-xs text-forest-muted">Healing Score</p></div><StatusBadge status={live.status} /></div>
                <Gauge orientation="linear" minWidth={0} value={live.score} activeFill={FOREST} inactiveFill={FOREST} inactiveFillOpacity={0.12} useGradient={false} linearHeight={14} spacing={30} />
                <div className="mt-6 sm:mt-7" role="status" aria-live="polite" aria-atomic="true"><h4 className="font-display text-[26px] leading-tight text-forest sm:text-[30px]">{live.status === "on-track" ? "Moving in the right direction." : live.status === "watch" ? "Worth a closer look." : "A signal to act sooner."}</h4><p className="mt-3 text-sm leading-relaxed text-forest-muted">{live.status === "on-track" ? "Area, redness, temperature and pH are converging toward the healthy range." : live.status === "watch" ? "Healing is slowing against the previous reading. Re-measure in 24 hours and check the temperature and pH trend." : "The measurements suggest an impaired-healing pattern. Ask a clinician to review the changes rather than waiting for visible signs."}</p></div>
                <dl className="mt-6 space-y-3 border-t border-forest/15 pt-5 text-xs sm:mt-7"><div className="flex justify-between gap-4"><dt className="text-forest-muted">Previous score</dt><dd className="tabular-nums text-forest">{current.score} / 100</dd></div><div className="flex justify-between gap-4"><dt className="text-forest-muted">Area vs. previous reading</dt><dd className="tabular-nums text-forest">{Number(measurements.area) > current.area ? "+" : ""}{(Number(measurements.area) - current.area).toFixed(1)} cm²</dd></div><div className="flex justify-between gap-4"><dt className="text-forest-muted">Recommended next step</dt><dd className="text-right text-forest">{live.status === "on-track" ? "Continue monitoring" : live.status === "watch" ? "Re-check in 24 hours" : "Clinician review"}</dd></div></dl>
              </> : <div className="my-10 flex-1" role="status"><TriangleAlert className="mb-4 size-6 text-forest" /><h4 className="font-display text-2xl text-forest sm:text-3xl">Let’s check those measurements.</h4><p className="mt-3 text-sm leading-relaxed text-forest-muted">Update the highlighted fields to see a score. Your other measurements and photo are kept.</p></div>}
              <div className="mt-auto pt-6 sm:pt-8"><p className="flex items-center gap-2 text-xs font-medium text-forest"><Leaf className="size-3.5" /> Transparent, rule-based scoring</p><p className="mt-2 text-[11px] leading-relaxed text-forest-muted">An early-warning triage aid, not a diagnosis. Final decisions stay with the clinician. Sample history is simulated; this reading is not saved.</p></div>
            </div>
          </div>
        </section>

        <section id="timeline" aria-labelledby="timeline-title" className="rounded-[14px] bg-slate p-4 sm:p-9 lg:p-[42px]">
          <div className="mb-6 flex flex-col gap-3 sm:mb-7 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-5"><div><p className="eyebrow mb-3">The story over time</p><h2 id="timeline-title" className="section-title max-w-[17ch]">A single photo is a moment.<br />A trend tells you more.</h2></div><a href="#analyzer" className="inline-flex min-h-11 items-center gap-2 text-xs text-forest underline">Change sample case <ArrowRight className="size-3.5" /></a></div>
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            <div className="min-w-0 overflow-hidden rounded-[14px] bg-cream p-3 sm:p-6">
              <div className="mb-3 flex items-start justify-between gap-3 sm:mb-4">
                <div className="min-w-0"><h3 className="text-sm font-medium text-forest">Healing score</h3><p className="mt-1 text-xs text-forest-muted">A higher score indicates better healing</p></div>
                <span className="shrink-0 text-sm tabular-nums text-forest">{current.score}<span className="text-xs text-forest-muted"> / 100</span></span>
              </div>
              <LineChart
                data={chartData}
                aspectRatio=""
                style={{ height: 220, touchAction: "pan-y pinch-zoom" }}
                margin={{ top: 12, right: 10, bottom: 36, left: 30 }}
                animationDuration={reducedMotion ? 0 : 800}
                yDomainTween={!reducedMotion}
              >
                <Grid horizontal />
                <Line dataKey="score" stroke={FOREST} strokeWidth={2.5} showMarkers />
                <XAxis numTicks={3} />
                <YAxis numTicks={4} />
                <ChartTooltip />
              </LineChart>
            </div>
            <div className="min-w-0 overflow-hidden rounded-[14px] bg-cream p-3 sm:p-6">
              <div className="mb-3 flex items-start justify-between gap-3 sm:mb-4">
                <div className="min-w-0"><h3 className="text-sm font-medium text-forest">Wound area</h3><p className="mt-1 text-xs text-forest-muted">Watch for contraction, stall or growth</p></div>
                <span className="shrink-0 text-sm tabular-nums text-forest">{current.area}<span className="text-xs text-forest-muted"> cm²</span></span>
              </div>
              <AreaChart
                data={chartData}
                aspectRatio=""
                style={{ height: 220, touchAction: "pan-y pinch-zoom" }}
                margin={{ top: 12, right: 10, bottom: 36, left: 30 }}
                animationDuration={reducedMotion ? 0 : 800}
                yDomainTween={!reducedMotion}
              >
                <Grid horizontal />
                <Area dataKey="area" fill={FOREST} stroke={FOREST} fillOpacity={0.1} />
                <XAxis numTicks={3} />
                <YAxis numTicks={4} />
                <ChartTooltip />
              </AreaChart>
            </div>
          </div>
          <div className="mt-5 flex items-start gap-3 text-sm leading-relaxed text-forest">{warning ? <TriangleAlert className="mt-1 size-4 shrink-0" /> : <Check className="mt-1 size-4 shrink-0" />}<p>{demo === "impaired" ? `In this simulated case, the area stalls on day 4 while temperature and pH rise. The score falls to ${series[3].score}, even when the photo may still look reassuring.` : "In this simulated case, wound area and redness decrease as temperature and pH settle. The score rises alongside the healing trend."}</p></div>
          <details className="mt-5 border-t border-forest/20 pt-4"><summary className="flex min-h-10 list-none items-center justify-between gap-3 text-xs text-forest">View the sample readings <ChevronDown className="size-4" /></summary><div className="mt-3 -mx-1 overflow-x-auto px-1 pb-1"><table className="w-full min-w-[460px] text-left text-xs tabular-nums text-forest"><caption className="sr-only">{demo === "impaired" ? "Impaired" : "Normal"} healing sample measurements</caption><thead><tr>{["Day", "Score", "Area (cm²)", "Temp (°C)", "pH", "Redness (%)"].map((label) => <th key={label} scope="col" className="pb-3 pr-4 font-medium">{label}</th>)}</tr></thead><tbody>{series.map((reading) => <tr key={reading.day} className="border-t border-forest/15"><th scope="row" className="py-3 pr-4 font-medium">{reading.day}</th><td className="pr-4">{reading.score}</td><td className="pr-4">{reading.area}</td><td className="pr-4">{reading.temp}</td><td className="pr-4">{reading.ph}</td><td>{reading.redness}</td></tr>)}</tbody></table></div></details>
        </section>

        <section id="indicators" aria-labelledby="indicators-title" className="py-12 sm:py-24">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.6fr] lg:gap-16">
            <div><p className="eyebrow mb-3">Measurable indicators</p><h2 id="indicators-title" className="section-title max-w-[12ch]">Small signals.<br />A fuller picture.</h2><p className="mt-4 max-w-[32ch] text-sm leading-relaxed text-forest-muted sm:mt-5">Healing is more than how a wound looks. Following these signals together brings changes into focus.</p><p className="mt-4 max-w-[32ch] text-xs leading-relaxed text-forest-muted sm:mt-6">The current score uses five measurements. Photo-based tissue analysis is part of the roadmap.</p></div>
            <div className="grid gap-x-8 sm:grid-cols-2">{[
              ["Area contraction", "Is the wound getting smaller? Shrinkage is encouraging; stalled or growing area needs attention."],
              ["Redness", "A persistent inflammatory signal. The photo estimates the proportion of red-dominant pixels."],
              ["Temperature", "Skin temperature around the wound adds context to changes in inflammation."],
              ["pH level", "A simple strip reading helps track whether the wound environment is changing."],
              ["Moisture", "Dry, moist or heavily wet: the wound’s moisture balance is another piece of the picture."],
              ["Tissue type", "Granulation, epithelial tissue and slough provide visual clues. Automated analysis is planned."],
            ].map(([title, description]) => <div key={title} className="border-t border-border py-5 sm:py-6"><h3 className="font-display text-[24px] leading-tight text-forest sm:text-[28px]">{title}</h3><p className="mt-2 text-[13px] leading-relaxed text-forest-muted sm:mt-3">{description}</p></div>)}</div>
          </div>
        </section>

        <EarlyCareSection />

        <section aria-labelledby="faq-title" className="py-12 sm:py-24"><div className="mb-6 flex items-center justify-between gap-4 sm:mb-7"><h2 id="faq-title" className="section-title">A few things to know.</h2><ArrowDown className="size-5 shrink-0 text-forest" strokeWidth={1.5} /></div>{[
          ["Is this a diagnosis?", "No. ScanAid is an early-warning triage aid. Its score supports a conversation with a clinician; it does not replace their assessment."],
          ["How is the score calculated?", "The prototype uses transparent rules for area change, redness, temperature, pH and moisture. It compares a new reading with the previous sample reading."],
          ["What happens to my photo?", "Redness is estimated in your browser. This prototype does not upload your photo or save your readings. Refreshing the page resets the demo."],
          ["What comes next?", "Dataset evaluation, preclinical studies and a clinical pilot are planned. Automated tissue analysis and smart-bandage integration are future work."],
        ].map(([question, answer]) => <div key={question} className="grid gap-2 border-t border-border py-5 sm:grid-cols-[1fr_1.15fr] sm:gap-12 sm:py-7"><h3 className="font-display text-[24px] leading-tight text-forest sm:text-[30px]">{question}</h3><p className="max-w-[56ch] text-sm leading-relaxed text-forest-muted">{answer}</p></div>)}</section>
      </main>

      <footer className="flex flex-col gap-6 border-t border-border py-8 text-xs text-forest-muted sm:flex-row sm:flex-wrap sm:items-start sm:justify-between"><div><a href="#" className="flex min-h-11 items-center gap-2 text-base font-semibold tracking-tight text-forest"><Leaf className="size-4" strokeWidth={1.5} /> ScanAid.</a><p className="mt-2">A little more clarity. A little earlier.</p></div><div className="max-w-[46ch] sm:text-right"><p>CXHPS07 · Hackathon prototype</p><p className="mt-2 leading-relaxed">Early indication only. Not a medical device.<br />Built with Next.js, shadcn/ui and bklit charts.</p></div></footer>
    </div>
  );
}
