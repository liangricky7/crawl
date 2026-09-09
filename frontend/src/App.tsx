import {APIProvider, Map} from '@vis.gl/react-google-maps';
import { useCurrentLocation } from './hooks/useCurrentLocation';

export function App() {
  const {coords, error, loading} = useCurrentLocation();
  if (loading) return null;

  console.log('coords', coords, 'error', error);

  return (
    <APIProvider apiKey={import.meta.env.VITE_API_KEY}>
      <Map
        style={{width: '100vw', height: '100vh'}}
        defaultCenter={coords ? {lat: coords.latitude, lng: coords.longitude} : {lat: 22.54992, lng: 0}}
        defaultZoom={coords ? 15 : 3}
        gestureHandling='greedy'
        disableDefaultUI
      />
    </APIProvider>
  );
}

export default App;
