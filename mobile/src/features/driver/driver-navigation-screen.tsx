import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/ui/icons';
import { AppHeader } from '@/components/shell/app-header';
import { PrimaryButton } from '@/components/ui/primitives';
import { NavigationPickerSheet } from '@/components/maps/navigation-picker-sheet';
import { Colors, RoleAccents } from '@/constants/theme';
import { formatTime } from '@/lib/format';
import { completeDriverStop, fetchDriverAssignment } from '@/lib/mobile-api';
import {
  getNextPendingStop,
  getStopCoordinates,
  haversineMiles,
  type MapStop,
} from '@/lib/maps-navigation';

export function DriverNavigationScreen() {
  const { assignmentId, stopId } = useLocalSearchParams<{ assignmentId: string; stopId?: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);

  const detail = useQuery({
    queryKey: ['driver-assignment', assignmentId],
    queryFn: () => fetchDriverAssignment(assignmentId!),
    enabled: Boolean(assignmentId),
  });

  const stop = useMemo(() => {
    if (!detail.data) {
      return undefined;
    }
    if (stopId) {
      return detail.data.stops.find((item) => item.id === stopId);
    }
    return getNextPendingStop(detail.data.stops);
  }, [detail.data, stopId]);

  const stopCoords = stop ? getStopCoordinates(stop) : null;

  useEffect(() => {
    let cancelled = false;
    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (!cancelled) {
          setLocationError('Location permission is needed for in-app navigation.');
        }
        return;
      }

      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (!cancelled) {
        setUserLocation({
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        });
      }

      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 25 },
        (position) => {
          if (!cancelled) {
            setUserLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          }
        },
      );
    })().catch(() => {
      if (!cancelled) {
        setLocationError('Could not read your current location.');
      }
    });

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !stopCoords) {
      return;
    }

    const points = userLocation ? [userLocation, stopCoords] : [stopCoords];
    mapRef.current.fitToCoordinates(points, {
      edgePadding: { top: 80, right: 48, bottom: 180, left: 48 },
      animated: true,
    });
  }, [stopCoords?.latitude, stopCoords?.longitude, userLocation?.latitude, userLocation?.longitude]);

  const distanceMiles =
    userLocation && stopCoords ? haversineMiles(userLocation, stopCoords) : null;

  const completeStop = useMutation({
    mutationFn: () => completeDriverStop(assignmentId!, stop!.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['driver-assignment', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['driver-today'] });

      const refreshed = await queryClient.fetchQuery({
        queryKey: ['driver-assignment', assignmentId],
        queryFn: () => fetchDriverAssignment(assignmentId!),
      });
      const next = getNextPendingStop(refreshed.stops);
      if (next) {
        router.replace(`/run/${assignmentId}/navigate?stopId=${next.id}`);
      } else {
        router.replace(`/run/${assignmentId}`);
      }
    },
  });

  const openInAppForStop = (target: MapStop) => {
    router.push(`/run/${assignmentId}/navigate?stopId=${target.id}`);
  };

  if (detail.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!detail.data || !stop) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Stop not found for this run.</Text>
        <PrimaryButton label="Back to manifest" onPress={() => router.back()} />
      </View>
    );
  }

  if (!stopCoords) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>This stop has no map coordinates.</Text>
        <PrimaryButton label="Choose another app" onPress={() => setPickerVisible(true)} />
        <NavigationPickerSheet
          visible={pickerVisible}
          stop={stop}
          onClose={() => setPickerVisible(false)}
          onInAppNavigate={openInAppForStop}
        />
      </View>
    );
  }

  const routeLine = userLocation ? [userLocation, stopCoords] : [stopCoords];

  return (
    <View style={styles.root}>
      <AppHeader
        title={stop.name}
        subtitle={detail.data.route?.school ?? 'Turn-by-turn navigation'}
        onBackPress={() => router.back()}
      />

      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={PROVIDER_DEFAULT}
          showsUserLocation
          showsMyLocationButton={false}
          initialRegion={{
            latitude: stopCoords.latitude,
            longitude: stopCoords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          <Marker
            coordinate={stopCoords}
            title={stop.name}
            description={stop.address ?? undefined}
            pinColor={RoleAccents.driver}
          />
          <Polyline coordinates={routeLine} strokeColor={RoleAccents.driver} strokeWidth={4} />
        </MapView>

        <View style={styles.mapOverlay}>
          <View style={styles.statChip}>
            <Ionicons name="navigate" size={14} color={RoleAccents.driver} />
            <Text style={styles.statChipText}>
              {distanceMiles != null ? `${distanceMiles.toFixed(1)} mi away` : 'Calculating distance…'}
            </Text>
          </View>
          <View style={styles.statChip}>
            <Ionicons name="time-outline" size={14} color={Colors.primary} />
            <Text style={styles.statChipText}>
              ETA {formatTime(stop.estimated_arrival ?? stop.scheduled_time)}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Text style={styles.address} numberOfLines={2}>
          {stop.address}
        </Text>
        {locationError ? <Text style={styles.locationWarn}>{locationError}</Text> : null}

        <View style={styles.footerActions}>
          <Pressable style={styles.secondaryBtn} onPress={() => setPickerVisible(true)}>
            <Ionicons name="open-outline" size={18} color={RoleAccents.driver} />
            <Text style={styles.secondaryBtnText}>Other app</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              label={completeStop.isPending ? 'Saving…' : 'Mark stop complete'}
              icon="checkmark-circle"
              onPress={() => completeStop.mutate()}
              disabled={completeStop.isPending}
            />
          </View>
        </View>
      </View>

      <NavigationPickerSheet
        visible={pickerVisible}
        stop={stop}
        onClose={() => setPickerVisible(false)}
        onInAppNavigate={openInAppForStop}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundElement },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
    backgroundColor: Colors.backgroundElement,
  },
  errorText: { fontSize: 15, color: Colors.textMuted, textAlign: 'center' },
  mapWrap: { flex: 1, position: 'relative' },
  mapOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statChipText: { fontSize: 12, fontWeight: '700', color: Colors.secondary },
  footer: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 18,
    paddingTop: 14,
    gap: 10,
  },
  address: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
  locationWarn: { fontSize: 12, color: Colors.warning },
  footerActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: `${RoleAccents.driver}55`,
    backgroundColor: `${RoleAccents.driver}10`,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '700', color: RoleAccents.driver },
});
