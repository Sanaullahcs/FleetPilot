import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@/components/ui/icons';
import { Colors, RoleAccents } from '@/constants/theme';
import type { ParentTrackItem } from '@/lib/mobile-types';

export function LiveMapPreview({
  tracks,
  center,
}: {
  tracks: ParentTrackItem[];
  center?: { lat: number; lng: number };
}) {
  const active = tracks.find((t) => t.vehicle && t.tracking_status === 'in_progress') ?? tracks[0];
  const vehicle = active?.vehicle;

  return (
    <View style={styles.wrap}>
      <View style={styles.grid}>
        {Array.from({ length: 6 }).map((_, row) => (
          <View key={row} style={styles.gridRow}>
            {Array.from({ length: 8 }).map((__, col) => (
              <View key={col} style={styles.gridCell} />
            ))}
          </View>
        ))}
      </View>
      <View style={styles.routeLine} />
      <View style={[styles.busPin, { left: '58%', top: '42%' }]}>
        <View style={styles.busCircle}>
          <Ionicons name="bus" size={18} color={Colors.white} />
        </View>
        <View style={styles.busPulse} />
      </View>
      <View style={[styles.stopPin, { left: '22%', top: '62%' }]}>
        <Ionicons name="location" size={16} color={RoleAccents.parent} />
      </View>
      <View style={styles.overlay}>
        <Text style={styles.title}>{vehicle ? `Bus #${vehicle.vehicle_number}` : 'Live map'}</Text>
        <Text style={styles.sub}>
          {vehicle
            ? `${Math.round(vehicle.speed_mph)} mph · Heading ${Math.round(vehicle.heading)}°`
            : center
              ? `${center.lat.toFixed(3)}, ${center.lng.toFixed(3)}`
              : 'Waiting for GPS signal'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 180,
    backgroundColor: '#DDE8F5',
    overflow: 'hidden',
    position: 'relative',
  },
  grid: { ...StyleSheet.absoluteFill, opacity: 0.35 },
  gridRow: { flex: 1, flexDirection: 'row' },
  gridCell: { flex: 1, borderWidth: 0.5, borderColor: '#94A3B8' },
  routeLine: {
    position: 'absolute',
    left: '18%',
    top: '55%',
    width: '50%',
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: 999,
    transform: [{ rotate: '-18deg' }],
    opacity: 0.55,
  },
  busPin: { position: 'absolute', alignItems: 'center' },
  busCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
    zIndex: 2,
  },
  busPulse: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${Colors.primary}33`,
    top: -10,
    zIndex: 1,
  },
  stopPin: { position: 'absolute' },
  overlay: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: { fontSize: 14, fontWeight: '800', color: Colors.secondary },
  sub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
});
