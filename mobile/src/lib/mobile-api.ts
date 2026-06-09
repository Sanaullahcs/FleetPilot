import { apiRequest } from '@/lib/api';
import type {
  DriverAssignmentDetail,
  DriverProfilePayload,
  DriverTodayPayload,
  MobileNotification,
  ParentChildItem,
  ParentProfilePayload,
  ParentTrackItem,
} from '@/lib/mobile-types';

export function fetchMobileNotifications() {
  return apiRequest<{ data: { items: MobileNotification[]; total: number; unread: number } }>(
    '/mobile/notifications',
  ).then((r) => r.data);
}

export function fetchDriverToday() {
  return apiRequest<{ data: DriverTodayPayload }>('/driver/runs/today').then((r) => r.data);
}

export function fetchDriverProfile() {
  return apiRequest<{ data: DriverProfilePayload }>('/driver/profile').then((r) => r.data);
}

export function updateDriverProfile(payload: {
  phone?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
}) {
  return apiRequest<{ data: DriverProfilePayload }>('/driver/profile', {
    method: 'PUT',
    body: payload,
  }).then((r) => r.data);
}

export function fetchDriverAssignment(assignmentId: string) {
  return apiRequest<{ data: DriverAssignmentDetail }>(`/driver/assignments/${assignmentId}`).then((r) => r.data);
}

export function startDriverAssignment(assignmentId: string) {
  return apiRequest<{ data: { id: string; status: string; actual_start_time: string | null } }>(
    `/driver/assignments/${assignmentId}/start`,
    { method: 'POST' },
  ).then((r) => r.data);
}

export function completeDriverStop(assignmentId: string, runStopId: string) {
  return apiRequest<{
    data: {
      run_stop_id: string;
      status: string;
      completed_at: string;
      assignment_status?: string;
    };
  }>(`/driver/assignments/${assignmentId}/stops/${runStopId}/complete`, { method: 'POST' }).then((r) => r.data);
}

export function fetchParentChildren() {
  return apiRequest<{ data: ParentChildItem[] }>('/parent/children').then((r) => r.data);
}

export function fetchParentProfile() {
  return apiRequest<{ data: ParentProfilePayload }>('/parent/profile').then((r) => r.data);
}

export function updateParentProfile(payload: {
  relationship?: string | null;
  preferred_language?: string | null;
  notification_preferences?: {
    push?: boolean;
    sms?: boolean;
    email?: boolean;
  };
}) {
  return apiRequest<{ data: ParentProfilePayload }>('/parent/profile', {
    method: 'PUT',
    body: payload,
  }).then((r) => r.data);
}

export function fetchParentTracking() {
  return apiRequest<{
    data: {
      updated_at: string;
      center: { lat: number; lng: number };
      tracks: ParentTrackItem[];
    };
  }>('/parent/tracking').then((r) => r.data);
}

export function fetchMobileAppInfo(organization?: string) {
  const query = organization ? `?organization=${encodeURIComponent(organization)}` : '';
  return apiRequest<{ data: import('@/lib/mobile-types').MobileAppInfo }>(`/mobile/app-info${query}`, {
    auth: false,
  }).then((r) => r.data);
}

export function fetchMobileSupport() {
  return apiRequest<{ data: import('@/lib/mobile-types').SupportPayload }>('/mobile/support').then((r) => r.data);
}
