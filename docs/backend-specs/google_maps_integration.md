# Google Maps Platform Integration

## Overview

Google Maps Platform powers routing, geocoding, distance calculations, and navigation across the entire platform. This document specifies which APIs are used, how they are integrated, and cost management.

---

## APIs Used

### 1. Google Maps JavaScript API
**Used by:** Next.js web app (dispatch dashboard, driver web portal, parent web portal)

**Features:**
- Interactive maps for dispatch fleet tracking
- Route visualization with polylines
- Stop markers with custom icons (pickup, dropoff, garage, school)
- Parent tracking map with live vehicle position
- Geofence visualization around schools

**Implementation:**
```javascript
// web/components/maps/FleetMap.tsx
import { GoogleMap, Marker, Polyline } from '@react-google-maps/api';

const mapOptions = {
  mapTypeId: 'roadmap',
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
};

// Load map with API key from environment
const { isLoaded } = useJsApiLoader({
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
});
```

---

### 2. Google Directions API
**Used by:** Next.js web app (route preview), React Native driver app (turn-by-turn)

**Features:**
- Preview suggested route between stops
- Calculate accurate drive time estimates
- Display step-by-step directions in driver app

**Implementation:**
```typescript
// API call from Laravel backend to validate routes
$directions = Http::get('https://maps.googleapis.com/maps/api/directions/json', [
    'origin' => '40.7128,-74.0060',
    'destination' => '40.7150,-73.9950',
    'waypoints' => 'optimize:true|40.7135,-74.0010|40.7142,-73.9980',
    'departure_time' => 'now',
    'traffic_model' => 'best_guess',
    'key' => config('services.google.maps_api_key'),
]);
```

---

### 3. Google Distance Matrix API
**Used by:** OR-Tools optimization microservice, billing calculations

**Features:**
- Precise distance and duration between all stop pairs
- Traffic-aware time estimates
- Used as input to OR-Tools VRP solver for accurate optimization

**Implementation:**
```python
# optimization/app.py
import requests

def get_distance_matrix(stops):
    origins = '|'.join([f"{s['latitude']},{s['longitude']}" for s in stops])
    destinations = origins
    
    response = requests.get('https://maps.googleapis.com/maps/api/distancematrix/json', params={
        'origins': origins,
        'destinations': destinations,
        'mode': 'driving',
        'departure_time': 'now',
        'key': GOOGLE_MAPS_API_KEY,
    })
    
    data = response.json()
    # Build distance matrix from response
    matrix = []
    for row in data['rows']:
        matrix_row = []
        for element in row['elements']:
            matrix_row.append(element['distance']['value'])  # meters
        matrix.append(matrix_row)
    
    return matrix
```

---

### 4. Google Geocoding API
**Used by:** Stop creation, on-demand request forms, address validation

**Features:**
- Convert street addresses to latitude/longitude
- Address autocomplete suggestions
- Validate addresses before saving

**Implementation:**
```php
// Laravel service for address geocoding
class GeocodingService
{
    public function geocode(string $address): ?array
    {
        $response = Http::get('https://maps.googleapis.com/maps/api/geocode/json', [
            'address' => $address,
            'key' => config('services.google.maps_api_key'),
        ]);
        
        $data = $response->json();
        
        if ($data['status'] !== 'OK' || empty($data['results'])) {
            return null;
        }
        
        $location = $data['results'][0]['geometry']['location'];
        
        return [
            'latitude' => $location['lat'],
            'longitude' => $location['lng'],
            'formatted_address' => $data['results'][0]['formatted_address'],
            'place_id' => $data['results'][0]['place_id'],
        ];
    }
}
```

---

### 5. Places Autocomplete API
**Used by:** Stop creation form, on-demand request form, parent registration

**Features:**
- Real-time address suggestions as user types
- Restricted to geographic region (US)
- Structured address components (street, city, state, zip)

**Implementation:**
```typescript
// web/components/AddressAutocomplete.tsx
import { useLoadScript, Autocomplete } from '@react-google-maps/api';

const libraries: Libraries = ['places'];

function AddressAutocomplete({ onSelect }) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const handlePlaceChanged = (autocomplete) => {
    const place = autocomplete.getPlace();
    onSelect({
      address: place.formatted_address,
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    });
  };

  return (
    <Autocomplete
      onLoad={(ref) => (autocompleteRef.current = ref)}
      onPlaceChanged={() => handlePlaceChanged(autocompleteRef.current)}
      options={{
        componentRestrictions: { country: 'us' },
        types: ['address'],
      }}
    >
      <input type="text" placeholder="Enter address..." />
    </Autocomplete>
  );
}
```

---

## API Key Security

### Backend Key (Server-side only)
- Used for: Distance Matrix, Directions API, Geocoding
- Stored in: Laravel `.env` file
- Never exposed to frontend
- Restricted by IP address in Google Cloud Console

### Frontend Key (Client-side)
- Used for: Maps JavaScript API, Places Autocomplete
- Stored in: Next.js environment variables (`NEXT_PUBLIC_`)
- Restricted by HTTP referrer in Google Cloud Console
- Rate limited per client session

---

## Cost Management

### Expected Monthly Usage

| API | Estimated Calls/Month |
|-----|----------------------|
| Maps JavaScript | 50,000 loads |
| Directions | 10,000 |
| Distance Matrix | 5,000 |
| Geocoding | 2,000 |
| Places Autocomplete | 20,000 |

**Cost Optimization:**
- Cache geocoding results in database (stops rarely change address)
- Use Haversine formula for rough estimates; only call Distance Matrix for optimization
- Batch Distance Matrix requests (up to 25 origins x 25 destinations per call)
- Implement client-side caching for autocomplete suggestions

### Alternative: OpenStreetMap (Cost Reduction)

If Google Maps costs exceed allocated operational limits:

| Feature | Google Maps | OpenStreetMap Alternative |
|---------|-------------|--------------------------|
| Interactive maps | JavaScript API | Leaflet + OpenStreetMap tiles (free) |
| Routing | Directions API | OSRM or Valhalla (self-hosted, free) |
| Geocoding | Geocoding API | Nominatim (free with rate limits) |
| Autocomplete | Places API | Nominatim or Pelias |
| Distance Matrix | Distance Matrix API | OSRM table service |

**Migration path:** Abstract map provider behind interface; swap implementation without changing frontend code.

---

## Implementation in Laravel

```php
// config/services.php
'google' => [
    'maps_api_key' => env('GOOGLE_MAPS_API_KEY'),
    'maps_frontend_key' => env('GOOGLE_MAPS_FRONTEND_KEY'),
],

// app/Services/GoogleMapsService.php
class GoogleMapsService
{
    private string $apiKey;
    
    public function __construct()
    {
        $this->apiKey = config('services.google.maps_api_key');
    }
    
    public function getDirections(array $stops): ?array
    {
        // Call Directions API
    }
    
    public function getDistanceMatrix(array $origins, array $destinations): ?array
    {
        // Call Distance Matrix API
    }
    
    public function geocodeAddress(string $address): ?array
    {
        // Call Geocoding API
    }
    
    public function getPlaceDetails(string $placeId): ?array
    {
        // Call Places API
    }
}
```

---

*Version: 1.0 | Google Maps Platform | Last Updated: June 5, 2026*
