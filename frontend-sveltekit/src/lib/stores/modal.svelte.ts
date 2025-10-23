/**
 * Modal store for managing modal state
 * Uses Svelte 5 runes for reactive state management
 */

export type ModalType = 'pets' | 'notifications' | 'payment' | 'referral' | null;

interface ModalState {
  isOpen: boolean;
  type: ModalType;
  data?: any;
}

class ModalStore {
  private state = $state<ModalState>({
    isOpen: false,
    type: null,
    data: undefined
  });

  get isOpen() {
    return this.state.isOpen;
  }

  get type() {
    return this.state.type;
  }

  get data() {
    return this.state.data;
  }

  open(type: ModalType, data?: any) {
    this.state = {
      isOpen: true,
      type,
      data
    };
  }

  close() {
    this.state = {
      isOpen: false,
      type: null,
      data: undefined
    };
  }
}

export const modalStore = new ModalStore();
