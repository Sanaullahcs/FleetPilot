export type ComplaintStatus =
  | 'submitted'
  | 'acknowledged'
  | 'in_progress'
  | 'waiting_on_submitter'
  | 'resolved'
  | 'closed'
  | 'rejected';

export interface ComplaintUpdate {
  id: string;
  type: string;
  body: string;
  is_internal: boolean;
  created_at: string;
  author: { id: string | null; name: string; role: string };
}

export interface ComplaintRecord {
  id: string;
  reference_number: string;
  subject: string;
  description?: string;
  category: string;
  category_label: string;
  status: ComplaintStatus;
  status_label: string;
  priority: string;
  priority_label: string;
  submitter_role: string;
  preferred_contact: string;
  contact_phone?: string | null;
  incident_date?: string | null;
  location_note?: string | null;
  updates_count: number;
  created_at: string;
  last_activity_at: string;
  student?: { id: string; name: string } | null;
  school?: { id: string; name: string } | null;
  route?: { id: string; name: string; code?: string | null } | null;
  assignee?: { id: string; name: string } | null;
  resolution_summary?: string | null;
  updates?: ComplaintUpdate[];
}

export interface ComplaintFormOptions {
  categories: { value: string; label: string }[];
  priorities: { value: string; label: string }[];
  contact_methods: { value: string; label: string }[];
  students: { id: string; name: string; grade?: string | null }[];
  routes: { id: string; name: string; code?: string | null }[];
  school: { id: string; name: string; district?: string | null } | null;
  organization: { name?: string | null; phone?: string | null; email?: string | null };
}

export interface CreateComplaintPayload {
  category: string;
  subject: string;
  description: string;
  priority?: string;
  preferred_contact?: string;
  contact_phone?: string;
  incident_date?: string;
  location_note?: string;
  student_id?: string;
  route_id?: string;
  school_id?: string;
}
