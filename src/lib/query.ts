// src/lib/query.ts
export const defaults = {
  theme: 'dark',
  uw: 'lbs',
  w: '180',
  surface: 'Worn Pavement / Some Cracks',
  width: '28',
  wheel: '700C/29"',
  tt: 'High performance tire tubeless/latex tube',
  speed: 'Moderate Group Ride',
  split: '48/52 (Road Bikes)',
} as const;


const getNum = (key: string, fallback: number): number => {
  const v = getQuery(key);
  const n = v == null ? NaN : Number(v);
  return Number.isFinite(n) ? n : fallback;
};
export function getNumQP(name: keyof typeof defaults): number {
  return getNum(name, Number(defaults[name]));
}

export function getQP(name: keyof typeof defaults): string {
  const v = new URLSearchParams(window.location.search).get(name);
  return v == null || v === '' ? defaults[name] : v;
}

// utils/query.ts (or wherever getQuery lives)
export function getQuery(key: string): string | null {
  const v = new URLSearchParams(window.location.search).get(key);
  // treat empty/whitespace as missing
  return v && v.trim() !== '' ? v : null;
}

