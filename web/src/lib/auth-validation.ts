import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required.").email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

/** Read current input values — browser autofill often skips react-hook-form onChange. */
export function readAuthFormValues(form: HTMLFormElement) {
  const email = (form.elements.namedItem("email") as HTMLInputElement | null)?.value ?? "";
  const password = (form.elements.namedItem("password") as HTMLInputElement | null)?.value ?? "";
  return { email: email.trim(), password };
}
