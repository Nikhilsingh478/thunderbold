// Global Modal Control System for Login Modal
// Provides a centralized way to control the login modal from anywhere in the app

export type ModalTriggerSource = 'requireAuth' | 'delayedPrompt' | 'manual';

export interface ModalControlEvent {
  type: 'open-login-modal' | 'close-login-modal';
  source: ModalTriggerSource;
  context?: any;
}

class ModalController {
  private static instance: ModalController;
  private listeners: ((event: ModalControlEvent) => void)[] = [];

  private constructor() {}

  static getInstance(): ModalController {
    if (!ModalController.instance) {
      ModalController.instance = new ModalController();
    }
    return ModalController.instance;
  }

  // Open login modal with specific source
  openModal(source: ModalTriggerSource, context?: any): void {
    const event: ModalControlEvent = {
      type: 'open-login-modal',
      source,
      context
    };
    this.notifyListeners(event);
    
    // Also dispatch DOM event for backward compatibility
    window.dispatchEvent(new CustomEvent('open-login-modal', { 
      detail: { source, context } 
    }));
  }

  // Close login modal
  closeModal(): void {
    const event: ModalControlEvent = {
      type: 'close-login-modal',
      source: 'manual'
    };
    this.notifyListeners(event);
    
    // Also dispatch DOM event for backward compatibility
    window.dispatchEvent(new CustomEvent('close-login-modal'));
  }

  // Subscribe to modal events
  subscribe(listener: (event: ModalControlEvent) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(event: ModalControlEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in modal event listener:', error);
      }
    });
  }
}

// Export singleton instance
export const modalController = ModalController.getInstance();

// Export convenience functions for common operations
export const openLoginModal = (source: ModalTriggerSource = 'manual', context?: any) => {
  modalController.openModal(source, context);
};

export const closeLoginModal = () => {
  modalController.closeModal();
};
