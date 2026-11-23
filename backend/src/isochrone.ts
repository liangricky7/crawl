export const MODES = ['walk', 'bike', 'bus', 'car'] as const;
export type Mode = (typeof MODES)[number];

const TRAVELTIME_TYPE: Record<Mode, string> = {
  walk: 'walking',
  bike: 'cycling',
  bus: 'public_transport', // includes walking legs
  car: 'driving',
};

type LatLng = { lat: number; lng: number };
type Shape = { shell: LatLng[]; holes: LatLng[][] };

export function buildTimeMapBody(origin: LatLng, minutes: number, modes: Mode[], now = new Date()) {
  // walking is already part of a transit search, so it adds nothing to the union
  const effective = [...new Set(modes)].filter(m => !(m === 'walk' && modes.includes('bus')));
  const body: Record<string, unknown> = {
    departure_searches: effective.map(m => ({
      id: m,
      coords: origin,
      departure_time: now.toISOString(),
      travel_time: minutes * 60,
      transportation: { type: TRAVELTIME_TYPE[m] },
    })),
  };
  if (effective.length > 1) body.unions = [{ id: 'union', search_ids: effective }];
  return body;
}

const toPoint = (p: LatLng) => ({ latitude: p.lat, longitude: p.lng });

export async function fetchIsochrone(origin: LatLng, minutes: number, modes: Mode[]) {
  const body = buildTimeMapBody(origin, minutes, modes);
  const res = await fetch('https://api.traveltimeapp.com/v4/time-map', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Application-Id': process.env.TRAVELTIME_APP_ID ?? '',
      'X-Api-Key': process.env.TRAVELTIME_API_KEY ?? '',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`TravelTime ${res.status}: ${await res.text()}`);

  const { results } = (await res.json()) as { results: { search_id: string; shapes: Shape[] }[] };
  const wanted = body.unions ? 'union' : (body.departure_searches as { id: string }[])[0].id;
  // never fall back to a single mode's shape: that would silently understate the area
  const shapes = results.find(r => r.search_id === wanted)?.shapes;
  if (!shapes) throw new Error(`TravelTime returned no '${wanted}' result`);
  // shaped for react-native-maps <Polygon coordinates holes />
  return shapes.map(s => ({ coordinates: s.shell.map(toPoint), holes: s.holes.map(h => h.map(toPoint)) }));
}
