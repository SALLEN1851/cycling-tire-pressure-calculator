// Shared constants, option lists, and types
export const SURFACES = [
  'Track (Indoor Wood)',
  'Track (Outdoor Concrete)',
  'New Pavement',
  'Worn Pavement / Some Cracks',
  'Poor Pavement / Chipseal',
  'Cobblestone',
  'Category 1 Gravel',
  'Category 2 Gravel',
  'Category 3 Gravel',
  'Category 4 Gravel',
] as const;

export const WHEEL_DIAMETERS = [
  '700C/29"',
  '650C',
  '650B/27.5"',
  '26"',
] as const;

export const TIRE_TYPES = [
  'High performance tire tubeless/latex tube',
  'Mid Range casing tubeless/latex tube',
  'Mid-Range casing butyl tube',
  'Puncture resistant tire tubeless/latex tube',
] as const;

export const SPEEDS = [
  'Recreational',
  'Moderate Group Ride',
  'Fast Group Ride',
  'Cat. 1 / Cat. 2 / Cat. 3 Racing',
  'Pro Tour',
  'Fast Single Track',
] as const;

export type Surface = typeof SURFACES[number];
export type WheelDiameter = typeof WHEEL_DIAMETERS[number];
export type TireType = typeof TIRE_TYPES[number];
export type Speed = typeof SPEEDS[number];

export type WeightSplit = { label: string; front: number; rear: number };
export const WEIGHT_SPLITS: WeightSplit[] = [
  { label: '50/50 (Triathlon/TT/Track Bikes)', front: 0.5,   rear: 0.5   },
  { label: '48/52 (Road Bikes)',               front: 0.48,  rear: 0.52  },
  { label: '47/53 (Gravel Bikes)',             front: 0.47,  rear: 0.53  },
  { label: '46.5/53.5 (Mountain Bikes)',       front: 0.465, rear: 0.535 },
];

export type Preset = { name: 'Road'|'Gravel'|'MTB'; surface: Surface; splitLabel: string; defaultWidth: number };
export const PRESETS: readonly Preset[] = [
  { name: 'Road',   surface: 'Worn Pavement / Some Cracks', splitLabel: '48/52 (Road Bikes)',          defaultWidth: 28 },
  { name: 'Gravel', surface: 'Category 2 Gravel',           splitLabel: '47/53 (Gravel Bikes)',        defaultWidth: 40 },
  { name: 'MTB',    surface: 'Category 3 Gravel',           splitLabel: '46.5/53.5 (Mountain Bikes)',  defaultWidth: 55 },
] as const;

export const PSI_PER_BAR = 14.5037738;