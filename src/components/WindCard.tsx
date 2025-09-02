// src/components/WindCard.tsx
import { toCompass, useWind, windComponents } from "../hooks/useWind";
import type { LatLng, WindUnit } from "../hooks/useWind";

type Props = {
  coords?: LatLng;          // optional; falls back to geolocation
  when?: Date;              // optional; defaults to frozen "now" in the hook
  unit?: WindUnit;          // "mph" | "kmh" | "ms" | "kn"
  routeHeadingDeg?: number; // optional: your course/bearing (0..359)
};

export default function WindCard({ coords, when, unit = "mph", routeHeadingDeg }: Props) {
  const { data, loading, error } = useWind({ coords, when, unit });

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-4">
      <h3 className="font-semibold">Wind</h3>

      {loading && <p className="text-sm mt-2">Updating wind…</p>}
      {error && <p className="text-sm mt-2 text-rose-600">{error}</p>}

      {data && (
        <>
          <p className="text-sm mt-2">
            {new Date(data.time).toLocaleString()} — <strong>{data.speed.toFixed(1)} {unit}</strong>, dir
            <strong> {Math.round(data.directionDeg)}°</strong> ({toCompass(data.directionDeg)})
            {data.gust != null && <> · gust <strong>{data.gust.toFixed(1)} {unit}</strong></>}
          </p>

          {typeof routeHeadingDeg === "number" && (
            <WindBreakdown
              speed={data.speed}
              unit={unit}
              windFromDeg={data.directionDeg}
              headingDeg={routeHeadingDeg}
            />
          )}
        </>
      )}

      {!loading && !error && !data && (
        <p className="text-sm mt-2 text-slate-500">No wind data.</p>
      )}
    </div>
  );
}

function WindBreakdown({
  speed, unit, windFromDeg, headingDeg
}: { speed: number; unit: WindUnit; windFromDeg: number; headingDeg: number }) {
  const comp = windComponents(windFromDeg, headingDeg, speed);

  return (
    <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
      <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-3">
        <div className="text-[11px] uppercase tracking-wide text-slate-500">Relative</div>
        <div className="font-semibold">
          {comp.headOrTail === "headwind" ? "Headwind" : "Tailwind"}
        </div>
        <div className="text-slate-500">{headingDeg}° course</div>
      </div>
      <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-3">
        <div className="text-[11px] uppercase tracking-wide text-slate-500">Head/Tail</div>
        <div className="font-semibold">{comp.headwind.toFixed(1)} {unit}</div>
      </div>
      <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-3">
        <div className="text-[11px] uppercase tracking-wide text-slate-500">Crosswind</div>
        <div className="font-semibold">{comp.crosswind.toFixed(1)} {unit}</div>
        {comp.crosswind > 0.1 && <div className="text-slate-500">{comp.side} side</div>}
      </div>
    </div>
  );
}
