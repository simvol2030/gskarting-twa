/**
 * Toast notification store
 * Uses Svelte 5 runes for reactive state management
 */

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

class ToastStore {
  private toasts = $state<Toast[]>([]);

  get items() {
    return this.toasts;
  }

  show(message: string, type: ToastType = 'info', duration: number = 3000) {
    const id = `toast-${Date.now()}-${Math.random()}`;

    const toast: Toast = {
      id,
      message,
      type,
      duration
    };

    this.toasts = [...this.toasts, toast];

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }

    return id;
  }

  remove(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  clear() {
    this.toasts = [];
  }
}

export const toastStore = new ToastStore();
