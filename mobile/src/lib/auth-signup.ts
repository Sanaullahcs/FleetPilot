/** Mirrors web/src/lib/auth-api.ts RegisterPayload for dashboard parity. */

import type { FieldErrors } from '@/lib/auth-validation';

export type SignupRole = 'driver' | 'parent';

export interface SignupOrganization {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
}

export interface SignupAdmin {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

export interface SignupSchool {
  id: string;
  name: string;
  code: string | null;
  city: string | null;
  district: string | null;
}

export interface RegisterPayload {
  role: SignupRole;
  organization_id: string;
  admin_user_id: string;
  school_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  employee_id?: string;
  license_number?: string;
  license_state?: string;
  license_expiry?: string;
  date_of_birth?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  relationship?: string;
  child_first_name?: string;
  child_last_name?: string;
  child_grade?: string;
}

export interface SignupFormState {
  role: SignupRole;
  organizationId: string;
  adminUserId: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  passwordConfirm: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  employeeId: string;
  licenseNumber: string;
  licenseState: string;
  licenseExpiry: string;
  dateOfBirth: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  relationship: string;
  childFirstName: string;
  childLastName: string;
  childGrade: string;
}

export type SignupField = keyof SignupFormState | 'terms' | 'captcha';

export const RELATIONSHIP_OPTIONS = [
  { label: 'Mother', value: 'mother' },
  { label: 'Father', value: 'father' },
  { label: 'Guardian', value: 'guardian' },
  { label: 'Grandparent', value: 'grandparent' },
  { label: 'Other', value: 'other' },
] as const;

export const EMPTY_SIGNUP_FORM: SignupFormState = {
  role: 'parent',
  organizationId: '',
  adminUserId: '',
  schoolId: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  passwordConfirm: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  employeeId: '',
  licenseNumber: '',
  licenseState: '',
  licenseExpiry: '',
  dateOfBirth: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  relationship: '',
  childFirstName: '',
  childLastName: '',
  childGrade: '',
};

function opt(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/** Same shape as web signup buildPayload for driver/parent roles. */
export function buildRegisterPayload(form: SignupFormState): RegisterPayload {
  const isDriver = form.role === 'driver';

  return {
    role: form.role,
    organization_id: form.organizationId,
    admin_user_id: form.adminUserId,
    school_id: !isDriver ? form.schoolId : undefined,
    first_name: form.firstName.trim(),
    last_name: form.lastName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    password: form.password,
    password_confirmation: form.passwordConfirm,
    address: form.address.trim(),
    city: form.city.trim(),
    state: form.state.trim().toUpperCase(),
    zip: form.zip.trim(),
    employee_id: isDriver ? opt(form.employeeId) : undefined,
    license_number: isDriver ? opt(form.licenseNumber) : undefined,
    license_state: isDriver ? opt(form.licenseState)?.toUpperCase() : undefined,
    license_expiry: isDriver ? opt(form.licenseExpiry) : undefined,
    date_of_birth: isDriver ? opt(form.dateOfBirth) : undefined,
    emergency_contact_name: isDriver ? opt(form.emergencyContactName) : undefined,
    emergency_contact_phone: isDriver ? opt(form.emergencyContactPhone) : undefined,
    relationship: !isDriver ? opt(form.relationship) : undefined,
    child_first_name: !isDriver ? opt(form.childFirstName) : undefined,
    child_last_name: !isDriver ? opt(form.childLastName) : undefined,
    child_grade: !isDriver ? opt(form.childGrade) : undefined,
  };
}

export function validateSignupForm(form: SignupFormState): FieldErrors<SignupField> {
  const errors: FieldErrors<SignupField> = {};

  if (!form.organizationId) errors.organizationId = 'Select a transportation provider.';
  if (!form.adminUserId) errors.adminUserId = 'Select an administrator.';
  if (form.role === 'parent' && !form.schoolId) errors.schoolId = 'Select a school.';
  if (!form.firstName.trim()) errors.firstName = 'First name is required.';
  if (!form.lastName.trim()) errors.lastName = 'Last name is required.';
  if (!form.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  if (!form.phone.trim()) errors.phone = 'Phone number is required.';
  if (form.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }
  if (form.password !== form.passwordConfirm) errors.passwordConfirm = 'Passwords do not match.';
  if (!form.address.trim()) errors.address = 'Street address is required.';
  if (!form.city.trim()) errors.city = 'City is required.';
  if (!form.state.trim()) errors.state = 'State is required.';
  if (!form.zip.trim()) errors.zip = 'ZIP code is required.';

  return errors;
}

const SIGNUP_FIELD_MAP: Record<string, SignupField> = {
  organization_id: 'organizationId',
  admin_user_id: 'adminUserId',
  school_id: 'schoolId',
  first_name: 'firstName',
  last_name: 'lastName',
  email: 'email',
  phone: 'phone',
  password: 'password',
  password_confirmation: 'passwordConfirm',
  address: 'address',
  city: 'city',
  state: 'state',
  zip: 'zip',
};

/** Map Laravel signup validation errors to form fields. */
export function mapSignupApiErrors(
  apiErrors: Record<string, string[]> | undefined,
  message: string,
): { fieldErrors: FieldErrors<SignupField>; formError: string | null } {
  const fieldErrors: FieldErrors<SignupField> = {};
  const unmapped: string[] = [];

  if (apiErrors) {
    for (const [key, messages] of Object.entries(apiErrors)) {
      const mapped = SIGNUP_FIELD_MAP[key];
      const text = messages[0];
      if (!text) continue;
      if (mapped) {
        fieldErrors[mapped] = text;
      } else {
        unmapped.push(text);
      }
    }
  }

  const hasFieldError = Object.keys(fieldErrors).length > 0;
  const formError = hasFieldError ? (unmapped[0] ?? null) : (message || unmapped[0] || null);

  return { fieldErrors, formError };
}
