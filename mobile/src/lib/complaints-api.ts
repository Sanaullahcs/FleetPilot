import { apiRequest } from '@/lib/api';
import type { ComplaintFormOptions, ComplaintRecord, CreateComplaintPayload } from '@/lib/complaint-types';

export function fetchComplaintFormOptions() {
  return apiRequest<{ data: ComplaintFormOptions }>('/complaints/form-options').then((r) => r.data);
}

export function fetchMyComplaints(status?: string) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiRequest<{ data: { items: ComplaintRecord[]; total: number } }>(`/complaints/mine${qs}`).then(
    (r) => r.data,
  );
}

export function fetchComplaint(id: string) {
  return apiRequest<{ data: ComplaintRecord }>(`/complaints/${id}`).then((r) => r.data);
}

export function createComplaint(payload: CreateComplaintPayload) {
  return apiRequest<{ data: ComplaintRecord }>('/complaints', {
    method: 'POST',
    body: payload,
  }).then((r) => r.data);
}

export function addComplaintComment(id: string, body: string) {
  return apiRequest<{ data: ComplaintRecord }>(`/complaints/${id}/comments`, {
    method: 'POST',
    body: { body },
  }).then((r) => r.data);
}
