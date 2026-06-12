import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/ui/icons';
import { MinnesotaMapStatic } from '@/components/maps/minnesota-map-static';
import { NativeTrackingMap } from '@/components/maps/native-tracking-map';
import { ZoomableMapShell } from '@/components/maps/zoomable-map-shell';
import { Colors, RoleAccents } from '@/constants/theme';
import {
  getMapSetupHint,
  shouldUseNativeMapView,
  verifyGoogleMapsKey,
} from '@/lib/map-config';
import type { ParentTrackItem } from '@/lib/mobile-types';

function pickActive(tracks: ParentTrackItem[], focusTrack?: ParentTrackItem | null) {
  return (
    focusTrack ??
    tracks.find((t) => t.vehicle && t.tracking_status === 'in_progress') ??
    tracks.find((t) => t.vehicle) ??
    tracks[0] ??
    null
  );
}

export function ParentTrackingMap({
  tracks,
  center,
  focusTrack,
  height,
  fullScreen = false,
  onExpand,
  hideOverlay = false,
  hideExpand = false,
  topInset,
  showMapLabel = true,
  zoomControlsBottom: zoomControlsBottomProp,
  style,
}: {
  tracks: ParentTrackItem[];
  center?: { lat: number; lng: number };
  focusTrack?: ParentTrackItem | null;
  height?: number;
  fullScreen?: boolean;
  onExpand?: () => void;
  hideOverlay?: boolean;
  hideExpand?: boolean;
  topInset?: number;
  showMapLabel?: boolean;
  zoomControlsBottom?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const controlsTop = topInset ?? insets.top + 12;
  const active = pickActive(tracks, focusTrack);
  const vehicle = active?.vehicle;
  const live = active?.tracking_status === 'in_progress';
  const useNative = shouldUseNativeMapView();
  const [mapIssue, setMapIssue] = useState<string | null>(getMapSetupHint());
  const zoomControlsBottom =
    zoomControlsBottomProp ?? (hideOverlay ? (fullScreen ? 260 : 24) : 96);

  useEffect(() => {
    let cancelled = false;
    void verifyGoogleMapsKey().then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setMapIssue(result.message);
        return;
      }
      setMapIssue(getMapSetupHint());
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = vehicle
    ? `Bus #${vehicle.vehicle_number} · ${Math.round(vehicle.speed_mph)} mph`
    : 'Waiting for bus location';

  const containerStyle = [
    styles.wrap,
    fullScreen && styles.wrapFull,
    !fullScreen && height ? { height, minHeight: height } : null,
    style,
  ];

  const staticMap = (
    <MinnesotaMapStatic live={live} fill showLabel={showMapLabel} />
  );

  const mapBody = useNative ? (
    <NativeTrackingMap
      tracks={tracks}
      center={center}
      focusTrack={focusTrack}
      live={live}
      active={active}
      zoomControlsBottom={zoomControlsBottom}
    />
  ) : (
    <ZoomableMapShell controlsBottom={zoomControlsBottom}>{staticMap}</ZoomableMapShell>
  );

  return (
    <View style={containerStyle}>
      {mapBody}

      {mapIssue ? (
        <View style={[styles.mapHint, fullScreen && { top: controlsTop + 52 }]}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.secondary} />
          <Text style={styles.mapHintText}>{mapIssue}</Text>
        </View>
      ) : null}

      {!hideOverlay && active ? (
        <View style={[styles.statusBar, onExpand && !hideExpand && styles.statusBarExpand]}>
          <View style={styles.statusLeft}>
            {live ? <View style={styles.liveDot} /> : null}
            <Text style={styles.statusTitle} numberOfLines={1}>
              {live ? 'Live tracking' : 'Scheduled route'}
            </Text>
          </View>
          <Text style={styles.statusMeta} numberOfLines={1}>
            {summary}
          </Text>
        </View>
      ) : null}

      {onExpand && !hideExpand ? (
        <Pressable
          style={[styles.expandBtn, { top: controlsTop }]}
          onPress={onExpand}
          hitSlop={8}
          accessibilityLabel="Open full screen map"
        >
          <Ionicons name="expand-outline" size={18} color={Colors.secondary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#D8E4EF',
    position: 'relative',
  },
  wrapFull: { flex: 1, minHeight: 240 },
  mapHint: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.35)',
  },
  mapHintText: { flex: 1, fontSize: 11, lineHeight: 15, fontWeight: '600', color: Colors.secondary },
  statusBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 14,
    gap: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  statusBarExpand: { right: 68 },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  statusTitle: { fontSize: 13, fontWeight: '700', color: Colors.secondary },
  statusMeta: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  expandBtn: {
    position: 'absolute',
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.97)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});
