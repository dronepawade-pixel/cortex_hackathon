"use client";

// Solid-band adaptation of Bklit's ReferenceArea. Reuses the installed chart
// geometry and context; pattern presets are unnecessary for this surface.
import { useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useChartStable, useYScale } from "./chart-context";
import { computeReferenceAreaRect } from "./reference-area-geometry";
import { isReferenceAreaVisiblePhase } from "./y-domain-utils";

interface ReferenceAreaProps {
  y1: number;
  y2: number;
  fill: string;
  fillOpacity?: number;
  stroke?: string;
  strokeStyle?: "solid" | "dashed";
  strokeDasharray?: string;
  fadeEdges?: boolean;
  fadeEdgesLength?: number;
  axisLabelColor?: string;
  showMarkers?: boolean;
  markerColor?: string;
  yAxisId?: string;
}

export function ReferenceArea({
  y1, y2, fill, fillOpacity = 1,
  stroke = "var(--chart-foreground-muted)", strokeStyle = "dashed", strokeDasharray = "4,4",
  fadeEdges = true, fadeEdgesLength = 10, showMarkers = false,
  markerColor = "var(--chart-1)", yAxisId = "left",
}: ReferenceAreaProps) {
  const { innerWidth, innerHeight, xScale, chartPhase } = useChartStable();
  const yScale = useYScale(yAxisId);
  const id = `reference-band-${useId().replace(/:/g, "")}`;
  const reducedMotion = useReducedMotion();
  const rect = computeReferenceAreaRect({ innerWidth, innerHeight, xScale, yScale, y1, y2 });
  if (!rect) return null;
  const { x, y, width, height } = rect;
  const fade = Math.min(45, Math.max(0, fadeEdgesLength));
  const mask = fadeEdges ? `url(#${id}-mask)` : undefined;

  return <motion.g aria-hidden="true" className="chart-reference-area" initial={false} animate={{ opacity: isReferenceAreaVisiblePhase(chartPhase) ? 1 : 0 }} transition={{ duration: reducedMotion ? 0 : 0.42 }}>
    {fadeEdges && <defs>
      <linearGradient id={id} x1="0%" x2="100%" y1="0%" y2="0%">
        <stop offset="0%" stopColor="white" stopOpacity={0} />
        <stop offset={`${fade}%`} stopColor="white" />
        <stop offset={`${100 - fade}%`} stopColor="white" />
        <stop offset="100%" stopColor="white" stopOpacity={0} />
      </linearGradient>
      <mask id={`${id}-mask`}><rect width={innerWidth} height={innerHeight} fill={`url(#${id})`} /></mask>
    </defs>}
    <rect x={x} y={y} width={width} height={height} fill={fill} fillOpacity={fillOpacity} mask={mask} />
    <g mask={mask} stroke={stroke} strokeDasharray={strokeStyle === "dashed" ? strokeDasharray : undefined}>
      <line x1={x} x2={x + width} y1={y} y2={y} />
      <line x1={x} x2={x + width} y1={y + height} y2={y + height} />
    </g>
    {showMarkers && <g fill={markerColor}>
      <path d={`M ${x + width / 2 - 3} ${y} h 6 l -3 6 Z`} />
      <path d={`M ${x + width / 2 - 3} ${y + height} h 6 l -3 -6 Z`} />
    </g>}
  </motion.g>;
}

ReferenceArea.displayName = "ReferenceArea";
