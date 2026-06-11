import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';
import { Ionicons } from '@/components/ui/icons';
import { MapZoomControls } from '@/components/maps/map-zoom-controls';
import { Colors, RoleAccents } from '@/constants/theme';
import { getMapProvider, getMapType } from '@/lib/map-config';
import { regionForTracks, routePolyline } from '@/lib/parent-map-utils';
import type { ParentTrackItem } from '@/lib/mobile-types';

const ZOOM_FACTOR = 0.55;

function zoomRegion(region: Region, direction: 'in' | 'out'): Region {
  const factor = direction === 'in' ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
  return {
    ...region,
    latitudeDelta: Math.min(2, Math.max(0.004, region.latitudeDelta * factor)),
    longitudeDelta: Math.min(2, Math.max(0.004, region.longitudeDelta * factor)),
  };
}

/** Real map tiles — only used when EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is set. */
export function NativeTrackingMap({
  tracks,
  center,
  focusTrack,
  live,
  active,
  zoomControlsBottom = 16,
}: {
  tracks: ParentTrackItem[];
  center?: { lat: number; lng: number };
  focusTrack?: ParentTrackItem | null;
  live: boolean;
  active: ParentTrackItem | null;
  zoomControlsBottom?: number;
}) {
  const mapRef = useRef<MapView>(null);
  const [ready, setReady] = useState(false);
  const vehicle = active?.vehicle;
  const baseRegion = useMemo(() => regionForTracks(tracks, active, center), [tracks, active, center]);
  const [viewRegion, setViewRegion] = useState<Region>(baseRegion);
  const line = useMemo(() => routePolyline(active), [active]);

  useEffect(() => {
    setViewRegion(baseRegion);
    if (!ready) return;
    mapRef.current?.animateToRegion(baseRegion, 500);
  }, [baseRegion.latitude, baseRegion.longitude, baseRegion.latitudeDelta, baseRegion.longitudeDelta, ready]);

  const handleZoom = (direction: 'in' | 'out') => {
    setViewRegion((prev) => {
      const next = zoomRegion(prev, direction);
      mapRef.current?.animateToRegion(next, 250);
      return next;
    });
  };

  return (
    <View style={styles.wrap}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={getMapProvider()}
        region={viewRegion}
        initialRegion={baseRegion}
        mapType={getMapType()}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        scrollEnabled
        zoomEnabled
        zoomTapEnabled
        loadingEnabled
        loadingBackgroundColor="#E8EEF4"
        loadingIndicatorColor={RoleAccents.parent}
        onMapReady={() => setReady(true)}
        onRegionChangeComplete={setViewRegion}
      >
        {line.length === 2 ? (
          <Polyline
            coordinates={line}
            strokeColor={live ? Colors.success : RoleAccents.parent}
            strokeWidth={5}
            lineDashPattern={live ? undefined : [10, 8]}
          />
        ) : null}

        {active?.school?.latitude != null && active.school.longitude != null ? (
          <Marker
            coordinate={{ latitude: active.school.latitude, longitude: active.school.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.schoolPin}>
              <Ionicons name="school" size={14} color={Colors.white} />
            </View>
          </Marker>
        ) : null}

        {vehicle ? (
          <Marker
            coordinate={{ latitude: vehicle.latitude, longitude: vehicle.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
            rotation={vehicle.heading}
          >
            <View style={styles.busMarkerWrap}>
              {live ? <View style={styles.busPulse} /> : null}
              <View style={[styles.busPin, live && styles.busPinLive]}>
                <Ionicons name="bus" size={16} color={Colors.white} />
              </View>
            </View>
          </Marker>
        ) : null}
      </MapView>

      {!ready ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator color={RoleAccents.parent} />
        </View>
      ) : null}

      <MapZoomControls
        bottom={zoomControlsBottom}
        onZoomIn={() => handleZoom('in')}
        onZoomOut={() => handleZoom('out')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minHeight: 200 },
  map: StyleSheet.absoluteFill,
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8EEF4',
  },
  schoolPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: RoleAccents.parent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: Colors.white,
  },
  busMarkerWrap: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  busPin: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: RoleAccents.parent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  busPinLive: { backgroundColor: Colors.success },
  busPulse: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(5,150,105,0.2)',
  },
});
