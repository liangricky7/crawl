import Constants from 'expo-constants';
import type { LatLng } from 'react-native-maps';

export type Mode = 'walk' | 'bike' | 'bus' | 'car';
export type Shape = { coordinates: LatLng[]; holes: LatLng[][] };

// In dev, reach the backend on the same machine that serves the JS bundle.
const devHost = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? `http://${devHost}:3000`;

export async function fetchIsochrone(
  origin: LatLng, minutes: number, modes: Mode[], signal?: AbortSignal,
): Promise<Shape[]> {
  // own controller so a stalled request fails (shows an error) instead of spinning forever;
  // the caller's signal still cancels it when inputs change
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  signal?.addEventListener('abort', () => ctrl.abort());
  try {
    const res = await fetch(`${API_URL}/isochrone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat: origin.latitude, lng: origin.longitude, minutes, modes }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`isochrone ${res.status}`);
    return (await res.json()).shapes;
  } finally {
    clearTimeout(timer);
  }
}
