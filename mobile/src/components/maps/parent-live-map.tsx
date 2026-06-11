import { LiveMapPreview } from '@/components/maps/live-map-preview';
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
  return <LiveMapPreview {...props} />;
}
