// src/hooks/useWind.ts
import { useEffect, useRef, useState } from "react";

/* Types */
export type LatLng = { lat: number; lon: number };
export const WIND_UNITS = ["mph", "kmh", "ms", "kn"] as const;
export type WindUnit = typeof WIND_UNITS[number];

export type UseWindOptions = {
  coords?: LatLng;  // if omitted, we'll try geolocation
  when?: Date;      // nearest hour to this; if omitted we freeze "now"
  unit?: WindUnit;  // mph | kmh | ms | kn
};

export type WindData = {
  time: string;
  speed: number;
  directionDeg: number;
  gust: number | null;
};

/* Helpers */
export function toCompass(deg: number) {
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  const i = Math.round(((deg % 360) / 22.5)) % 16;
  return dirs[i];
}

export function windComponents(windFromDeg: number, headingDeg: number, speed: number) {
  const alpha = ((windFromDeg - headingDeg + 360) % 360) * (Math.PI / 180);
  const headwindSigned = speed * Math.cos(alpha);
  const crossAbs = Math.abs(speed * Math.sin(alpha));
  const beta = ((windFromDeg - headingDeg + 540) % 360) - 180;
  return {
    headwind: Math.abs(headwindSigned),
    headOrTail: headwindSigned >= 0 ? "headwind" : "tailwind",
    crosswind: crossAbs,
    side: beta < 0 ? "left" : "right",
  };
}

/* Hook */
export function useWind(opts: UseWindOptions = {}) {
  const { coords, unit = "mph" } = opts;

  // Freeze "now" once so we don't refetch every render
  const stableWhenRef = useRef<Date>(opts.when ?? new Date());
  const stableWhen = opts.when ?? stableWhenRef.current;

  const [data, setData] = useState<WindData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const ac = new AbortController();

    async function getCoords(): Promise<LatLng> {
      if (coords) return coords;
      if (!("geolocation" in navigator)) throw new Error("Geolocation not available");
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
          err => reject(err),
          { enableHighAccuracy: true, timeout: 10000 }
        );
      });
    }

    (async () => {
      try {
        setLoading(true);
        setError(null); // keep old data visible

        const { lat, lon } = await getCoords();

        const url = new URL("https://api.open-meteo.com/v1/forecast");
        url.searchParams.set("latitude", String(lat));
        url.searchParams.set("longitude", String(lon));
        url.searchParams.set("hourly", "windspeed_10m,winddirection_10m,windgusts_10m");
        url.searchParams.set("timezone", "auto");
        url.searchParams.set("past_days", "1");
        url.searchParams.set("forecast_days", "2");
        url.searchParams.set("wind_speed_unit", unit);

        const res = await fetch(url.toString(), { signal: ac.signal });
        if (!res.ok) throw new Error(`Open-Meteo error ${res.status}`);
        const j = await res.json();

        const times: string[] = j?.hourly?.time ?? [];
        const speeds: number[] = j?.hourly?.windspeed_10m ?? [];
        const dirs: number[] = j?.hourly?.winddirection_10m ?? [];
        const gusts: number[] = j?.hourly?.windgusts_10m ?? [];
        if (!times.length) throw new Error("No wind data returned");

        // Nearest hour to stableWhen
        const target = stableWhen.getTime();
        let idx = 0, best = Infinity;
        for (let i = 0; i < times.length; i++) {
          const d = Math.abs(new Date(times[i]).getTime() - target);
          if (d < best) { best = d; idx = i; }
        }

        if (!alive) return;
        setData({
          time: times[idx],
          speed: speeds[idx],
          directionDeg: dirs[idx],
          gust: gusts[idx] ?? null,
        });
      } catch (err: any) {
        if (!alive) return;
        setError(err?.message ?? String(err));
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; ac.abort(); };
  }, [coords?.lat, coords?.lon, unit]);

  return { data, loading, error };
}
