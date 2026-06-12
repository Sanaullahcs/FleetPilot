import { create } from 'zustand';

export type SweetAlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export interface SweetAlertOptions {
  type?: SweetAlertType;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
}

interface SweetAlertState extends SweetAlertOptions {
  visible: boolean;
}

interface SweetAlertStore extends SweetAlertState {
  show: (options: SweetAlertOptions) => void;
  hide: () => void;
}

const initial: SweetAlertState = {
  visible: false,
  type: 'info',
  title: '',
  message: '',
  confirmText: 'OK',
  cancelText: 'Cancel',
};

/** Pull-to-refresh should never pop a modal — block legacy/stale refresh toasts. */
function isRefreshNoiseAlert(options: SweetAlertOptions): boolean {
  const type = options.type ?? 'info';
  if (type === 'confirm' || type === 'error' || type === 'warning') {
    return false;
  }
  const text = `${options.title} ${options.message ?? ''}`.toLowerCase();
  return (
    text.includes('refreshed') ||
    text.includes('latest student data') ||
    text.includes('live positions refreshed') ||
    text.includes('map updated') ||
    text.includes('positions refresh every')
  );
}

export const useSweetAlertStore = create<SweetAlertStore>((set) => ({
  ...initial,
  show: (options) => {
    if (isRefreshNoiseAlert(options)) {
      return;
    }
    set({
      visible: true,
      type: options.type ?? 'info',
      title: options.title,
      message: options.message ?? '',
      confirmText: options.confirmText ?? (options.type === 'confirm' ? 'Confirm' : 'OK'),
      cancelText: options.cancelText ?? 'Cancel',
      onConfirm: options.onConfirm,
      onCancel: options.onCancel,
    });
  },
  hide: () => set({ ...initial }),
}));

export function showSweetAlert(options: SweetAlertOptions) {
  useSweetAlertStore.getState().show(options);
}

export function showConfirmAlert(
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>,
  options?: Partial<SweetAlertOptions>,
) {
  showSweetAlert({
    type: 'confirm',
    title,
    message,
    confirmText: options?.confirmText ?? 'Confirm',
    cancelText: options?.cancelText ?? 'Cancel',
    onConfirm,
    ...options,
  });
}
