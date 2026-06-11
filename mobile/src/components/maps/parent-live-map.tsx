import { ParentTrackingMap } from '@/components/maps/parent-tracking-map';
import type { ParentTrackItem } from '@/lib/mobile-types';

export function ParentLiveMap(props: {
  tracks: ParentTrackItem[];
  center?: { lat: number; lng: number };
  focusTrack?: ParentTrackItem | null;
  height?: number;
  fullScreen?: boolean;
  onExpand?: () => void;
  hideOverlay?: boolean;
  hideChrome?: boolean;
}) {
  return <ParentTrackingMap {...props} hideOverlay={props.hideOverlay || props.hideChrome} />;
}
