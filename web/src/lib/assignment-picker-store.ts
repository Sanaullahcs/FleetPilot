export interface RichPickerOption {
  id: string;
  label: string;
  sublabel?: string;
  meta?: string;
  searchText?: string;
}

export interface AssignmentPickerConfig {
  title: string;
  description: string;
  hint?: string;
  options: RichPickerOption[];
  currentId?: string | null;
  emptyLabel?: string;
  confirmLabel?: string;
  allowEmpty?: boolean;
}

type Listener = () => void;

let open = false;
let config: AssignmentPickerConfig | null = null;
let resolveFn: ((value: string | null | false) => void) | null = null;
const listeners = new Set<Listener>();

/** Stable reference for useSyncExternalStore — only replaced when state actually changes. */
let snapshot: { open: boolean; config: AssignmentPickerConfig | null } = { open: false, config: null };

function syncSnapshot() {
  snapshot = { open, config };
}

function emit() {
  syncSnapshot();
  listeners.forEach((fn) => fn());
}

export function subscribeAssignmentPicker(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getAssignmentPickerState() {
  return snapshot;
}

export function openAssignmentPicker(cfg: AssignmentPickerConfig): Promise<string | null | false> {
  if (resolveFn) resolveFn(false);

  return new Promise((resolve) => {
    resolveFn = resolve;
    config = cfg;
    open = true;
    emit();
  });
}

export function confirmAssignmentPicker(value: string | null) {
  const fn = resolveFn;
  resolveFn = null;
  open = false;
  config = null;
  emit();
  fn?.(value);
}

export function cancelAssignmentPicker() {
  const fn = resolveFn;
  resolveFn = null;
  open = false;
  config = null;
  emit();
  fn?.(false);
}
