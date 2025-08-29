import { useEffect, useMemo, useState } from 'react';
import InputsForm from './components/InputsForm';
import ResultCard from './components/ResultCard';
import { PRESETS, WEIGHT_SPLITS } from "./constants";
import type { Preset, Surface, Speed, TireType, WheelDiameter } from "./constants";
import { computeWheelPsi, toBar } from './lib/calc';
import { getQuery, setQuery } from './lib/urlState';
import { recommendPressures } from "./utils/pressureComp";

export default function App() {
  // Theme toggle (Tailwind uses the `dark` class on <html>)
  const [theme] = useState<'dark' | 'light'>(() => (getQuery('theme') as 'dark' | 'light') || 'dark');
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    setQuery({ theme });
  }, [theme]);

  // Form state
  const [unitWeight, setUnitWeight] = useState<'lbs' | 'kg'>(() => (getQuery('uw') as 'lbs' | 'kg') || 'lbs');
  const [systemWeight, setSystemWeight] = useState<number>(() => Number(getQuery('w') ?? 180));
  const [surface, setSurface] = useState<Surface>(() => (getQuery('surface') as any) || 'Worn Pavement / Some Cracks');
  const [tireWidthMm, setTireWidthMm] = useState<number>(() => Number(getQuery('width') ?? 28));
  const [wheelDiameter, setWheelDiameter] = useState<WheelDiameter>(() => (getQuery('wheel') as any) || '700C/29"');
  const [tireType, setTireType] = useState<TireType>(() => (getQuery('tt') as any) || 'High performance tire tubeless/latex tube');
  const [speed, setSpeed] = useState<Speed>(() => (getQuery('speed') as any) || 'Moderate Group Ride');
  const [splitLabel, setSplitLabel] = useState<string>(() => getQuery('split') || '48/52 (Road Bikes)');
  const [presetName, setPresetName] = useState<string>(() => getQuery('preset') || '');

    // NEW: weather/elevation-adjusted results
  const [wx, setWx] = useState<{
    ambientTempC: number;
    elevationM: number;
    ambientPressurePsi: number;
    frontPsiAdj: number;
    rearPsiAdj: number;
    note: string;
  } | null>(null);
  const [wxError, setWxError] = useState<string | null>(null);
  const [wxLoading, setWxLoading] = useState(false);

  // Persist to URL when inputs change
  useEffect(() => {
    setQuery({ uw: unitWeight, w: systemWeight, surface, width: tireWidthMm, wheel: wheelDiameter, tt: tireType, speed, split: splitLabel, preset: presetName || undefined });
  }, [unitWeight, systemWeight, surface, tireWidthMm, wheelDiameter, tireType, speed, splitLabel, presetName]);

  // Apply preset
  function applyPreset(name: string) {
    setPresetName(name);
    const p = PRESETS.find(p => p.name === name as Preset['name']);
    if (!p) return;
    setSurface(p.surface);
    setSplitLabel(p.splitLabel);
    if (!getQuery('width')) setTireWidthMm(p.defaultWidth);
  }

  const split = useMemo(() => WEIGHT_SPLITS.find(s => s.label === splitLabel) ?? WEIGHT_SPLITS[1], [splitLabel]);
  const weightLbs = unitWeight === 'lbs' ? systemWeight : systemWeight * 2.20462262;
  const weightValid = weightLbs >= 75 && weightLbs <= 450;

  const { frontPsi, rearPsi } = useMemo(() => {
    const frontLoad = weightLbs * split.front;
    const rearLoad = weightLbs * split.rear;
    const f = computeWheelPsi({ loadLbs: frontLoad, tireWidthMm, surface, speed, tireType, wheelDiameter });
    const r = computeWheelPsi({ loadLbs: rearLoad, tireWidthMm, surface, speed, tireType, wheelDiameter });
    return { frontPsi: Math.round(f), rearPsi: Math.round(r) };
  }, [weightLbs, split, tireWidthMm, surface, speed, tireType, wheelDiameter]);

    // NEW: call weather/elevation compensation whenever baseline pressures or key inputs change
  useEffect(() => {
    let cancelled = false;

    async function updateWithWeather() {
      try {
        setWxLoading(true);
        setWxError(null);

// Use your baseline (gauge) targets at a reference temp (20 °C)
        const result = await recommendPressures({
          frontPsiRef: frontPsi,
          rearPsiRef: rearPsi,
          refTempC: 20,
          keepAbsoluteConstant: false, // typical cycling approach
          // coords: { lat: 39.77, lon: -86.16 }, // optional: pass fixed coords; otherwise uses geolocation()
          when: new Date()
        });

        if (cancelled) return;

        setWx({
          ambientTempC: result.ambientTempC,
          elevationM: result.elevationM,
          ambientPressurePsi: result.ambientPressurePsi,
          frontPsiAdj: result.front.psi,
          rearPsiAdj: result.rear.psi,
          note: result.front.note
        });
      } catch (e: any) {
        if (cancelled) return;
        setWx(null);
        setWxError(e?.message ?? 'Weather adjustment failed');
      } finally {
        if (!cancelled) setWxLoading(false);
      }
    }

       // Only attempt if weight is sane and we have baseline psi
    if (weightValid && frontPsi > 0 && rearPsi > 0) {
      updateWithWeather();
    } else {
      setWx(null);
    }

    return () => { cancelled = true; };
  }, [
    // dependencies that impact baseline psi or conditions:
    frontPsi, rearPsi, weightValid, tireWidthMm, surface, speed, tireType, wheelDiameter
  ]);

  const frontBar = toBar(frontPsi);
  const rearBar = toBar(rearPsi);

  return (
<main className="min-h-dvh bg-slate-50 text-slate-900 p-6 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <section className="mx-auto w-full max-w-[1800px] px-6 sm:px-8">
        <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Cycling Tire Pressure Calculator</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">Estimate optimal tire pressure for road, gravel, and mountain bikes.</p>

          </div>
          {/* <div className="flex items-center gap-2">
            <label className="text-xs">Theme</label>
            <button type="button" onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))} className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs shadow dark:border-slate-700 dark:bg-slate-900">{theme === 'dark' ? 'Dark' : 'Light'}</button>
          </div> */}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InputsForm
            unitWeight={unitWeight} setUnitWeight={setUnitWeight}
            systemWeight={systemWeight} setSystemWeight={setSystemWeight}
            surface={surface} setSurface={setSurface}
            tireWidthMm={tireWidthMm} setTireWidthMm={setTireWidthMm}
            wheelDiameter={wheelDiameter} setWheelDiameter={setWheelDiameter}
            tireType={tireType} setTireType={setTireType}
            speed={speed} setSpeed={setSpeed}
            splitLabel={splitLabel} setSplitLabel={setSplitLabel}
            presetName={presetName} applyPreset={applyPreset}
            weightValid={weightValid}
          />

          <div className="grid grid-cols-1 gap-6">
            <ResultCard title="Front Tire" psi={frontPsi} bar={frontBar} />
            <ResultCard title="Rear Tire" psi={rearPsi} bar={rearBar} />
             {/* NEW: Weather-adjusted display (optional card) */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-4">
              <h3 className="font-semibold">Weather & Elevation Adjustment</h3>
              {wxLoading && <p className="text-sm mt-2">Fetching local temperature & elevation…</p>}
              {wxError && <p className="text-sm mt-2 text-rose-600">{wxError}</p>}
              {wx && !wxLoading && (
                <>
                  <p className="text-sm mt-2">
                    Ambient <strong>{wx.ambientTempC.toFixed(1)}°C</strong> · Elevation <strong>{Math.round(wx.elevationM)} m</strong> ·
                    Ambient Pressure <strong>{wx.ambientPressurePsi.toFixed(2)} psi</strong>
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-3">
                      <div className="text-xs uppercase tracking-wide text-slate-500">Front (adjusted)</div>
                      <div className="text-lg font-semibold">{wx.frontPsiAdj.toFixed(1)} psi</div>
                    </div>
                    <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-3">
                      <div className="text-xs uppercase tracking-wide text-slate-500">Rear (adjusted)</div>
                      <div className="text-lg font-semibold">{wx.rearPsiAdj.toFixed(1)} psi</div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">{wx.note}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}