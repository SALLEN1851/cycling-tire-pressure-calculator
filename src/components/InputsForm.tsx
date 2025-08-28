import { PRESETS, SPEEDS, SURFACES, TIRE_TYPES, WHEEL_DIAMETERS, WEIGHT_SPLITS } from '../constants';
import type { Speed, Surface, TireType, WheelDiameter } from '../constants';

export type InputsFormProps = {
  unitWeight: 'lbs'|'kg';
  setUnitWeight: (v: 'lbs'|'kg') => void;
  systemWeight: number;
  setSystemWeight: (n: number) => void;
  surface: Surface; setSurface: (s: Surface) => void;
  tireWidthMm: number; setTireWidthMm: (n: number) => void;
  wheelDiameter: WheelDiameter; setWheelDiameter: (w: WheelDiameter) => void;
  tireType: TireType; setTireType: (t: TireType) => void;
  speed: Speed; setSpeed: (s: Speed) => void;
  splitLabel: string; setSplitLabel: (s: string) => void;
  presetName: string; applyPreset: (name: string) => void;
  weightValid: boolean;
};

export default function InputsForm(props: InputsFormProps) {
  const { unitWeight, setUnitWeight, systemWeight, setSystemWeight, surface, setSurface, tireWidthMm, setTireWidthMm, wheelDiameter, setWheelDiameter, tireType, setTireType, speed, setSpeed, splitLabel, setSplitLabel, presetName, applyPreset, weightValid } = props;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/50">
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Preset</label>
          <select value={presetName} onChange={(e) => applyPreset(e.target.value)} className="w-48 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
            <option value="">None</option>
            {PRESETS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* System weight */}
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm text-slate-700 dark:text-slate-300">Total System Weight (Rider + Bike + Gear)</label>
          <div className="flex gap-2">
            <input type="number" min={unitWeight === 'lbs' ? 75 : 34} max={unitWeight === 'lbs' ? 450 : 205} value={systemWeight} onChange={(e) => setSystemWeight(Number(e.target.value))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" aria-invalid={!weightValid} />
            <div className="flex gap-2">
              <button type="button" onClick={() => setUnitWeight('lbs')} aria-pressed={unitWeight === 'lbs'} className={`rounded-full border px-3 py-2 text-sm ${unitWeight === 'lbs' ? 'border-sky-400 ring-2 ring-sky-400' : 'border-slate-300 dark:border-slate-700'}`}>lbs</button>
              <button type="button" onClick={() => setUnitWeight('kg')} aria-pressed={unitWeight === 'kg'} className={`rounded-full border px-3 py-2 text-sm ${unitWeight === 'kg' ? 'border-sky-400 ring-2 ring-sky-400' : 'border-slate-300 dark:border-slate-700'}`}>kg</button>
            </div>
          </div>
          {!weightValid && <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">Weight should be between 75–450 lbs (34–205 kg).</p>}
        </div>

        {/* Surface */}
        <div>
          <label className="mb-1 block text-sm text-slate-700 dark:text-slate-300">Surface Condition</label>
          <select value={surface} onChange={(e) => setSurface(e.target.value as any)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
            {SURFACES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Tire width */}
        <div>
          <label className="mb-1 block text-sm text-slate-700 dark:text-slate-300">Measured Tire Width (mm)</label>
          <input type="number" min={20} max={90} value={tireWidthMm} onChange={(e) => setTireWidthMm(Number(e.target.value))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"/>
        </div>

        {/* Wheel diameter */}
        <div>
          <label className="mb-1 block text-sm text-slate-700 dark:text-slate-300">Wheel Diameter</label>
          <select value={wheelDiameter} onChange={(e) => setWheelDiameter(e.target.value as any)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
            {WHEEL_DIAMETERS.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>

        {/* Tire type */}
        <div>
          <label className="mb-1 block text-sm text-slate-700 dark:text-slate-300">Tire Type</label>
          <select value={tireType} onChange={(e) => setTireType(e.target.value as any)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
            {TIRE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Speed */}
        <div>
          <label className="mb-1 block text-sm text-slate-700 dark:text-slate-300">Average Speed</label>
          <select value={speed} onChange={(e) => setSpeed(e.target.value as any)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
            {SPEEDS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Weight split */}
        <div>
          <label className="mb-1 block text-sm text-slate-700 dark:text-slate-300">Weight Distribution</label>
          <select value={splitLabel} onChange={(e) => setSplitLabel(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
            {WEIGHT_SPLITS.map((s) => <option key={s.label} value={s.label}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <p className="mt-4 text-xs text-amber-700 dark:text-amber-300">Safety note: These are heuristic suggestions. Always follow tire and rim manufacturer limits.</p>
    </div>
  );
}