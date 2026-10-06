"use client";

import Image from "next/image";
import { useEffect, useReducer, useRef, useState, type CSSProperties } from "react";
import { useInView, useReducedMotion } from "motion/react";
import {
  ArrowRight, Check, CircleCheck, ImagePlus, Leaf, LockKeyhole,
  MousePointer2, Pause, Play, RotateCcw, ShieldCheck, Upload,
} from "lucide-react";
import LatticeLoader from "@/components/LatticeLoader";
import { estimateRedness } from "@/lib/healing";
import {
  DEMO_DURATION, INITIAL_PLAYBACK, SCAN_ENDS_AT, SCAN_STARTS_AT,
  demoStage, playbackReducer,
} from "@/lib/hero-demo";
import styles from "./hero-walkthrough.module.css";

export default function HeroWalkthrough() {
  const container = useRef<HTMLElement>(null);
  const pauseButton = useRef<HTMLButtonElement>(null);
  const inView = useInView(container, { amount: 0.25 });
  const reducedMotion = useReducedMotion();
  const [playback, dispatch] = useReducer(playbackReducer, INITIAL_PLAYBACK);
  const [redness, setRedness] = useState<number | null>(null);
  const [imageError, setImageError] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const elapsed = reducedMotion ? DEMO_DURATION : playback.elapsed;
  const stage = demoStage(elapsed);
  const done = stage === "done";
  const canPlay = redness != null && inView && pageVisible && !playback.paused && !reducedMotion
    && playback.elapsed < DEMO_DURATION && !imageError;
  const canLoop = redness != null && inView && pageVisible && !playback.paused && !reducedMotion
    && playback.elapsed >= DEMO_DURATION && !imageError;
  const paused = !canPlay;
  const step = done ? 2 : stage === "upload" ? 0 : 1;
  const analysisElapsed = Math.max(0, Math.min(elapsed, SCAN_ENDS_AT) - SCAN_STARTS_AT) / 1000;

  useEffect(() => {
    const onVisibilityChange = () => setPageVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  useEffect(() => {
    if (!canPlay) return;
    let previous = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      dispatch({ type: "tick", delta: now - previous });
      previous = now;
    }, 100);
    return () => window.clearInterval(timer);
  }, [canPlay]);

  useEffect(() => {
    if (!canLoop) return;
    const timer = window.setTimeout(() => dispatch({ type: "replay" }), 8000);
    return () => window.clearTimeout(timer);
  }, [canLoop, playback.iteration]);

  function replay() {
    if (imageError) {
      setImageError(false);
      setRedness(null);
    }
    dispatch({ type: "replay" });
  }

  const caption = imageError
    ? "The sample photo couldn’t load. Replay to try again."
    : done
      ? "Next, add area, temperature, pH and moisture for your healing score."
      : stage === "scanning"
        ? "A local pixel estimate looks for red-dominant areas in the photo."
        : stage === "uploaded"
          ? "Photo added. Processing happens right here on your device."
          : "Start with a clear wound photo. We’ll show you what happens next.";

  return (
    <aside
      ref={container}
      aria-label="Animated introduction to using ScanAid"
      className="flex min-w-0 flex-col overflow-hidden rounded-[14px] bg-slate p-3 sm:p-6 lg:p-7"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-4 sm:gap-3">
        <p className="flex items-center gap-2 text-xs text-forest"><span className="size-1.5 rounded-full bg-forest" /> See how it works</p>
        <div className="flex items-center gap-1">
          {!reducedMotion && (
            <button
              ref={pauseButton}
              type="button"
              aria-label={playback.paused ? "Resume demonstration" : "Pause demonstration"}
              title={playback.paused ? "Resume demonstration" : "Pause demonstration"}
              disabled={redness == null || imageError}
              onClick={() => dispatch({ type: "toggle-pause" })}
              className="grid size-11 place-items-center rounded-full text-forest transition-colors hover:bg-cream/50 disabled:opacity-35"
            >
              {playback.paused ? <Play className="size-4" /> : <Pause className="size-4" />}
            </button>
          )}
          <button type="button" onClick={replay} aria-label="Replay demonstration" title="Replay demonstration" className="grid size-11 place-items-center rounded-full text-forest transition-colors hover:bg-cream/50">
            <RotateCcw className="size-4" />
          </button>
        </div>
      </div>

      <div className={styles.window}>
        <div className="flex items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-5 sm:py-4">
          <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-forest"><Leaf className="size-4 shrink-0" strokeWidth={1.5} /> <span className="truncate">Photo analyzer</span></span>
          <span className="shrink-0 rounded-full bg-keylime px-3 py-1.5 text-[10px] text-forest">Guided demo</span>
        </div>

        <div
          key={playback.iteration}
          data-paused={paused}
          data-reduced={!!reducedMotion}
          data-error={imageError}
          className={styles.scene}
          style={{
            "--demo-duration": `${DEMO_DURATION}ms`,
            "--demo-delay": `-${playback.offset}ms`,
          } as CSSProperties}
        >
          <div className={styles.photoFrame}>
            <div className={styles.samplePhoto} aria-hidden={stage === "upload" || imageError}>
              <Image
                src="/hero-wound.webp"
                alt="Sample photo of an abrasion on a hand"
                fill
                preload
                sizes="(max-width: 640px) 90vw, (max-width: 1024px) 85vw, 520px"
                className="object-cover object-[50%_58%]"
                onLoad={(event) => {
                  try { setRedness(estimateRedness(event.currentTarget)); }
                  catch { setImageError(true); }
                }}
                onError={() => setImageError(true)}
              />
            </div>

            <div className={styles.uploadPanel} aria-hidden={stage !== "upload"}>
              <div className={styles.uploadContent}>
                <span className="mb-3 grid size-12 place-items-center rounded-full bg-mint text-forest sm:mb-4 sm:size-14"><ImagePlus className="size-5 sm:size-6" strokeWidth={1.5} /></span>
                <p className="font-display mb-2 text-[24px] leading-[1.15] text-forest sm:text-[30px]">Every reading starts here.</p>
                <p className="mb-4 text-xs text-forest-muted sm:mb-5">One photo. A little more insight.</p>
                <button
                  type="button"
                  disabled={redness == null || imageError}
                  tabIndex={stage === "upload" ? 0 : -1}
                  onClick={() => {
                    dispatch({ type: "upload" });
                    pauseButton.current?.focus({ preventScroll: true });
                  }}
                  className={styles.uploadButton}
                >
                  <Upload className="size-4" /> Upload a wound photo
                </button>
              </div>
            </div>

            <div className={styles.clickRing} aria-hidden="true" />
            <div className={styles.cursor} aria-hidden="true">
              <MousePointer2 className="size-7 fill-cream text-forest" strokeWidth={1.75} />
              <span className="ml-5 rounded-full bg-forest px-2.5 py-1 text-[10px] text-cream">You</span>
            </div>
            <div className={styles.scanBeam} aria-hidden="true"><span /></div>
            <div className={styles.photoLabel} aria-hidden="true">
              <Check className="size-3.5" /> sample-photo.jpg
            </div>
            <div className={styles.scanCorners} aria-hidden="true"><span /><span /><span /><span /></div>

            {imageError && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-keylime p-6 text-center text-forest">
                <ImagePlus className="size-7" />
                <p className="text-sm">The sample photo couldn’t load.</p>
                <button type="button" onClick={replay} className="min-h-11 rounded-full bg-forest px-5 text-xs text-cream">Try again</button>
              </div>
            )}
          </div>

          <div className="flex min-h-14 flex-wrap items-center justify-between gap-2 px-4 py-3 text-forest sm:min-h-16 sm:gap-3 sm:px-5 sm:py-4">
            {stage === "upload" && !imageError ? (
              <span className="flex items-center gap-2 text-xs"><LockKeyhole className="size-3.5" /> Your photo stays yours.</span>
            ) : (
              <LatticeLoader
                status={imageError ? "error" : done ? "done" : "working"}
                label="Thinking"
                doneLabel={reducedMotion ? "Photo ready" : "Done in"}
                errorLabel="Failed after"
                pattern="orbit"
                grid={3}
                shape="round"
                doneColor="#22c55e"
                errorColor="#ef4444"
                cellSize={6}
                gap={2}
                fontSize={14}
                step={90}
                idleOpacity={0.15}
                glow={false}
                glowColor=""
                showTimer={!reducedMotion}
                elapsed={analysisElapsed}
              />
            )}
            <span className="flex items-center gap-1.5 text-[10px] text-forest-muted"><ShieldCheck className="size-3.5" /> On-device</span>
          </div>

          <div className={styles.insights}>
            <div className={styles.privacyNote} aria-hidden={done}>
              <ShieldCheck className="size-5 text-forest" strokeWidth={1.5} />
              <p className="text-xs leading-relaxed text-forest-muted">A photo is a starting point.<br />Your measurements complete the picture.</p>
            </div>
            <dl className={styles.results} aria-hidden={!done}>
              {[
                [`${redness ?? "—"}${redness == null ? "" : "%"}`, "Redness estimate"],
                ["0", "Photos sent"],
                ["Local", "Processing"],
              ].map(([value, label]) => (
                <div key={label}><dt className="text-[10px] text-forest-muted">{label}</dt><dd className="mt-2 text-[22px] leading-none tabular-nums text-forest">{value}</dd></div>
              ))}
            </dl>
          </div>
        </div>

        <div className="border-t border-border px-4 py-3 sm:px-5 sm:py-4">
          <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] text-forest-muted sm:justify-between">
            {["Upload photo", "Scan locally", "Add readings"].map((label, index) => (
              <li key={label} aria-current={step === index ? "step" : undefined} className={`flex items-center gap-1.5 ${step >= index ? "text-forest" : ""}`}>
                {step > index ? <CircleCheck className="size-3.5" /> : <span className={`grid size-4 place-items-center rounded-full text-[9px] ${step === index ? "bg-forest text-cream" : "bg-keylime"}`}>{index + 1}</span>}
                {label}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mt-4 flex min-h-12 items-start gap-2.5 px-1 text-xs leading-relaxed text-forest">
        {done ? <CircleCheck className="mt-0.5 size-4 shrink-0" /> : <LockKeyhole className="mt-0.5 size-4 shrink-0" />}
        <p role="status" aria-live="polite">{caption}</p>
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 px-1 pt-2 text-[10px] text-forest-muted">
        <span>Illustrative walkthrough · Not a diagnosis</span>
        <a href="#analyzer" className="inline-flex min-h-11 items-center gap-1.5 text-forest underline">Your turn <ArrowRight className="size-3" /></a>
      </div>
    </aside>
  );
}
