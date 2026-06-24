import { useCallback, useRef, useState } from "react";

export interface SnapTier {
  maxYOffset: number; // px from track center; Infinity for the last tier
  step: number;
}

interface ScrubSliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  snapTiers?: SnapTier[];
  mobileStep?: number;
}

// Desktop: Y distance from the track centerline determines snap granularity.
// Each band is 15px; further from the track = coarser snapping.

// Wide-range (~1000) tiers.
export const DEFAULT_SNAP_TIERS: SnapTier[] = [
  { maxYOffset: 15, step: 1 },
  { maxYOffset: 30, step: 10 },
  { maxYOffset: 45, step: 25 },
  { maxYOffset: 60, step: 50 },
  { maxYOffset: Infinity, step: 100 },
];

// Narrow-range (~100) tiers: smaller jumps so the coarsest step still lands cleanly.
export const FINE_SNAP_TIERS: SnapTier[] = [
  { maxYOffset: 15, step: 1 },
  { maxYOffset: 30, step: 5 },
  { maxYOffset: 45, step: 10 },
  { maxYOffset: Infinity, step: 25 },
];

// Below this span the wide-range tiers jump too coarsely; use the fine set.
export const FINE_RANGE_THRESHOLD = 200;

export function defaultTiersForRange(min: number, max: number): SnapTier[] {
  return max - min <= FINE_RANGE_THRESHOLD ? FINE_SNAP_TIERS : DEFAULT_SNAP_TIERS;
}

export function snapToStep(raw: number, step: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(raw / step) * step));
}

export function pickStep(yOffset: number, tiers: SnapTier[]): number {
  for (const tier of tiers) {
    if (yOffset < tier.maxYOffset) return tier.step;
  }
  return tiers[tiers.length - 1].step;
}

export function ScrubSlider({
  min,
  max,
  value,
  onChange,
  snapTiers,
  mobileStep = 10,
}: ScrubSliderProps) {
  const tiers = snapTiers ?? defaultTiersForRange(min, max);
  const trackRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const draggingRef = useRef(false);
  const [focused, setFocused] = useState(false);

  const percent = max > min ? ((value - min) / (max - min)) * 100 : 0;

  const computeRawValue = useCallback(
    (clientX: number): number => {
      const track = trackRef.current;
      if (!track) return min;
      const rect = track.getBoundingClientRect();
      return min + ((clientX - rect.left) / rect.width) * (max - min);
    },
    [min, max],
  );

  const setIndicator = useCallback((step: number, pct: number) => {
    const el = indicatorRef.current;
    const track = trackRef.current;
    if (!el || !track) return;
    const rect = track.getBoundingClientRect();
    el.textContent = `±${step}`;
    el.style.left = `${rect.left + (pct / 100) * rect.width}px`;
    el.style.top = `${rect.top - 24}px`;
    el.style.opacity = "1";
  }, []);

  const hideIndicator = useCallback(() => {
    const el = indicatorRef.current;
    if (el) el.style.opacity = "0";
  }, []);

  const getStep = useCallback(
    (e: React.PointerEvent<HTMLDivElement>): number => {
      if (e.pointerType === "touch") return mobileStep;
      const track = trackRef.current;
      if (!track) return 1;
      const rect = track.getBoundingClientRect();
      const trackCenterY = rect.top + rect.height / 2;
      const yOffset = Math.abs(e.clientY - trackCenterY);
      return pickStep(yOffset, tiers);
    },
    [tiers, mobileStep],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
      draggingRef.current = true;
      const step = getStep(e);
      const snapped = snapToStep(computeRawValue(e.clientX), step, min, max);
      setIndicator(step, ((snapped - min) / (max - min)) * 100);
      onChange(snapped);
    },
    [computeRawValue, getStep, onChange, min, max, setIndicator],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      const step = getStep(e);
      const snapped = snapToStep(computeRawValue(e.clientX), step, min, max);
      setIndicator(step, ((snapped - min) / (max - min)) * 100);
      onChange(snapped);
    },
    [computeRawValue, getStep, onChange, min, max, setIndicator],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
      draggingRef.current = false;
      hideIndicator();
    },
    [hideIndicator],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const step = e.shiftKey ? (tiers[tiers.length - 1]?.step ?? 100) : tiers[0]?.step ?? 1;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        e.preventDefault();
        onChange(Math.min(max, snapToStep(value + step, step, min, max)));
      } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        e.preventDefault();
        onChange(Math.max(min, snapToStep(value - step, step, min, max)));
      } else if (e.key === "Home") {
        e.preventDefault();
        onChange(min);
      } else if (e.key === "End") {
        e.preventDefault();
        onChange(max);
      }
    },
    [onChange, min, max, value, tiers],
  );

  return (
    <div className="relative w-full">
      {/* Step indicator — updated directly via DOM ref, no React re-renders during drag */}
      <span
        ref={indicatorRef}
        className="pointer-events-none fixed -translate-x-1/2 rounded bg-accent px-1.5 py-0.5 text-[10px] tabular-nums text-panel opacity-0 transition-opacity duration-100 z-50"
      >
        ±1
      </span>

      <div
        ref={trackRef}
        className="relative flex h-4 w-full touch-none select-none items-center"
      >
        {/* Hit area: extends half-thumb (8px) past each end so clicks on the
            thumb overhang at min/max are captured */}
        <div
          className="absolute inset-y-0 -left-2 -right-2"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
        {/* Track */}
        <div className="pointer-events-none relative h-[3px] w-full rounded-full bg-accent/15">
          {/* Range fill */}
          <div className="pointer-events-none absolute h-full rounded-full bg-accent/60" style={{ width: `${percent}%` }} />
        </div>
        {/* Thumb */}
        <div
          role="slider"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          tabIndex={0}
          className={[
            "pointer-events-none absolute h-3 w-3 -translate-x-1/2 rounded-full bg-accent shadow-sm transition-colors",
            focused ? "ring-2 ring-accent/40 ring-offset-1 ring-offset-panel" : "",
          ].join(" ")}
          style={{ left: `${percent}%` }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
}
