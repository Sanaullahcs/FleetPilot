import Swal from "sweetalert2";
import { brand } from "@/lib/brand";

const base = Swal.mixin({
  customClass: {
    confirmButton: "!rounded-lg !px-5 !py-2.5 !font-semibold !shadow-sm",
    cancelButton: "!rounded-lg !px-5 !py-2.5 !font-medium",
    popup: "!rounded-2xl !shadow-xl",
  },
  buttonsStyling: true,
  confirmButtonColor: brand.primary,
  cancelButtonColor: "#64748B",
});

export function toastSuccess(title: string, text?: string) {
  return base.fire({
    icon: "success",
    title,
    text,
    timer: 2800,
    timerProgressBar: true,
    showConfirmButton: false,
    toast: true,
    position: "top-end",
  });
}

export function toastError(title: string, text?: string) {
  return base.fire({
    icon: "error",
    title,
    text,
    timer: 4000,
    timerProgressBar: true,
    showConfirmButton: false,
    toast: true,
    position: "top-end",
  });
}

export function toastInfo(title: string, text?: string) {
  return base.fire({
    icon: "info",
    title,
    text,
    timer: 3000,
    showConfirmButton: false,
    toast: true,
    position: "top-end",
  });
}

export async function confirmDelete(entityLabel: string): Promise<boolean> {
  const result = await base.fire({
    title: "Delete this record?",
    html: `<p class="text-sm text-slate-600">You are about to delete <strong>${entityLabel}</strong>. This cannot be undone.</p>`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete",
    cancelButtonText: "Cancel",
    confirmButtonColor: brand.danger,
    focusCancel: true,
  });
  return result.isConfirmed;
}

export async function confirmLogout(): Promise<boolean> {
  const result = await base.fire({
    title: "Sign out?",
    text: "You will need to sign in again to access the dashboard.",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Sign out",
    cancelButtonText: "Stay signed in",
  });
  return result.isConfirmed;
}

export async function confirmAction(
  title: string,
  text: string,
  confirmText = "Confirm",
): Promise<boolean> {
  const result = await base.fire({
    title,
    text,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: "Cancel",
    confirmButtonColor: brand.primary,
  });
  return result.isConfirmed;
}

export async function confirmBlock(userName: string, isActive: boolean): Promise<boolean> {
  return confirmAction(
    isActive ? "Block this user?" : "Activate this user?",
    isActive
      ? `${userName} will no longer be able to sign in.`
      : `${userName} will regain access to FleetPilot.`,
    isActive ? "Block user" : "Activate user",
  );
}

export async function promptResetPassword(userName: string): Promise<string | null> {
  const result = await base.fire({
    title: "Reset password",
    html: `<p class="text-sm text-slate-600 mb-3">Set a new password for <strong>${userName}</strong>.</p>
      <input id="swal-pw" type="password" class="swal2-input" placeholder="New password (min 8 chars)" autocomplete="new-password">
      <input id="swal-pw2" type="password" class="swal2-input" placeholder="Confirm password" autocomplete="new-password">`,
    showCancelButton: true,
    confirmButtonText: "Update password",
    cancelButtonText: "Cancel",
    focusConfirm: false,
    preConfirm: () => {
      const password = (document.getElementById("swal-pw") as HTMLInputElement)?.value ?? "";
      const confirm = (document.getElementById("swal-pw2") as HTMLInputElement)?.value ?? "";
      if (password.length < 8) {
        Swal.showValidationMessage("Password must be at least 8 characters.");
        return false;
      }
      if (password !== confirm) {
        Swal.showValidationMessage("Passwords do not match.");
        return false;
      }
      return password;
    },
  });
  return result.isConfirmed ? (result.value as string) : null;
}
