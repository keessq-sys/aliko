import { writable } from 'svelte/store';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export const toasts = writable<Toast[]>([]);
export const modalOpen = writable(false);
export const modalContent = writable<string>('');
export const sidebarOpen = writable(false);

export function addToast(toast: Omit<Toast, 'id'>) {
  const id = Math.random().toString(36).slice(2);
  toasts.update(t => [...t, { ...toast, id }]);
  setTimeout(() => removeToast(id), toast.duration ?? 4000);
}

export function removeToast(id: string) {
  toasts.update(t => t.filter(x => x.id !== id));
}
