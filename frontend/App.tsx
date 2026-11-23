import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import MapView, { LatLng, Marker, Polygon } from 'react-native-maps';
import * as Location from 'expo-location';
import { fetchIsochrone, Mode, Shape } from './src/api';
import { FilterBar } from './src/FilterBar';
import { inside } from './src/geo';
import { colors, shadow } from './src/theme';

const US_CENTER = { latitude: 39.5, longitude: -98.35, latitudeDelta: 40, longitudeDelta: 40 };

// ponytail: box = shapes' bounds padded 10°, enough for any zoom you'd use; go world-sized if users zoom way out
function maskBox(shapes: Shape[]): LatLng[] {
  const pts = shapes.flatMap(s => s.coordinates);
  const lats = pts.map(p => p.latitude), lngs = pts.map(p => p.longitude);
  const n = Math.min(85, Math.max(...lats) + 10), s = Math.max(-85, Math.min(...lats) - 10);
  const e = Math.min(180, Math.max(...lngs) + 10), w = Math.max(-180, Math.min(...lngs) - 10);
  return [{ latitude: n, longitude: w }, { latitude: n, longitude: e }, { latitude: s, longitude: e }, { latitude: s, longitude: w }];
}

export default function App() {
  const map = useRef<MapView>(null);
  const [me, setMe] = useState<LatLng | null>(null);
  const [pin, setPin] = useState<LatLng | null>(null);
  const [modes, setModes] = useState<Mode[]>(['walk', 'bus']);
  const [minutes, setMinutes] = useState(15);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const origin = pin ?? me;

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return setError('Location is off. Long-press the map to pick a start point.');
      const { coords } = await Location.getCurrentPositionAsync({});
      setMe({ latitude: coords.latitude, longitude: coords.longitude });
    })().catch(() => setError("Couldn't get your location. Long-press the map to pick a start point."));
  }, []);

  useEffect(() => {
    if (!origin) return;
    const ctrl = new AbortController();
    // debounce so tapping the stepper doesn't fire a request per tap
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const next = await fetchIsochrone(origin, minutes, modes, ctrl.signal);
        setShapes(next);
        setError(null);
        const pts = next.flatMap(s => s.coordinates);
        if (pts.length) map.current?.fitToCoordinates(pts, { edgePadding: { top: 80, right: 40, bottom: 260, left: 40 }, animated: true });
      } catch (e) {
        if (!ctrl.signal.aborted) {
          setShapes([]); // don't leave the old origin's area looking current
          setError("Couldn't load the travel area. Try again.");
        }
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 400);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [origin?.latitude, origin?.longitude, minutes, modes.join()]);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <MapView
        ref={map}
        style={StyleSheet.absoluteFill}
        initialRegion={US_CENTER}
        showsUserLocation
        showsMyLocationButton={false}
        onLongPress={e => setPin(e.nativeEvent.coordinate)}
      >
        {shapes.length > 0 && (
          // wash outside: a big box with every reachable area cut out
          <Polygon coordinates={maskBox(shapes)} holes={shapes.map(s => s.coordinates)}
            fillColor={colors.isoMask} strokeColor="transparent" strokeWidth={0} />
        )}
        {shapes.flatMap((s, i) => s.holes.map((h, j) => (
          // unreachable pockets get the wash too, minus any reachable islands sitting inside them
          <Polygon key={`p${i}-${j}`} coordinates={h}
            holes={shapes.filter((o, k) => k !== i && inside(o.coordinates[0], h)).map(o => o.coordinates)}
            fillColor={colors.isoMask} strokeColor="transparent" strokeWidth={0} />
        )))}
        {shapes.map((s, i) => (
          <Polygon key={i} coordinates={s.coordinates} holes={s.holes}
            fillColor="transparent" strokeColor={colors.green} strokeWidth={1.5} />
        ))}
        {pin && <Marker coordinate={pin} pinColor={colors.green} />}
      </MapView>

      {error && !loading && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{error}</Text>
        </View>
      )}

      <FilterBar
        loading={loading}
        modes={modes} onModes={setModes}
        minutes={minutes} onMinutes={setMinutes}
        originIsPin={!!pin} onUseMyLocation={() => setPin(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  banner: {
    position: 'absolute', top: 64, alignSelf: 'center', maxWidth: '90%',
    backgroundColor: colors.cream, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10, ...shadow,
  },
  bannerText: { color: colors.ink, fontSize: 14, textAlign: 'center' },
});
