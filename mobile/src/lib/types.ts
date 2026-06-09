export type UserRole =
  | 'admin'
  | 'dispatcher'
  | 'driver'
  | 'contractor'
  | 'school_contact'
  | 'parent';

export interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  organization: { id: string; name: string; slug: string } | null;
  roles: string[];
  permissions: string[];
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser;
}
