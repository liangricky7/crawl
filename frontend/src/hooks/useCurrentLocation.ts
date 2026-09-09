import { useState, useEffect } from 'react';

export function useCurrentLocation() {
  const [coords, setCoords] = useState<GeolocationCoordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('unsupported');
      setLoading(false);
      return;
    }
    const id = navigator.geolocation.watchPosition(
      pos => { setCoords(pos.coords); setError(null); setLoading(false); },
      err => { setError(`${err.code}: ${err.message}`); setLoading(false); },
      {enableHighAccuracy: true, maximumAge: 5000, timeout: 10000}
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return {coords, error, loading};
}