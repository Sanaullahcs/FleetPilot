const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SignInField = 'email' | 'password' | 'captcha';

export type FieldErrors<K extends string = string> = Partial<Record<K, string>>;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

/** Client-side sign-in validation — all fields checked together before submit. */
export function validateSignInForm(
  email: string,
  password: string,
  captchaValid: boolean,
): FieldErrors<SignInField> {
  const errors: FieldErrors<SignInField> = {};
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    errors.email = 'Email is required.';
  } else if (!isValidEmail(trimmedEmail)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!password) {
    errors.password = 'Password is required.';
  }

  if (!captchaValid) {
    errors.captcha = 'Enter the correct answer to continue.';
  }

  return errors;
}

const LOGIN_FIELD_MAP: Record<string, SignInField> = {
  email: 'email',
  password: 'password',
};

/** Map Laravel validation / auth errors to sign-in field errors. */
export function mapLoginApiErrors(
  apiErrors: Record<string, string[]> | undefined,
  message: string,
): { fieldErrors: FieldErrors<SignInField>; formError: string | null } {
  const fieldErrors: FieldErrors<SignInField> = {};
  const unmapped: string[] = [];

  if (apiErrors) {
    for (const [key, messages] of Object.entries(apiErrors)) {
      const mapped = LOGIN_FIELD_MAP[key];
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
