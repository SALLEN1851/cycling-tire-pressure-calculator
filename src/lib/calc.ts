// VALUES (runtime)
import { SPEEDS, SURFACES, TIRE_TYPES, PSI_PER_BAR } from '../constants';
// TYPES (erased at build time)
import type { Surface, Speed, TireType, WheelDiameter } from '../constants';


/**
 * Tunable scaling constant for baseline pressure.
 * Keep here so UI can import and expose as an advanced knob if desired.
 */
export const K = 20 as const

// Heuristic coefficients (exhaustive + type-safe)
export const SURFACE_MULT = {
  'Track (Indoor Wood)': +0.2,
  'Track (Outdoor Concrete)': +0.15,
  'New Pavement': +0.05,
  'Worn Pavement / Some Cracks': 0,
  'Poor Pavement / Chipseal': -0.1,
  'Cobblestone': -0.2,
  'Category 1 Gravel': -0.25,
  'Category 2 Gravel': -0.35,
  'Category 3 Gravel': -0.45,
  'Category 4 Gravel': -0.55,
} as const satisfies Record<Surface, number>

export const TIRE_TYPE_OFFSET = {
  'High performance tire tubeless/latex tube': 0,
  'Mid Range casing tubeless/latex tube': 2,
  'Mid-Range casing butyl tube': 5,
  'Puncture resistant tire tubeless/latex tube': 7,
} as const satisfies Record<TireType, number>

export const SPEED_MULT = {
  Recreational: -0.05,
  'Moderate Group Ride': 0,
  'Fast Group Ride': 0.03,
  'Cat. 1 / Cat. 2 / Cat. 3 Racing': 0.05,
  'Pro Tour': 0.07,
  'Fast Single Track': 0.03,
} as const satisfies Record<Speed, number>

export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

export type ComputeWheelPsiParams = {
  loadLbs: number
  tireWidthMm: number
  surface: Surface
  speed: Speed
  tireType: TireType
  wheelDiameter: WheelDiameter // reserved for future use
}

/**
 * Compute single-wheel PSI from a simple heuristic model.
 * Returns a clamped PSI (15–130). Caller can round as desired.
 */
export function computeWheelPsi({ loadLbs, tireWidthMm, surface, speed, tireType }: ComputeWheelPsiParams) {
  const safeTireWidthMm = clamp(tireWidthMm, 20, 90)
  let psi = K * (loadLbs / safeTireWidthMm)
  psi *= 1 + SURFACE_MULT[surface]
  psi *= 1 + SPEED_MULT[speed]
  psi += TIRE_TYPE_OFFSET[tireType]
  return clamp(psi, 15, 130)
}

/** Convert PSI → BAR. */
export const toBar = (psi: number) => psi / PSI_PER_BAR