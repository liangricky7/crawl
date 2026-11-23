import type { LatLng } from 'react-native-maps';

// ray casting; fine for city-sized rings that don't cross the antimeridian
export function inside(p: LatLng, ring: LatLng[]): boolean {
  let hit = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j];
    if ((a.latitude > p.latitude) !== (b.latitude > p.latitude) &&
        p.longitude < ((b.longitude - a.longitude) * (p.latitude - a.latitude)) / (b.latitude - a.latitude) + a.longitude) hit = !hit;
  }
  return hit;
}
