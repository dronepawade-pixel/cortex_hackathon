"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { Check, Crop, Move, RotateCcw } from "lucide-react";
import { estimateRedness, type ImageRegion } from "@/lib/healing";

type Point = { x: number; y: number };

type WoundCropProps = {
  src: string;
  onRednessChange: (value: number) => void;
  onClear: () => void;
};

const clamp = (value: number) => Math.max(0, Math.min(1, value));

function normalizedRegion(start: Point, end: Point): ImageRegion {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  return {
    x,
    y,
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

export default function WoundCrop({ src, onRednessChange, onClear }: WoundCropProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageBox, setImageBox] = useState({ left: 0, top: 0, width: 0, height: 0 });
  const [selection, setSelection] = useState<ImageRegion | null>(null);
  const [draft, setDraft] = useState<ImageRegion | null>(null);
  const startRef = useRef<Point | null>(null);

  const measureImage = useCallback(() => {
    const frame = frameRef.current;
    const image = imageRef.current;
    if (!frame || !image) return;
    const frameBox = frame.getBoundingClientRect();
    const imageBox = image.getBoundingClientRect();
    setImageBox({
      left: imageBox.left - frameBox.left,
      top: imageBox.top - frameBox.top,
      width: imageBox.width,
      height: imageBox.height,
    });
  }, []);

  useEffect(() => {
    measureImage();
    const observer = new ResizeObserver(measureImage);
    if (frameRef.current) observer.observe(frameRef.current);
    return () => observer.disconnect();
  }, [measureImage]);

  const pointFromEvent = (event: ReactPointerEvent<HTMLDivElement>): Point | null => {
    const image = imageRef.current;
    if (!image || imageBox.width === 0 || imageBox.height === 0) return null;
    const box = image.getBoundingClientRect();
    return {
      x: clamp((event.clientX - box.left) / box.width),
      y: clamp((event.clientY - box.top) / box.height),
    };
  };

  function selectRegion(region: ImageRegion) {
    if (region.width < 0.025 || region.height < 0.025) return;
    const image = imageRef.current;
    if (!image) return;
    setSelection(region);
    onRednessChange(estimateRedness(image, region));
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const point = pointFromEvent(event);
    if (!point) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    startRef.current = point;
    setDraft({ x: point.x, y: point.y, width: 0, height: 0 });
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!startRef.current) return;
    const point = pointFromEvent(event);
    if (point) setDraft(normalizedRegion(startRef.current, point));
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (!startRef.current) return;
    const point = pointFromEvent(event);
    if (point) selectRegion(normalizedRegion(startRef.current, point));
    startRef.current = null;
    setDraft(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function clearSelection() {
    setSelection(null);
    onClear();
  }

  const visibleRegion = draft ?? selection;
  const regionStyle = visibleRegion ? {
    left: imageBox.left + visibleRegion.x * imageBox.width,
    top: imageBox.top + visibleRegion.y * imageBox.height,
    width: visibleRegion.width * imageBox.width,
    height: visibleRegion.height * imageBox.height,
  } : undefined;

  return (
    <div>
      <div
        ref={frameRef}
        role="application"
        aria-label="Wound region selector. Drag across the wound in the photo."
        className="relative aspect-[16/10] min-h-36 w-full touch-none overflow-hidden rounded-[14px] bg-forest/10"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={imageRef} src={src} alt="Uploaded wound; drag over the wound to select its region" onLoad={measureImage} className="absolute inset-0 size-full object-contain" draggable={false} />
        <div className="pointer-events-none absolute inset-0 bg-forest/10" />
        {regionStyle && <div className="pointer-events-none absolute z-10 border-2 border-cream bg-cream/10 shadow-[0_0_0_9999px_rgba(15,62,23,0.3)]" style={regionStyle as CSSProperties}><span className="absolute -top-7 left-0 flex items-center gap-1 rounded-full bg-cream px-2 py-1 text-[10px] text-forest"><Crop className="size-3" /> Selected region</span></div>}
        {!selection && !draft && <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center"><span className="flex items-center gap-2 rounded-full bg-cream/95 px-3 py-2 text-[11px] text-forest"><Move className="size-3.5" /> Drag over the wound to select it</span></div>}
      </div>
      <div className="mt-2 flex min-h-10 flex-wrap items-center justify-between gap-2 text-[11px] text-forest-muted">
        <span>{selection ? <span className="flex items-center gap-1.5 text-forest"><Check className="size-3.5" /> Redness calculated from selected pixels only.</span> : "Select the wound area, not the surrounding skin or background."}</span>
        {selection && <button type="button" onClick={clearSelection} className="inline-flex min-h-10 items-center gap-1.5 text-forest underline"><RotateCcw className="size-3" /> Select again</button>}
      </div>
    </div>
  );
}
