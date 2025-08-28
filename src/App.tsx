import { useEffect, useMemo, useState } from 'react';
import InputsForm from './components/InputsForm';
import ResultCard from './components/ResultCard';
import { PRESETS, WEIGHT_SPLITS } from "./constants";
import type { Preset, Surface, Speed, TireType, WheelDiameter } from "./constants";
import { computeWheelPsi, toBar } from './lib/calc';
import { getQuery, setQuery } from './lib/urlState';

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

  const frontBar = toBar(frontPsi);
  const rearBar = toBar(rearPsi);

  return (
<main className="min-h-dvh bg-slate-50 text-slate-900 p-6 transition-colors dark:bg-slate-950 dark:text-slate-100 mx-auto w-full max-w-screen-xl">
      <section className="mx-auto max-w-6xl">
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
          </div>
        </div>
      </section>
    </main>
  );
}