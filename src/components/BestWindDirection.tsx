import React, { useMemo } from 'react';

/**
 * BestWindDirection.tsx
 * -------------------------------------------------
 * A small, dependency-free React component + pure helpers that
 * recommends the best cycling heading based on wind data.
 *
 * Assumptions:
 * - windFromDeg uses meteorological convention (0° = wind FROM North,
 *   90° = FROM East, etc.).
 * - Units for windSpeed can be anything (mph, km/h, m/s) since we only
 *   compare components proportionally. Values are displayed as given.
 *
 * Usage:
 * <BestWindDirection windFromDeg={270} windSpeed={12} />
 *
 * You can also reuse the pure function `recommendHeadings` elsewhere,
 * e.g. to pre-compute a route bearing.
 */

// -------------------- Math utilities --------------------
const clampDeg = (deg: number) => ((deg % 360) + 360) % 360;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Smallest signed angular difference a - b in [-180, 180] */
function angleDiff(a: number, b: number): number {
  const d = clampDeg(a) - clampDeg(b);
  const wrapped = ((d + 540) % 360) - 180; // shift to [-180, 180]
  return wrapped;
}

const COMPASS_16 = [
  "N","NNE","NE","ENE","E","ESE","SE","SSE",
  "S","SSW","SW","WSW","W","WNW","NW","NNW",
];

export function bearingToCompass(deg: number): string {
  const i = Math.round(clampDeg(deg) / 22.5) % 16;
  return COMPASS_16[i];
}

// -------------------- Core scoring --------------------
export type Recommendation = {
  headingDeg: number;        // where to ride (bearing TO)
  headingLabel: string;      // e.g., "ESE"
  score: number;             // higher is better (tailwind - penalty * crosswind)
  tailComponent: number;     // +tailwind (same units as windSpeed)
  crossComponent: number;    // |crosswind|
  windTowardDeg: number;     // wind vector direction (FROM+180)
};

export type RecommendOptions = {
  resolutionDeg?: number;        // grid resolution; default 5°
  crosswindPenalty?: number;     // weight on crosswind; default 0.4
  allowedHeadings?: Array<[number, number]>; // constrain search to intervals [start,end] (deg)
  minSeparationDeg?: number;     // min spacing between returned headings; default 15°
  topK?: number;                  // how many top headings to return; default 3
};

function inIntervals(x: number, ranges?: Array<[number, number]>) {
  if (!ranges || !ranges.length) return true;
  const d = clampDeg(x);
  return ranges.some(([a, b]) => {
    const A = clampDeg(a);
    const B = clampDeg(b);
    if (A <= B) return d >= A && d <= B;
    // wrapped interval (e.g., 300..30)
    return d >= A || d <= B;
  });
}

export function scoreHeading(
  windFromDeg: number,
  windSpeed: number,
  headingDeg: number,
  crosswindPenalty = 0.4
) {
  // Convert meteorological wind (FROM) to vector direction (TOWARD)
  const windTowardDeg = clampDeg(windFromDeg + 180);
  const delta = angleDiff(headingDeg, windTowardDeg); // heading vs wind vector
  const tail = windSpeed * Math.cos(toRad(delta));
  const cross = Math.abs(windSpeed * Math.sin(toRad(delta)));
  const score = tail - crosswindPenalty * cross;
  return { score, tailComponent: tail, crossComponent: cross, windTowardDeg };
}

export function recommendHeadings(
  windFromDeg: number,
  windSpeed: number,
  opts: RecommendOptions = {}
): Recommendation[] {
  const {
    resolutionDeg = 5,
    crosswindPenalty = 0.4,
    allowedHeadings,
    minSeparationDeg = 15,
    topK = 3,
  } = opts;

  const candidates: Recommendation[] = [];
  for (let h = 0; h < 360; h += resolutionDeg) {
    if (!inIntervals(h, allowedHeadings)) continue;
    const { score, tailComponent, crossComponent, windTowardDeg } = scoreHeading(
      windFromDeg,
      windSpeed,
      h,
      crosswindPenalty
    );
    candidates.push({
      headingDeg: h,
      headingLabel: bearingToCompass(h),
      score,
      tailComponent,
      crossComponent,
      windTowardDeg,
    });
  }

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);

  // Deduplicate near-duplicates to ensure varied bearings
  const picked: Recommendation[] = [];
  for (const c of candidates) {
    if (picked.length >= topK) break;
    const tooClose = picked.some(p => Math.abs(angleDiff(p.headingDeg, c.headingDeg)) < minSeparationDeg);
    if (!tooClose) picked.push(c);
  }
  return picked;
}

// -------------------- React component --------------------
export type BestWindDirectionProps = {
  windFromDeg: number;  // wind direction FROM (0-360)
  windSpeed: number;    // any units
  unitsLabel?: string;  // e.g., 'mph', 'km/h', 'm/s'
  options?: RecommendOptions;
  onPick?: (headingDeg: number) => void; // callback if user clicks a suggestion
};

export default function BestWindDirection({
  windFromDeg,
  windSpeed,
  unitsLabel = '',
  options,
  onPick,
}: BestWindDirectionProps) {
  const top = useMemo(() => recommendHeadings(windFromDeg, windSpeed, options), [windFromDeg, windSpeed, options]);
  const windTowardDeg = clampDeg(windFromDeg + 180);
  const windFromLabel = bearingToCompass(windFromDeg);
  const windTowardLabel = bearingToCompass(windTowardDeg);

  if (!Number.isFinite(windFromDeg) || !Number.isFinite(windSpeed)) {
    return (
      <div className="rounded-2xl p-4 bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
        <p className="text-sm opacity-80">No wind data available.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-5 bg-white/60 backdrop-blur border border-slate-200 shadow-sm dark:bg-slate-900/60 dark:border-slate-800">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold">Best Direction to Ride</h3>
          <p className="text-sm mt-1 text-slate-600 dark:text-slate-400">
            Wind <span className="font-medium">from {Math.round(windFromDeg)}° ({windFromLabel})</span>
            {" "}toward <span className="font-medium">{Math.round(windTowardDeg)}° ({windTowardLabel})</span>
            {unitsLabel ? ` · ${windSpeed} ${unitsLabel}` : ''}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        {top.map((r, idx) => (
          <button
            key={idx}
            onClick={() => onPick?.(r.headingDeg)}
            className="group text-left rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-950 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <Arrow directionDeg={r.headingDeg} />
              <div>
                <div className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Ride {r.headingLabel}</div>
                <div className="text-lg font-semibold">{Math.round(r.headingDeg)}°</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-5">
              <div>Tailwind: <span className="font-medium">{r.tailComponent.toFixed(1)}</span> {unitsLabel}</div>
              <div>Crosswind: <span className="font-medium">{r.crossComponent.toFixed(1)}</span> {unitsLabel}</div>
            </div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Score: <span className="font-medium">{r.score.toFixed(2)}</span>
            </div>
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        Tip: For out‑and‑back rides, consider starting slightly <em>into</em> the wind and returning with a tailwind. For loops, prefer the first pick above.
      </p>
    </div>
  );
}

// -------------------- Tiny arrow glyph --------------------
function Arrow({ directionDeg }: { directionDeg: number }) {
  const rot = clampDeg(directionDeg);
  return (
    <div className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-800 grid place-items-center">
      <div
        className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-current text-slate-700 dark:text-slate-200"
        style={{ transform: `rotate(${rot}deg)` }}
        aria-label={`Arrow pointing ${Math.round(rot)} degrees`}
        title={`${Math.round(rot)}°`}
      />
    </div>
  );
}
