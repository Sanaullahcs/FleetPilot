import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@/components/ui/icons';
import { TrackMapIllustration } from '@/components/maps/track-map-illustration';
import { Colors } from '@/constants/theme';
import type { ParentTrackItem } from '@/lib/mobile-types';

function pickActive(tracks: ParentTrackItem[], focusTrack?: ParentTrackItem | null) {
  return (
    focusTrack ??
    tracks.find((t) => t.vehicle && t.tracking_status === 'in_progress') ??
    tracks.find((t) => t.vehicle) ??
    tracks[0]
  );
}

export function LiveMapPreview({
  tracks,
  focusTrack,
  height,
  fullScreen = false,
  onExpand,
  hideOverlay = false,
}: {
  tracks: ParentTrackItem[];
  center?: { lat: number; lng: number };
  focusTrack?: ParentTrackItem | null;
  height?: number;
  fullScreen?: boolean;
  onExpand?: () => void;
  hideOverlay?: boolean;
  hideChrome?: boolean;
}) {
  const { width } = useWindowDimensions();
  const active = pickActive(tracks, focusTrack);
  const vehicle = active?.vehicle;
  const live = active?.tracking_status === 'in_progress';
  const mapHeight = height ?? Math.min(Math.round(width * 0.48), 260);

  const summary = vehicle
    ? `Bus #${vehicle.vehicle_number}  ·  ${Math.round(vehicle.speed_mph)} mph  ·  ${Math.round(vehicle.heading)}°`
    : 'Waiting for GPS';

  const content = (
    <>
      <TrackMapIllustration live={live} fill={fullScreen} height={fullScreen ? undefined : mapHeight} />
      {onExpand ? (
        <View style={styles.expandHint} pointerEvents="none">
          <Ionicons name="expand-outline" size={16} color={Colors.textMuted} />
        </View>
      ) : null}
      {!hideOverlay && active ? (
        <View style={styles.caption}>
          {live ? <View style={styles.liveDot} /> : null}
          <Text style={styles.captionText} numberOfLines={1}>{summary}</Text>
        </View>
      ) : null}
    </>
  );

  if (onExpand) {
    return (
      <Pressable
        style={[styles.wrap, fullScreen && styles.wrapFull, !fullScreen && { height: mapHeight }]}
        onPress={onExpand}
        accessibilityRole="button"
        accessibilityLabel="Open full screen map"
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[styles.wrap, fullScreen && styles.wrapFull, !fullScreen && { height: mapHeight }]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', overflow: 'hidden', position: 'relative', backgroundColor: '#E8EEF8' },
  wrapFull: { flex: 1 },
  expandHint: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success },
  captionText: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.secondary, letterSpacing: -0.2 },
});
