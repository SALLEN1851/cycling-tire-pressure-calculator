// utils/pressureComp.ts
// Minimal TS utility for weather+elevation and pressure compensation.
// Uses Open-Meteo (no API key). Works in browser environments.

type LatLng = { lat: number; lon: number };

export type RecommendInput = {
  // If omitted, we'll use browser geolocation (with user permission)
  coords?: LatLng;

  // Your "target" pressures (gauge) at the reference temperature
  frontPsiRef: number;
  rearPsiRef: number;

  // Reference temperature (°C) your targets were tuned for (common: 20 °C)
  refTempC?: number;

  // If provided, use this time to pick the hourly temperature closest to it.
  // Otherwise we use the current hour.
  when?: Date;

  // Advanced: keep absolute pressure constant (rarely needed).
  // If false (default), we keep gauge psi constant and only apply temperature scaling.
  keepAbsoluteConstant?: boolean;
};

export type RecommendOutput = {
  coords: LatLng;
  elevationM: number;
  ambientTempC: number;
  ambientPressurePsi: number; // from elevation model
  front: { psi: number; note: string };
  rear: { psi: number; note: string };
};

/** Get browser geolocation (prompts the user). */
export function getGeolocation(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation not available"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
      },
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

/** Fetch hourly temperature (°C) and return the hour closest to `when` (or now). */
export async function fetchOpenMeteoTempC(
  coords: LatLng,
  when: Date = new Date()
): Promise<number> {
  const { lat, lon } = coords;
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&hourly=temperature_2m&forecast_days=2&past_days=1&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo temp fetch failed: ${res.status}`);
  const data = await res.json();

  const times: string[] = data?.hourly?.time ?? [];
  const temps: number[] = data?.hourly?.temperature_2m ?? [];
  if (!times.length || !temps.length) throw new Error("No temp data returned");

  const targetMs = when.getTime();
  let bestIdx = 0;
  let bestDelta = Number.POSITIVE_INFINITY;

  for (let i = 0; i < times.length; i++) {
    const tMs = new Date(times[i]).getTime();
    const d = Math.abs(tMs - targetMs);
    if (d < bestDelta) {
      bestDelta = d;
      bestIdx = i;
    }
  }
  return temps[bestIdx];
}

/** Fetch elevation (meters) via Open-Meteo (Copernicus DEM GLO-90). */
export async function fetchOpenMeteoElevationM(coords: LatLng): Promise<number> {
  const { lat, lon } = coords;
  const url = `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo elevation failed: ${res.status}`);
  const data = await res.json();
  const elevation = data?.elevation?.[0];
  if (typeof elevation !== "number") throw new Error("No elevation returned");
  return elevation;
}

/** Standard atmosphere: ambient pressure (kPa) from elevation (meters). */
export function ambientPressureAtElevation_kPa(h_m: number): number {
  // ISA model (valid up to ~11km): P = P0 * (1 - L*h/T0)^(g*M/R*L)
  // This simplified form is commonly used for near-sea-level:
  // P = 101.325 * (1 - 2.25577e-5 * h)^5.25588   [kPa]
  const P0 = 101.325;
  const pressure = P0 * Math.pow(1 - 2.25577e-5 * h_m, 5.25588);
  return pressure;
}

const KPA_TO_PSI = 0.1450377377;

/** Kelvin helper */
const C_to_K = (c: number) => c + 273.15;

/**
 * Temperature compensation using ideal gas:
 * Scale ABSOLUTE pressure by T2/T1, then convert back to gauge.
 *
 * If keepAbsoluteConstant=false (default):
 *  - We keep gauge psi as the user target (frontPsiRef/rearPsiRef at refTempC),
 *    and compute what to set NOW so that during the ride you’re near that target.
 *    Practically, this means: P_abs_now = (P_gauge_ref + P_atm) * (T_now / T_ref)
 *    Then P_gauge_now = P_abs_now - P_atm.
 *
 * If keepAbsoluteConstant=true:
 *  - We keep absolute pressure equal to the reference absolute (more "physics-pure"),
 *    and convert to the current gauge using current ambient; rarely needed for bikes.
 */
export function compensatePressurePsi(
  gaugePsiRef: number,
  refTempC: number,
  ambientTempC: number,
  ambientPressurePsi: number,
  keepAbsoluteConstant = false
): number {
  const T_ref = C_to_K(refTempC);
  const T_now = C_to_K(ambientTempC);

  const P_abs_ref = gaugePsiRef + ambientPressurePsi;

  if (keepAbsoluteConstant) {
    // Hold absolute constant; adjust gauge to current ambient.
    const P_abs_target = P_abs_ref;
    const P_gauge_now = P_abs_target - ambientPressurePsi;
    return P_gauge_now;
  } else {
    // Scale absolute by T_now/T_ref so operating pressure matches target at new temp
    const P_abs_now = P_abs_ref * (T_now / T_ref);
    const P_gauge_now = P_abs_now - ambientPressurePsi;
    return P_gauge_now;
  }
}

/** Main convenience: get temps/elevation and recommend front/rear pressures. */
export async function recommendPressures(
  input: RecommendInput
): Promise<RecommendOutput> {
  const {
    coords: maybeCoords,
    frontPsiRef,
    rearPsiRef,
    refTempC = 20,
    when = new Date(),
    keepAbsoluteConstant = false,
  } = input;

  const coords = maybeCoords ?? (await getGeolocation());
  const [ambientTempC, elevationM] = await Promise.all([
    fetchOpenMeteoTempC(coords, when),
    fetchOpenMeteoElevationM(coords),
  ]);

  const ambient_kPa = ambientPressureAtElevation_kPa(elevationM);
  const ambient_psi = ambient_kPa * KPA_TO_PSI;

  const frontPsi =
    round1(
      compensatePressurePsi(
        frontPsiRef,
        refTempC,
        ambientTempC,
        ambient_psi,
        keepAbsoluteConstant
      )
    );
  const rearPsi =
    round1(
      compensatePressurePsi(
        rearPsiRef,
        refTempC,
        ambientTempC,
        ambient_psi,
        keepAbsoluteConstant
      )
    );

  const modeNote = keepAbsoluteConstant
    ? "Absolute-pressure mode: holding absolute constant; gauge varies with altitude."
    : "Gauge-constant mode: temperature-compensated; gauge target stays intuitive.";

  return {
    coords,
    elevationM,
    ambientTempC,
    ambientPressurePsi: round2(ambient_psi),
    front: { psi: frontPsi, note: modeNote },
    rear: { psi: rearPsi, note: modeNote },
  };
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
function round2(n: number) {
  return Math.round(n * 100) / 100;
}
