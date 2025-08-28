

export default function ResultCard({ title, psi, bar }: { title: string; psi: number; bar: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900/60">
      <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</h2>
      <div className="flex items-baseline gap-3">
        <div className="text-5xl font-black tracking-tight">{psi}</div>
        <div className="text-sm text-slate-500 dark:text-slate-400">PSI</div>
      </div>
      <div className="mt-1 text-slate-700 dark:text-slate-300">{bar.toFixed(2)} <span className="text-xs text-slate-500 dark:text-slate-400">BAR</span></div>
    </div>
  );
}